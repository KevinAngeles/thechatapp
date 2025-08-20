import { IErrorData, IValidData, ILoginPayload, IRegisterPayload, ILogoutPayload, ISessionData } from "@appTypes/types";

// Code for login API
const API_LOGIN_URL = import.meta.env.VITE_API_LOGIN_URL;
export const postLogin = async (userId: string, password: string, keepLogged: boolean): Promise<IValidData | IErrorData> => {
  try {
    const response = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies in the request
      body: JSON.stringify({ userId, password, keepLogged } as ILoginPayload),
    });
    if (!response.ok) {
      const loginError: IErrorData = await response.json();
      return loginError;
    }
    const data: IValidData = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Login error:', error);
    const loginError: IErrorData = {
      status: 500,
      message: 'Login: Server error. Please try again later.',
      user: null,
      fields: {
        userId: [],
        password: []
      }
    }
    return loginError;
  }
}

const API_ACCESS_URL = import.meta.env.VITE_API_ACCESS_URL;
export const postAccessToken = async (): Promise<IValidData | IErrorData> => {
  try {
    const response = await fetch(API_ACCESS_URL, {
      method: "POST",
      credentials: "include", // Include cookies in the request
    });
    if (!response.ok) {
      const errorData: IErrorData = await response.json();
      return errorData;
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Access token error:', error);
    const errorData: IErrorData = {
      status: 500,
      message: "Access: Server error. Please try again later.",
    }
    return errorData
  }
};

const API_REFRESH_URL = import.meta.env.VITE_API_REFRESH_URL;
export const postRefreshToken = async (): Promise<IValidData | IErrorData> => {
  try {
    const response = await fetch(API_REFRESH_URL, {
      method: "POST",
      credentials: "include", // Include cookies in the request
    });
    if (!response.ok) {
      const errorData: IErrorData = await response.json();
      return errorData;
    }
    const data: IValidData = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Refresh token error:', error);
    const errorData: IErrorData = {
      status: 500,
      message: "Refresh: Server error. Please try again later.",
    }
    return errorData;
  }
};

const API_REGISTER_URL = import.meta.env.VITE_API_REGISTER_URL;
export const postRegister = async (userId: string, password: string, nickname: string): Promise<IValidData | IErrorData> => {
  try {
    const response = await fetch(API_REGISTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies in the request
      body: JSON.stringify({ userId, password, nickname } as IRegisterPayload),
    });
    if (!response.ok) {
      const errorData: IErrorData = await response.json();
      return errorData;
    }
    const data: IValidData = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Register error:', error);
    const errorData: IErrorData = {
      status: 500,
      message: "Register: Server error. Please try again later.",
      user: null,
      fields: {
        userId: [],
        password: [],
        nickname: []
      }
    }
    return errorData;
  }
}

const API_CHECK_SESSION_URL = import.meta.env.VITE_API_CHECK_SESSION_URL;
export const getCheckSession = async (): Promise<ISessionData | IErrorData> => {
  try {
    const response = await fetch(API_CHECK_SESSION_URL, {
      method: "GET",
      credentials: "include", // Include cookies in the request
    });
    if (!response.ok) {
      throw new Error("Session check failed");
    }
    const data: ISessionData = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Check session error:', error);
    const errorData: IErrorData = {
      status: 500,
      message: "Check session: Server error. Please try again later.",
    }
    return errorData;
  }
}

const API_LOGOUT_URL = import.meta.env.VITE_API_LOGOUT_URL;
export const postLogout = async (userId: string) => {
  try {
    const response = await fetch(API_LOGOUT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies in the request
      body: JSON.stringify({ userId } as ILogoutPayload),
    });
    if (!response.ok) {
      const errorData: IErrorData = await response.json();
      return errorData;
    }
    const data: IValidData = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Logout error:', error);
    const errorData: IErrorData = {
      message: "Logout: Server error. Please try again later.",
      status: 500,
    }
    return errorData;
  }
}

export const isErrorData = (data: unknown): data is IErrorData => {
  return (data as IErrorData).status !== undefined;
}
