export type TRequestStatus = 'idle' | 'loading' | 'failed';
export interface LoginSliceState {
  loginStatus: TRequestStatus
}
export interface RegisterSliceState {
  registerStatus: TRequestStatus
}
export interface AppSliceState {
    loggedUser: IAuthenticatedUser | null;
    page: 'login' | 'register' | 'chat';
    logoutStatus: TRequestStatus;
}

export interface IRegisterPayload {
    userId: string
    password: string
    nickname: string
}

export interface ILoginPayload {
    userId: string
    password: string
}

export interface ILogoutPayload {
    userId: string
}

export interface RequestStatus {
    requestStatus: TRequestStatus,
}

export interface IUserResponse {
    user?: {
        id: string,
        nickname: string,
    }
    error?: string
}
/* Chat Start */
export interface OnMessageSubscription {
    messages: [{
        id: string;
        user: string;
        nickname: string;
        content: string;
    }];
}

export interface OnMessageSubscriptionVariables {
    user: string;
    nickname: string;
}

export interface IMessage {
    messages: [{ _typename: string, id: string, content: string, user: string, nickname: string }]
}

export interface IChat {
    userChat: string;
    messageChat: string;
}
/* Chat End */

/* Authentication */
interface IErrorData {
    message: string;
    user?: null;
    status?: number;
    fields?: {
        userId: string[];
        password: string[];
        nickname?: string[];
    }
}

interface IAuthenticatedUser {
    id: string;
    nickname: string;
}
interface IValidData {
    message: string;
    user: IAuthenticatedUser;
}