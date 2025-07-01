/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import passport from 'passport';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import passportConfig from './config/passport-config';
import authRoutes from './routes/auth';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { PubSub } from 'graphql-subscriptions';
import { Message, OnMessagesUpdatesFn, Resolvers, SubscriberFn } from './main.d';
import { messageInputSchema } from './validation/message.schema';
import { GraphQLError } from 'graphql';

dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_BASE_URL,
  credentials: true
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// Initialize Passport and use session
app.use(passport.initialize());
app.use(passport.session());

// Passport middleware
passportConfig(passport);

// Routes
app.use('/api/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const QUERY_DOMAIN = 'http://localhost';
const WS_DOMAIN = 'ws://localhost';
const GRAPHQL_PATH = process.env.GRAPHQL_PATH || '/graphql';
const GRAPHQL_PORT = process.env.GRAPHQL_PORT || 4000;
const pubsub = new PubSub();
const messages: Message[] = [];

const typeDefs = `
  type Message {
    id: ID!
    user: String!
    nickname: String!
    content: String!
  }
  
  type Query {
    messages: [Message!]
  }

  type Mutation {
    postMessage(user: String!, nickname: String!, content: String!): ID!
  }

  type Subscription {
    messages: [Message!]
  }
`;

const subscribers: SubscriberFn[] = [];

const onMessagesUpdates: OnMessagesUpdatesFn = (fn: SubscriberFn) => subscribers.push(fn);

const resolvers: Resolvers = {
  Query: {
    messages: (): Message[] => messages,
  },
  Mutation: {
    postMessage: (parent: unknown, { user, nickname, content }: { user: string; nickname: string; content: string }): number => {
      // Validate input
      const validation = messageInputSchema.safeParse({ user, nickname, content });
      
      if (!validation.success) {
        const errorMessage = validation.error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join('; ');
        throw new GraphQLError(`Validation failed: ${errorMessage}`, {
          extensions: {
            code: 'VALIDATION_ERROR'
          }
        });
      }
      const id = messages.length;
      messages.push({
        id,
        user,
        nickname,
        content,
      });
      // Notify all subscribers about the new message.
      subscribers.forEach((fn) => fn());
      return id;
    },
  },
  Subscription: {
    messages: {
      subscribe: (parent: unknown, args: unknown, context: unknown): AsyncIterator<Message[]> => {
        const channel = Math.random().toString(36).slice(2, 15);
        onMessagesUpdates(() => pubsub.publish(channel, { messages }));
        setTimeout(() => pubsub.publish(channel, { messages }), 0);
        return pubsub.asyncIterableIterator(channel);
      },
    },
  },
};

// Create schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server; we will attach the WebSocket
// server and the ApolloServer to this HTTP server.
const httpServer = createServer(app);

// Set up WebSocket server.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});
const serverCleanup = useServer({ schema }, wsServer);

// Set up ApolloServer.
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

(async () => {
  await server.start();
  app.use(GRAPHQL_PATH, cors<cors.CorsRequest>(), bodyParser.json(), expressMiddleware(server));
  // Now that our HTTP server is fully set up, actually listen.
  httpServer.listen(GRAPHQL_PORT, () => {
    console.log(`Query endpoint ready at ${QUERY_DOMAIN}:${GRAPHQL_PORT}${GRAPHQL_PATH}`);
    console.log(`Subscription endpoint ready at ${WS_DOMAIN}:${GRAPHQL_PORT}${GRAPHQL_PATH}`);
  });
})();
