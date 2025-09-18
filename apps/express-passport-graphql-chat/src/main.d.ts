export type ConnectionEventType = 'CONNECTED' | 'DISCONNECTED';

export interface ConnectionEvent {
	type: ConnectionEventType;
	sessionId: string;
	publicId: string;
	nickname: string;
	timestamp: string;
}

export interface Message {
	id: number;
	user: string;
	nickname: string;
	content: string;
}

export type SubscriberFn = () => void;
export type OnMessagesUpdatesFn = (fn: SubscriberFn) => void;

// Custom (legacy) Resolvers interface retained for compatibility with existing code parts.
// This does not have to match the generated GraphQL Codegen Resolvers exactly; it's for local logic typing.
export interface Resolvers {
	Query: {
		messages: () => Message[];
		connectedClients: () => string[];
	};
	Mutation: {
		postMessage: (parent: unknown, args: { user: string; nickname: string; content: string }) => number;
	};
	Subscription: {
		messages: {
			subscribe: (parent: unknown, args: unknown, context: unknown, info: unknown) => AsyncIterator<{ messages: Message[] }>;
		};
		connectionEvents: {
			subscribe: (parent: unknown, args: unknown, context: unknown, info: unknown) => AsyncIterator<{ connectionEvents: ConnectionEvent }>;
		};
	};
}
