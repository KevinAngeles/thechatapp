import { ApolloClient, InMemoryCache, ApolloProvider, useMutation, gql, useSubscription, ApolloLink } from '@apollo/client';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { useState } from 'react';
import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { OnMessageSubscription } from '@appTypes/types';
import { useSelector } from 'react-redux';
import { logoutUser, selectLoggedUser } from '@components/appSlice';
import { useAppDispatch } from '@app/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
const GRAPHQL_URL_HTTP = import.meta.env.VITE_GRAPHQL_URL_HTTP as string;
const GRAPHQL_URL_WS = import.meta.env.VITE_GRAPHQL_URL_WS as string;
// HTTP link now explicitly includes credentials so that the browser will send
// the HTTP-only auth cookie with each GraphQL query/mutation request.
const httpLink = new HttpLink({
    uri: GRAPHQL_URL_HTTP,
    credentials: 'include'
});

const wsLink = new GraphQLWsLink(createClient({
    url: GRAPHQL_URL_WS,
    // The server should authenticate the WebSocket connection using the
    // HTTP-only cookie automatically included in the initial WS upgrade request.
    connectionParams: async () => {
        console.log('Creating WebSocket connection (no client-stored token/clientId).');
        return {};
    },
    connectionAckWaitTimeout: 10000, // 10 seconds
    shouldRetry: (error) => {
        console.log('WebSocket error, retrying...', error);
        return true;
    },
    retryAttempts: 5,
    retryWait: (retries) => new Promise(resolve => 
        setTimeout(resolve, Math.min(1000 * 2 ** retries, 10000))
    ),
    on: {
        connected: () => {
            console.log('WebSocket connected');
        },
        error: (err) => {
            console.error('WebSocket error:', err);
        },
        closed: () => {
            console.log('WebSocket connection closed');
        },
        ping: (received) => {
            if (!received) {
                console.log('Ping sent to server');
            } else {
                console.log('Pong received from server');
            }
        }
    }
}));

// The split function takes three parameters:
//
// * A function that's called for each operation to execute
// * The Link to use for an operation if the function returns a "truthy" value
// * The Link to use for an operation if the function returns a "falsy" value
const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink,
);

// Server-side schema now derives user identity (publicId & nickname) from the
// accessToken cookie; only 'content' is accepted as an argument.
// Return the created message ID so the client can confirm success.
const POST_MESSAGE = gql`
    mutation PostMessage($content: String!) {
        postMessage(content: $content)
    }
`;

const MESSAGE_SUBSCRIPTION: TypedDocumentNode<OnMessageSubscription> = gql`
    subscription messages {
        messages {
            id
            content
            user
            nickname
        }
    }
`;

const client = new ApolloClient({
    link: ApolloLink.from([
        new ApolloLink((operation, forward) => {
            console.log('GraphQL operation:', operation.operationName);
            return forward(operation);
        }),
        splitLink
    ]),
    devtools: {
        enabled: true
    },
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'cache-and-network',
            errorPolicy: 'all',
        },
        query: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
        },
        mutate: {
            errorPolicy: 'all',
        },
    },
});

