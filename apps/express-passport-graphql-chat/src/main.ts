/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express, { Request } from 'express';
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
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer, WebSocket as WsWebSocket } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { PubSub } from 'graphql-subscriptions';
import jwt from 'jsonwebtoken';
import { IJwtPayload } from './config/passport-config.d';
import { User } from './models/User';
import { OnMessagesUpdatesFn, SubscriberFn, Message as LocalMessage, ConnectionEvent as LocalConnectionEvent } from './main.d';
import { Resolvers as GqlResolvers } from './generated/graphql';
import { messageInputSchema } from './validation/message.schema';
import { GraphQLError } from 'graphql';

dotenv.config();

const app = express();

/**
 * Environment variables used:
 *  - MONGO_URI: Mongo connection string
 *  - SESSION_SECRET: Express session secret
 *  - CLIENT_ORIGINS: (preferred) comma-separated list of allowed origins, e.g.
 *        http://localhost:5173,http://127.0.0.1:5173
 *  - GRAPHQL_PATH: path for GraphQL (default /graphql)
 *  - GRAPHQL_PORT: port for GraphQL HTTP/WebSocket server (default 4000)
 *  - NODE_ENV: environment (development/production)
 */

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// CORS configuration
// We must NOT use wildcard origin when sending credentials (cookies) from the browser.
const rawOrigins = process.env.CLIENT_ORIGINS || '';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin requests (like server-to-server or curl w/out origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

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

interface PubSubPayloads {
  [key: string]: unknown;
  MESSAGES: { messages: { id: string; user: string; nickname: string; content: string }[] };
  CONNECTION_EVENTS: { connectionEvents: { sessionId: string; publicId: string; nickname: string; type: 'CONNECTED' | 'DISCONNECTED'; timestamp: string } };
}

const pubsub = new PubSub<PubSubPayloads>();
const messages: LocalMessage[] = [];

// Track connected clients
const connectedClients = new Set<string>();
const connectionSubscribers: ((event: LocalConnectionEvent) => void)[] = [];
const onConnectionEvent = (event: LocalConnectionEvent) => {
  if (event.type === 'CONNECTED') {
    connectedClients.add(event.sessionId);
  } else if (event.type === 'DISCONNECTED') {
    connectedClients.delete(event.sessionId);
  }
  connectionSubscribers.forEach(fn => fn(event));
  pubsub.publish('CONNECTION_EVENTS', { connectionEvents: event });
};

// Simple cookie parser for WS upgrade requests (cannot rely on express cookie-parser here)
function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.split('=');
    if (!key) return acc;
    const trimmedKey = key.trim();
    const value = rest.join('=').trim();
    if (trimmedKey) acc[trimmedKey] = decodeURIComponent(value);
    return acc;
  }, {});
}

interface ConnectionMeta {
  sessionId: string; // session id (sid)
  publicId: string;   // publicId (sub)
  nickname: string;
}

// Internal shapes used for strongly-typed field resolvers (avoid 'any')
interface InternalConnectionEvent { sessionId: string; publicId: string; nickname: string; timestamp: string; type: 'CONNECTED' | 'DISCONNECTED' }

// Store metadata per underlying ws connection
// Using WebSocket from 'ws'; underlying socket instance type is WebSocket
// The ws library WebSocket type
const connectionMeta = new WeakMap<WsWebSocket, ConnectionMeta>();

const typeDefs = `
  type Message {
    id: ID!
    user: String!
    nickname: String!
    content: String!
  }
  
  enum ConnectionEventType {
    CONNECTED
    DISCONNECTED
  }
  
  type ConnectionEvent {
    type: ConnectionEventType!
    sessionId: String!
    publicId: String!
    nickname: String!
    timestamp: String!
  }
  
  type Query {
    messages: [Message!]
    connectedClients: [String!]!
  }

  type Mutation {
    postMessage(content: String!): ID!
  }

  type Subscription {
    messages: [Message!]
    connectionEvents: ConnectionEvent!
  }
`;

const subscribers: SubscriberFn[] = [];

const onMessagesUpdates: OnMessagesUpdatesFn = (fn: SubscriberFn) => subscribers.push(fn);

