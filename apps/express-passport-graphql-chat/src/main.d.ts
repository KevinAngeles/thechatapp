export interface Message {
  id: number;
  user: string;
  nickname: string;
  content: string;
}

export type SubscriberFn = () => void;

export interface OnMessagesUpdatesFn {
  (fn: SubscriberFn): void;
}

export interface Resolvers {
  [key: string];
  Query: {
    messages: () => Message[];
  };
  Mutation: {
    postMessage: (parent: unknown, args: { user: string; nickname: string; content: string }) => number;
  };
  Subscription: {
    messages: {
      subscribe: (parent: unknown, args: unknown, context: unknown) => AsyncIterator<Message[]>;
    };
  };
}
