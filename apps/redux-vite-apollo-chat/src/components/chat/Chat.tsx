import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, useMutation, gql, QueryResult, useSubscription } from '@apollo/client';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { useState } from 'react';
import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { OnMessageSubscription, OnMessageSubscriptionVariables, IMessage, IChat } from '@/types/types';
import { useSelector } from 'react-redux';
import { logoutUser, selectLoggedUser } from '@/components/appSlice';
import { useAppDispatch } from '@/app/hooks';
const GRAPHQL_URL_HTTP = import.meta.env.VITE_GRAPHQL_URL_HTTP as string;
const GRAPHQL_URL_WS = import.meta.env.VITE_GRAPHQL_URL_WS as string;
const httpLink = new HttpLink({
    uri: GRAPHQL_URL_HTTP
});

const wsLink = new GraphQLWsLink(createClient({
    url: GRAPHQL_URL_WS
    // connectionParams: {
    //     authToken: user.authToken,
    // },
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

const GET_MESSAGES = gql`
query {
    messages {
        id
        content
        user
        nickname
    }
}`;

const POST_MESSAGE = gql`
mutation ($user: String!, $nickname: String!, $content: String!) {
    postMessage(user: $user, nickname: $nickname, content: $content)
}`;

const MESSAGE_SUBSCRIPTION: TypedDocumentNode<
    OnMessageSubscription,
    OnMessageSubscriptionVariables
> = gql`
    subscription messages {
        messages {
            id
            content
            user
            nickname
        }
}`;

const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache()
});

const Messages = () => {
    // const { data }: QueryResult<IMessage> = useQuery(SUBSCRIBE_MESSAGES, /*{
    const [postMessage] = useMutation(POST_MESSAGE);
    const [messageErrorMessage, setMessageErrorMessage] = useState('');
    const [messageChat, setMessageChat] = useState("");
    const [userErrorMessage, setUserErrorMessage] = useState('');
    const [userError, setUserError] = useState(false);
    const [messageError, setMessageError] = useState(false);
    // retrieve the user from the store using the useSelector hook
    const userChat = useSelector(selectLoggedUser);
    const { data } = useSubscription<OnMessageSubscription, OnMessageSubscriptionVariables>(MESSAGE_SUBSCRIPTION, { variables: { user: "", nickname: "" } });
    const dispatch = useAppDispatch();
    
    const extractUniqueUsers = (data: OnMessageSubscription): string[] => {
        const users = new Set<string>();
        if (userChat) {
            users.add(userChat.nickname);
        }
        data.messages.forEach(({ nickname }) => {
            users.add(nickname);
        });
        return Array.from(users);
    }

    const sendMessage = () => {
        console.log({ userChat, messageChat });
        postMessage({
            variables: { user: userChat?.id, nickname: userChat?.nickname, content: messageChat }
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
        if (userChat?.id) {
            console.log("Logging out user", userChat);
            dispatch(logoutUser({ userId: userChat.id }));
        } else {
            console.log("Cannot logout because user is not logged in.", userChat);
        }
    }

    const handleMessageOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessageChat(event.target.value);
    };
    
    if (!data) {
        return null;
    }
    return (
        <div className="container-chat">
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="header-logo">CH</div>
                    <h1 className="header-title">The Chat App</h1>
                </div>
                <div className="sidebar-title">
                    <div className="title-name">User List</div>
                    <div className="title-button">X</div>
                </div>
                <div className="sidebar-users">
                {
                    extractUniqueUsers(data).map( ( nick ) => (
                        <div className="sidebar-username" key={nick}>{nick}</div>
                    ))
                }
                </div>
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
                    data.messages.map(({ id, user: messageUser, nickname, content }, index) => (
                        <div className="main-card" key={id}>
                            <div className="card-logo">{nickname.slice(0, 2).toUpperCase()}</div>
                            <div className="card-name">{nickname}</div>
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