const resolvers: GqlResolvers = {
  Query: {
    messages: () => messages.map(m => ({
      ...m,
      id: m.id.toString(),
    })),
    connectedClients: () => Array.from(connectedClients),
  },
  Mutation: {
    // Identity is derived solely from the verified accessToken cookie (see HTTP context function).
    // This prevents spoofing another user's publicId or nickname.
    postMessage: (_parent, { content }, context) => {
      try {
        // Enforce authentication: context must contain derived identity
        if (!context || !context.publicId || !context.nickname) {
          throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
        }

        // Validate input (only content now)
        const validation = messageInputSchema.safeParse({ content });
        if (!validation.success) {
          const errorMessage = validation.error.issues
            .map((issue) => `${issue.path.map(String).join('.')}: ${issue.message}`)
            .join('; ');
          throw new GraphQLError(`Validation failed: ${errorMessage}`, {
            extensions: { code: 'VALIDATION_ERROR' }
          });
        }

        const id = messages.length;
        const newMessage = {
          id,
          user: context.publicId, // still stored under 'user' field; represents publicId
          nickname: context.nickname,
          content,
        };
        messages.push(newMessage);

        subscribers.forEach((fn) => fn());
        pubsub.publish('MESSAGES', { messages: messages.map(m => ({
          ...m,
          id: m.id.toString(),
        })) });
        return id.toString();
      } catch (error: unknown) {
        console.error('Error in postMessage:', error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('An unexpected error occurred', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
  },
  Subscription: {
    messages: {
      subscribe: (parent, args, ctx, info) => {
        void parent; void args; void ctx; void info;
        const channel = Math.random().toString(36).slice(2, 15);
        onMessagesUpdates(() => pubsub.publish(channel, {
          messages: messages.map(m => ({ ...m, id: m.id.toString() }))
        }));
        setTimeout(() => pubsub.publish(channel, {
          messages: messages.map(m => ({ ...m, id: m.id.toString() }))
        }), 0);
        return pubsub.asyncIterableIterator(channel);
      }
    },
    connectionEvents: {
      subscribe: (parent, args, ctx, info) => {
        void parent; void args; void ctx; void info;
        const channel = 'CONNECTION_EVENTS';
        return pubsub.asyncIterableIterator<{ connectionEvents: LocalConnectionEvent }>(channel);
      }
    },
  },
  Message: {
    // Only override id to coerce internal numeric id to GraphQL ID (string).
    id: (parent) => (parent as { id: string }).id,
    user: (parent) => parent.user,
    nickname: (parent) => parent.nickname,
    content: (parent) => parent.content,
  },
  ConnectionEvent: {
    sessionId: (parent) => (parent as InternalConnectionEvent).sessionId,
    publicId: (parent) => (parent as InternalConnectionEvent).publicId,
    nickname: (parent) => (parent as InternalConnectionEvent).nickname,
    timestamp: (parent) => (parent as InternalConnectionEvent).timestamp,
    type: (parent) => (parent as InternalConnectionEvent).type,
  },
};

// Create schema, which will be used separately by ApolloServer and the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server; we will attach the WebSocket
// server and the ApolloServer to this HTTP server.
const httpServer = createServer(app);

// Set up WebSocket server.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: GRAPHQL_PATH,
});

const serverCleanup = useServer({
  schema,
  onConnect: async (ctx) => {
    try {
      // Extract cookies from initial WS upgrade HTTP request
      const cookieHeader = ctx.extra.request.headers['cookie'];
      const cookies = parseCookies(cookieHeader);
      const accessToken = cookies['accessToken'];
      if (!accessToken) {
        throw new Error('Missing accessToken cookie');
      }
      let decoded: IJwtPayload;
      try {
        decoded = jwt.verify(accessToken, process.env.JWT_SECRET as string) as IJwtPayload;
      } catch {
        throw new Error('Invalid or expired access token');
      }
      // Basic claim validation (mirror passport strategy logic)
      if (decoded.iss !== (process.env.JWT_ISSUER || 'thechatapp') || decoded.aud !== (process.env.JWT_AUDIENCE || 'thechatapp')) {
        throw new Error('Token claim validation failed');
      }
      // Retrieve user to enrich metadata (nickname)
      const user = await User.findOne({ publicId: decoded.sub });
      if (!user) {
        throw new Error('User not found');
      }
      if (user.tokenVersion !== decoded.ver) {
        throw new Error('Token version mismatch');
      }
      const sessionId = decoded.sid; // session id
      const publicId = decoded.sub;  // publicId
      const nickname = user.nickname || 'Anonymous User';

      // Store metadata for disconnect & subscriptions
      connectionMeta.set(ctx.extra.socket as unknown as WsWebSocket, { sessionId, publicId, nickname });

      console.log(`Client connected: ${sessionId} (PublicId: ${publicId}, Nickname: ${nickname})`);
      onConnectionEvent({
        type: 'CONNECTED',
        sessionId,
        publicId,
        nickname,
        timestamp: new Date().toISOString(),
      });
      // Optionally return value to expose in subscription context (not used yet)
      return true;
    } catch (error) {
      console.warn('WebSocket connection rejected:', (error as Error).message);
      throw error; // reject the connection
    }
  },
  onDisconnect: (ctx) => {
    const meta = connectionMeta.get(ctx.extra.socket as unknown as WsWebSocket);
    if (meta) {
      console.log(`Client disconnected: ${meta.sessionId} (PublicId: ${meta.publicId})`);
      onConnectionEvent({
        type: 'DISCONNECTED',
        sessionId: meta.sessionId,
        publicId: meta.publicId,
        nickname: meta.nickname,
        timestamp: new Date().toISOString(),
      });
      connectionMeta.delete(ctx.extra.socket as unknown as WsWebSocket);
    } else {
      console.log('Client disconnected (metadata not found)');
    }
  },
  onError: (ctx, message, errors) => {
    const meta = connectionMeta.get(ctx.extra.socket as unknown as WsWebSocket);
    console.error('WebSocket error:', {
      sessionId: meta?.sessionId,
      publicId: meta?.publicId,
      message,
      errors
    });
  },
}, wsServer);

// Set up ApolloServer.
// Build a context function for HTTP operations to derive identity from the accessToken cookie.
// This mirrors the logic in the WebSocket onConnect handler so mutations/queries cannot spoof identity.
interface GraphQLContext {
  sessionId?: string;
  publicId?: string;
  nickname?: string;
  // raw user doc could be added later if needed
}

const server = new ApolloServer<GraphQLContext>({
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
  // IMPORTANT: reuse the same CORS options for the GraphQL endpoint so that
  // credentials are accepted and origin is validated consistently.
  app.use(GRAPHQL_PATH, cors<cors.CorsRequest>(corsOptions), bodyParser.json(), expressMiddleware(server, {
    context: async ({ req }): Promise<GraphQLContext> => {
      try {
        const request = req as Request & { cookies?: Record<string, string> };
        const accessToken = request.cookies?.accessToken;
        if (!accessToken) return {};
        let decoded: IJwtPayload;
        try {
          decoded = jwt.verify(accessToken, process.env.JWT_SECRET as string) as IJwtPayload;
        } catch {
          return {}; // silently return empty context; resolver can enforce auth if required
        }
        if (decoded.iss !== (process.env.JWT_ISSUER || 'thechatapp') || decoded.aud !== (process.env.JWT_AUDIENCE || 'thechatapp')) {
          return {};
        }
        const user = await User.findOne({ publicId: decoded.sub });
        if (!user) return {};
        if (user.tokenVersion !== decoded.ver) return {};
        return { sessionId: decoded.sid, publicId: decoded.sub, nickname: user.nickname };
      } catch {
        return {};
      }
    }
  }));
  // Now that our HTTP server is fully set up, actually listen.
  httpServer.listen(GRAPHQL_PORT, () => {
    console.log(`Query endpoint ready at ${QUERY_DOMAIN}:${GRAPHQL_PORT}${GRAPHQL_PATH}`);
    console.log(`Subscription endpoint ready at ${WS_DOMAIN}:${GRAPHQL_PORT}${GRAPHQL_PATH}`);
  });
})();
