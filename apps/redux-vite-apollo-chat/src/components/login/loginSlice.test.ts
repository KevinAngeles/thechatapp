import loginReducer, { loginUser } from '@components/login/loginSlice';
import appReducer from '@components/appSlice';
import { configureStore, EnhancedStore, StoreEnhancer, ThunkDispatch, Tuple, UnknownAction } from '@reduxjs/toolkit';
import { IErrorData, IValidData, LoginSliceState, AppSliceState } from '@appTypes/types';
import { vi, describe, test, expect } from 'vitest';

// function createSuccessfulFetchResponse(data: any): Response {
//   return {
//     ok: true,
//     status: 200,
//     json: () => new Promise((resolve) => resolve(data)),
//     headers: new Headers(),
//     redirected: false,
//     statusText: '',
//     type: 'default',
//     url: '',
//     clone: function (): Response {
//       throw new Error('Function not implemented.');
//     },
//     body: null,
//     bodyUsed: false,
//     arrayBuffer: function (): Promise<ArrayBuffer> {
//       throw new Error('Function not implemented.');
//     },
//     blob: function (): Promise<Blob> {
//       throw new Error('Function not implemented.');
//     },
//     bytes: function (): Promise<Uint8Array> {
//       throw new Error('Function not implemented.');
//     },
//     formData: function (): Promise<FormData> {
//       throw new Error('Function not implemented.');
//     },
//     text: function (): Promise<string> {
//       throw new Error('Function not implemented.');
//     }
//   }
// }

let store: EnhancedStore<{
  login: LoginSliceState;
  app: AppSliceState;
}, UnknownAction, Tuple<[StoreEnhancer<{
  dispatch: ThunkDispatch<{
      login: LoginSliceState;
      app: AppSliceState;
  }, undefined, UnknownAction>;
}>, StoreEnhancer]>>;

beforeEach(() => {
  store = configureStore({
    reducer: {
      login: loginReducer,
      app: appReducer,
    },
  });
});

describe('loginSlice', () => {
  test('should handle loginUser fulfilled', async () => {
    const userId = 'test@example.com';
    const password = 'Password123';
    const user: IValidData = {
      user: {
        id: '1',
        nickname: 'testuser',
      },
      message: 'User logged in',
    };
    const successfulResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve(user)
    } as Response;
    const originalGlobalFetch = global.fetch;
    global.fetch = vi.fn(() => Promise.resolve(successfulResponse));
    
    await store.dispatch(loginUser({ userId, password, keepLogged: false }));

    const loginState = store.getState().login;
    const appState = store.getState().app;
    expect(loginState.loginStatus).toEqual('idle');
    expect(appState.loggedUser).toEqual({ id: '1', nickname: 'testuser' });
    expect(appState.page).toBe('chat');
    global.fetch = originalGlobalFetch;
  });

  test('should handle loginUser rejected', async () => {
    const userId = 'test@example.com';
    const password = 'wrongpassword';
    const error: IErrorData = {
      message: 'Invalid credentials',
      fields: {
        userId: [],
        password: ['Incorrect password'],
      },
    };
    const originalGlobalFetch = global.fetch;
    // Mock the API call
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.reject(error),
    } as Response);

    await store.dispatch(loginUser({ userId, password, keepLogged: false }));

    const loginState = store.getState().login;
    const appState = store.getState().app;
    expect(appState.loggedUser).toBeNull();
    expect(appState.page).toBe('login');
    expect(loginState.loginStatus).toBe('failed');
    global.fetch = originalGlobalFetch;
  });
});