const Messages = () => {
    console.log('Rendering Messages component');
    const dispatch = useAppDispatch();
    const [postMessage] = useMutation(POST_MESSAGE, {
        onError: (error) => console.error('Mutation error:', error),
        onCompleted: (data) => console.log('Message sent:', data)
    });
    
    const [messageChat, setMessageChat] = useState("");
    const [showSidebar, setShowSidebar] = useState(true);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const userChat = useSelector(selectLoggedUser);
    
    console.log('Current user in Chat:', userChat);
    
    const { data, error, loading } = useSubscription<OnMessageSubscription>(
        MESSAGE_SUBSCRIPTION,
        {
            onData: ({ data }) => {
                console.log('New subscription data:', data);
                setConnectionError(null);
            },
            onError: (err) => {
                console.error('Subscription error:', err);
                setConnectionError('Failed to connect to chat. Please refresh the page.');
            },
            shouldResubscribe: true
        }
    );
    
    if (!userChat) {
        return <div>Please log in to access the chat.</div>;
    }
    
    if (loading) {
        return <div>Connecting to chat...</div>;
    }
    
    if (error || connectionError) {
        return (
            <div className="error-message">
                <p>Error connecting to chat: {error?.message || connectionError}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }
    
    const extractUniqueUsers = (data: OnMessageSubscription | undefined): string[] => {
        const users = new Set<string>();
        if (userChat) {
            users.add(userChat.nickname);
        }
        if (data?.messages) {
            data.messages.forEach(({ nickname }) => {
                if (nickname) {
                    users.add(nickname);
                }
            });
        }
        return Array.from(users);
    }

    const sendMessage = () => {
        console.log('Sending message', { messageChat, userChatDerived: { publicId: userChat?.publicId, nickname: userChat?.nickname } });
        postMessage({
            variables: { content: messageChat }
        });
        setMessageChat('');
    };

    const sendMessageKeyDownHandler = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    };
    
    const handleSendButton = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        sendMessage();
    };

    const handleClickLogout = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        // Always attempt logout: server uses cookie to identify session even if
        // client state is stale or userChat is null.
        if (userChat) {
            console.log("Logging out user (local state)", userChat);
        } else {
            console.warn("Logout requested with no local user; proceeding anyway (cookie-based session).");
        }
        dispatch(logoutUser());
    }

    const handleMessageOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessageChat(event.target.value);
    };
    
    const handleToggleSidebar = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        setShowSidebar(!showSidebar);
    }
    
    return (
        <div className={showSidebar ? "container-chat" : "container-chat container-chat--collapsed"}>
            <div className="sidebar">
                {
                    showSidebar ?
                    (
                        <div className="sidebar-header">
                            <div className="header-logo">CH</div>
                            <h1 className="header-title">The Chat App</h1>
                        </div>
                    )
                    :
                    (
                        <div className="sidebar-header show-sidebar--collapsed">
                            <div className="header-logo">CH</div>
                        </div>
                    )
                }
                <div className="sidebar-title">
                    {
                        showSidebar && (<div className="title-name">User List</div>)
                    }
                    <div className="sidebar-button">
                        <button className="button-toggle" title="Close chat" onClick={handleToggleSidebar}>
                            {
                                showSidebar
                                    ?
                                (<FontAwesomeIcon icon={faXmark} />)
                                    :
                                (<FontAwesomeIcon icon={faBars} />)
                            }
                        </button>
                    </div>
                </div>
                {
                    showSidebar && (<div className="sidebar-users">
                    {
                        extractUniqueUsers(data).map( ( nick ) => (
                            <div className="sidebar-username" key={nick}>{nick}</div>
                        ))
                    }
                    </div>)
                }
            </div>
            <div className="main">
                <div className="main-title">
                    <h2 className="main-name">My Channel</h2>
                    <div className="main-logout">
                        <button className="logout-button" onClick={handleClickLogout}  title="Logout">Logout</button>
                    </div>
                </div>
                <div className="main-content">
                {
                    data?.messages?.map(({ id, user: messageUser, nickname, content }, index) => (
                        <div className="main-card" key={id}>
                            <div className="card-logo">{nickname?.slice(0, 2).toUpperCase()}</div>
                            <div className="card-name">{nickname || 'Anonymous'}</div>
                            <div className="card-messages">
                                <div className="card-message">{content}</div>
                            </div>
                        </div>
                    ))
                }
                </div>
                <div className="main-chat">
                    <input
                        type="text"
                        className="chat-input"
                        required
                        onKeyDown={sendMessageKeyDownHandler}
                        onChange={handleMessageOnChange}
                        value={messageChat}
                        title="input text for chat"
                        placeholder="type your message"
                    />
                    <button
                        type="button"
                        className={((messageChat.length === 0) || (userChat === null)) ? "button button--disabled" : "button button--active"}
                        title="Send"
                        disabled={(messageChat.length === 0) || (userChat === null)}
                        onClick={handleSendButton}>
                            Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export const Chat = () => (
    <ApolloProvider client={client}>
        <div><Messages /></div>
    </ApolloProvider>
);