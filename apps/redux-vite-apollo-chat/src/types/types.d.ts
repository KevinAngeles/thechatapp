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
    sessionStatus: TRequestStatus;
}

export interface IRegisterPayload {
    username: string
    password: string
    nickname: string
}

export interface ILoginPayload {
    username: string
    password: string
    keepLogged: boolean
}

export interface ILogoutPayload {
    username: string
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
        username: string[];
        password: string[];
        nickname?: string[];
    }
}
interface ISessionData {
    loggedIn: boolean;
    user ?: IAuthenticatedUser;
}
interface IAuthenticatedUser {
    publicId: string;
    nickname: string;
}
interface IValidData {
    message: string;
    user: IAuthenticatedUser;
}