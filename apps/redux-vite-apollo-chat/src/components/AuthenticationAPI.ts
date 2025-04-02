import { IErrorData, IValidData, ILoginPayload, IRegisterPayload, ILogoutPayload } from "../types/types";

// Code for login API
const API_LOGIN_URL = import.meta.env.VITE_API_LOGIN_URL;
export const postLogin = async (userId: string, password: string): Promise<IValidData | IErrorData> => {
  try {
    const response = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies in the request
      body: JSON.stringify({ userId, password } as ILoginPayload),
    });
    if (!response.ok) {
      const loginError: IErrorData = await response.json();
      return loginError;
    }
    const data: IValidData = await response.json();
    return data;
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
    const errorData: IErrorData = {
      message: "Logout: Server error. Please try again later.",
      status: 500,
    }
    return errorData;
  }
}

export const isErrorData = (data: any): data is IErrorData => {
  return (data as IErrorData).status !== undefined;
}
