import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedStore, StoreEnhancer, ThunkDispatch, Tuple, UnknownAction } from '@reduxjs/toolkit';
import { Login } from '@components/login/Login';
import { loginUser } from '@components/login/loginSlice';
import { setLoggedUser, setPage } from '@components/appSlice';
import { AppSliceState, IAuthenticatedUser, ILoginPayload, IErrorData, IValidData, LoginSliceState } from '@appTypes/types';
import { Provider } from 'react-redux';
import { makeStore } from '@app/store';
import { vi, describe, expect, beforeEach, afterEach } from 'vitest';
import { authentication } from '@utils/constants';

let store: EnhancedStore<{
  login: LoginSliceState;
  app: AppSliceState;
}, UnknownAction, Tuple<[StoreEnhancer<{
  dispatch: ThunkDispatch<{
    login: LoginSliceState;
    app: AppSliceState;
  }, undefined, UnknownAction>;
}>, StoreEnhancer]>>;

const mocks = vi.hoisted(() => {
  return {
    loginUser: vi.fn(),
    dispatch: vi.fn()
  }
});

vi.mock("@app/hooks", async (importOriginal) => {
  const actual = await importOriginal() as typeof import("@app/hooks");
  return {
    ...actual,
    useAppDispatch: () => mocks.dispatch,
  };
});

vi.mock("@components/login/loginSlice", async (importOriginal) => {
  const actual = await importOriginal() as typeof import("@components/login/loginSlice");
  return {
    ...actual,
    loginUser: mocks.loginUser
  };
});

describe('Login Component', () => {

  beforeEach(() => {
    store = makeStore();
    render(
      <Provider store={store}>
        <Login />
      </Provider>
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('handleLoginUser sets loggedUser when clicking on login button with valid credentials for an account that actually exists', async () => {
    const validUserId = 'user@email.com';
    const validPassword = 'Password123';
    const keepLogged = false;
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: validUserId,
        password: validPassword,
        keepLogged: keepLogged
      } as ILoginPayload
    }
    const resolvedLoginUserDispatch = {
      meta: { requestStatus: "fulfilled" },
      payload: {
        message: 'access granted',
        user: {
          id: 'user@email.com',
          nickname: 'testuser'
        } as IAuthenticatedUser
      } as IValidData
    };
    const authenticatedUserResponse: IAuthenticatedUser = {
      id: 'user@email.com',
      nickname: 'testuser'
    }
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatch));
    // Simulate user input
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(userIdInput, { target: { value: validUserId } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(passwordInput).toHaveValue(validPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // Wait for the dispatch to be called
    await waitFor(() => {
      expect(mocks.dispatch).toHaveBeenCalled();
    });
    // Inputs are valid so the loginUser action is dispatched
    // Assert first dispatch was called with loginUser action with correct payload
    await waitFor(() => {
      expect(mocks.dispatch.mock.calls[0][0]).toStrictEqual(loginUser({userId: validUserId, password: validPassword, keepLogged: keepLogged}));
    });
    // Assert second dispatch was called with setLoggedUser action with correct payload
    await waitFor(() => {
      expect(mocks.dispatch.mock.calls[1][0]).toStrictEqual(setLoggedUser(authenticatedUserResponse));
    });
  });
  test('handleLoginUser changes page when clicking on login button with valid credentials for an account that actually exists', async () => {  
    const validUserId = 'user@email.com';
    const validPassword = 'Password123';
    const keepLogged = false;
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: validUserId,
        password: validPassword,
        keepLogged: keepLogged
      } as ILoginPayload
    };
    const resolvedLoginUserDispatch = {
      meta: { requestStatus: "fulfilled" },
      payload: {
        message: 'access granted',
        user: {
          id: 'user@email.com',
          nickname: 'testuser'
        } as IAuthenticatedUser
      } as IValidData
    };
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatch));
    // Simulate user input
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(userIdInput, { target: { value: validUserId } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(passwordInput).toHaveValue(validPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // Wait for the dispatch to be called
    await waitFor(() => {
      expect(mocks.dispatch).toHaveBeenCalled();
    });
    // Inputs are valid so the loginUser action is dispatched
    // Assert first dispatch was called with loginUser action with correct payload
    await waitFor(() => {
      expect(mocks.dispatch.mock.calls[0][0]).toStrictEqual(loginUser({userId: validUserId, password: validPassword, keepLogged: keepLogged}));
    });
    // Assert third dispatch was called with setPage action with correct payload
    await waitFor(() => {
      expect(mocks.dispatch.mock.calls[2][0]).toStrictEqual(setPage('chat'));
    });
  });
  test('handleLoginUser does not set any error message when clicking on login button with valid credentials for an account that actually exists', async () => {
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const validUserId = 'user@email.com';
    const validPassword = 'Password123';
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: validUserId,
        password: validPassword
      } as ILoginPayload
    }
    const resolvedLoginUserDispatch = {
      meta: { requestStatus: "fulfilled" },
      payload: {
        message: 'access granted',
        user: {
          id: 'user@email.com',
          nickname: 'testuser'
        } as IAuthenticatedUser
      } as IValidData
    };
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatch));
    // Simulate user input
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(userIdInput, { target: { value: validUserId } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(passwordInput).toHaveValue(validPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // Wait for the dispatch to be called
    await waitFor(() => {
      expect(mocks.dispatch).toHaveBeenCalled();
    });
    // Assert there is not any error message
    await waitFor(() => {
      expect(screen.queryByText(loginErrorMessages.userId)).not.toBeInTheDocument();
      expect(screen.queryByText(loginErrorMessages.password)).not.toBeInTheDocument();
      expect(screen.queryByText(loginErrorMessages.general)).not.toBeInTheDocument();
    });
  });
  test('handleLoginUser sets general error message when clicking on login button with valid inputs but account does not exist', async () => {
    const validUserId = 'user@email.com';
    const validPassword = 'Password123'; // it is a valid password but the account does not exist
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: validUserId,
        password: validPassword
      } as ILoginPayload
    }
    // notice that only the general error message is set and not the userId or password error messages
    const resolvedLoginUserDispatch = {
      meta: { requestStatus: "rejected" },
      payload: {
        message: loginErrorMessages.general,
        status: 400,
        user: null,
        fields: {
          userId: [],
          password: []
        }
      } as IErrorData
    };
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatch));
    // Set valid values that pass input validation but fail login
    fireEvent.change(userIdInput, { target: { value: validUserId } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(passwordInput).toHaveValue(validPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // Wait for the dispatch to be called
    await waitFor(() => {
      expect(mocks.dispatch).toHaveBeenCalledTimes(2);
    });
    // verify that the general error message is displayed
    await waitFor(async () => {
      expect(await screen.findByText(loginErrorMessages.general)).toBeInTheDocument();
    });
  });
  test('handleSubmitLogin sets userId error message when clicking on login button with an invalid userId', async () => {
    const invalidUserId = "b";
    const validPassword = "Password123";
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: invalidUserId,
        password: validPassword
      } as ILoginPayload
    }
    const resolvedLoginUserDispatchWithGeneralError = {
      meta: { requestStatus: "rejected" },
      payload: {
        message: loginErrorMessages.general,
        status: 400,
        user: null,
        fields: {
          userId: [],
          password: []
        }
      } as IErrorData
    }
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatchWithGeneralError));
    fireEvent.change(userIdInput, { target: { value: invalidUserId } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(invalidUserId);
      expect(passwordInput).toHaveValue(validPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that no dispatch was called (to assert that handleLoginUser was not called)
    await waitFor(() => {
      expect(mocks.dispatch).not.toHaveBeenCalled();
    });
    // verify that the userId error message is displayed
    await waitFor(async () => {
      expect(await screen.findByText(loginErrorMessages.userId)).toBeInTheDocument();
    });
  });
  test('handleSubmitLogin does not set general error message when clicking on the button login with an invalid userId', async () => {
    const invalidUserId = "b";
    const validPassword = "Password123";
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: invalidUserId,
        password: validPassword
      } as ILoginPayload
    }
    const resolvedLoginUserDispatchWithGeneralError = {
      meta: { requestStatus: "rejected" },
      payload: {
        message: loginErrorMessages.general,
        status: 400,
        user: null,
        fields: {
          userId: [],
          password: []
        }
      } as IErrorData
    }
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatchWithGeneralError));
    fireEvent.change(userIdInput, { target: { value: invalidUserId } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(invalidUserId);
      expect(passwordInput).toHaveValue(validPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that no dispatch was called (to assert that handleLoginUser was not called)
    await waitFor(() => {
      expect(mocks.dispatch).not.toHaveBeenCalled();
    });
    // verify that the general error message is not displayed
    await waitFor(async () => {
      expect(screen.queryByText(loginErrorMessages.general)).not.toBeInTheDocument();
    });
  });
  test('handleSubmitLogin sets password error message when clicking on login button with an invalid password', async () => {
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const validUserId = 'user@email.com';
    const invalidPassword = 'b';
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: validUserId,
        password: invalidPassword
      } as ILoginPayload
    }
    const resolvedLoginUserDispatch = {
      meta: { requestStatus: "rejected" },
      payload: {
        message: loginErrorMessages.general,
        status: 400,
        user: null,
        fields: {
          userId: [],
          password: []
        }
      } as IErrorData
    }
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatch));
    fireEvent.change(userIdInput, { target: { value: validUserId } });
    fireEvent.change(passwordInput, { target: { value: invalidPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(passwordInput).toHaveValue(invalidPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that no dispatch was called (to assert that handleLoginUser was not called)
    await waitFor(() => {
      expect(mocks.dispatch).not.toHaveBeenCalled();
    });
    // verify that the password error message is displayed
    await waitFor(async () => {
      expect(await screen.findByText(loginErrorMessages.password)).toBeInTheDocument();
    });
  });
  test('handleSubmitLogin does not set general error message when clicking on the button login with an invalid password', async () => {
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const validUserId = 'user@email.com';
    const invalidPassword = 'b';
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: validUserId,
        password: invalidPassword
      } as ILoginPayload
    }
    const resolvedLoginUserDispatch = {
      meta: { requestStatus: "rejected" },
      payload: {
        message: loginErrorMessages.general,
        status: 400,
        user: null,
        fields: {
          userId: [],
          password: []
        }
      } as IErrorData
    }
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatch));
    fireEvent.change(userIdInput, { target: { value: validUserId } });
    fireEvent.change(passwordInput, { target: { value: invalidPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(passwordInput).toHaveValue(invalidPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that no dispatch was called (to assert that handleLoginUser was not called)
    await waitFor(() => {
      expect(mocks.dispatch).not.toHaveBeenCalled();
    });
    // verify that the general error message is not displayed
    await waitFor(async () => {
      expect(screen.queryByText(loginErrorMessages.general)).not.toBeInTheDocument();
    });
  });
  test('handleSubmitLogin does not set password error message when clicking on the button login with an invalid user and a valid password', async () => {
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const invalidUserId = 'b';
    const validPassword = 'Password123';
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: invalidUserId,
        password: validPassword
      } as ILoginPayload
    }
    const resolvedLoginUserDispatch = {
      meta: { requestStatus: "rejected" },
      payload: {
        message: loginErrorMessages.general,
        status: 400,
        user: null,
        fields: {
          userId: [],
          password: []
        }
      } as IErrorData
    }
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatch));
    fireEvent.change(userIdInput, { target: { value: invalidUserId } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(invalidUserId);
      expect(passwordInput).toHaveValue(validPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that no dispatch was called (to assert that handleLoginUser was not called)
    await waitFor(() => {
      expect(mocks.dispatch).not.toHaveBeenCalled();
    });
    // verify that the password error message is not displayed
    await waitFor(async () => {
      expect(screen.queryByText(loginErrorMessages.password)).not.toBeInTheDocument();
    });
  });
  test('handleSubmitLogin does not set userId error message when clicking on the button login with a valid user and an invalid password', async () => {
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const validUserId = 'user@email.com';
    const invalidPassword = 'b';
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: validUserId,
        password: invalidPassword
      } as ILoginPayload
    }
    const resolvedLoginUserDispatch = {
      meta: { requestStatus: "rejected" },
      payload: {
        message: loginErrorMessages.general,
        status: 400,
        user: null,
        fields: {
          userId: [],
          password: []
        }
      } as IErrorData
    }
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatch));
    fireEvent.change(userIdInput, { target: { value: validUserId } });
    fireEvent.change(passwordInput, { target: { value: invalidPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(passwordInput).toHaveValue(invalidPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that no dispatch was called (to assert that handleLoginUser was not called)
    await waitFor(() => {
      expect(mocks.dispatch).not.toHaveBeenCalled();
    });
    // verify that the userId error message is not displayed
    await waitFor(async () => {
      expect(screen.queryByText(loginErrorMessages.userId)).not.toBeInTheDocument();
    });
  });

  test('handleUserIdOnChange clears userId error message', async () => {
    const validUserId = 'user@email.com';
    const validPassword = 'Password123';
    const invalidUserId = 'b';
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    // Do the steps to display an userId error message
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(userIdInput, { target: { value: invalidUserId } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(invalidUserId);
      expect(passwordInput).toHaveValue(validPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that the userId error message is displayed
    await waitFor(async () => {
      expect(await screen.findByText(loginErrorMessages.userId)).toBeInTheDocument();
    });
    // update userId input
    fireEvent.change(userIdInput, { target: { value: validUserId } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(screen.queryByText(loginErrorMessages.userId)).not.toBeInTheDocument();
    });
  });
  test('handleUserIdOnChange clears general error message', async () => {
    const validUserId = 'user@email.com';
    const validPassword = 'Password123';
    const invalidUserId = 'b';
    const invalidPassword = 'b';
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: validUserId,
        password: invalidPassword
      } as ILoginPayload
    }
    const resolvedLoginUserDispatch = {
      meta: { requestStatus: "rejected" },
      payload: {
        message: loginErrorMessages.general,
        status: 400,
        user: null,
        fields: {
          userId: [],
          password: []
        }
      } as IErrorData
    }
    // Do the steps to display an userId error message
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatch));

    fireEvent.change(userIdInput, { target: { value: validUserId } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(passwordInput).toHaveValue(validPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that the general error message is displayed
    await waitFor(async () => {
      expect(await screen.findByText(loginErrorMessages.general)).toBeInTheDocument();
    });
    // update the userId input
    // event though the userId is invalid, the general error message should be cleared
    // because the button is not clicked after the password is updated
    fireEvent.change(userIdInput, { target: { value: invalidUserId } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(invalidUserId);
      // verify that the general error message is not displayed
      expect(screen.queryByText(loginErrorMessages.general)).not.toBeInTheDocument();
    });
  });
  test('handleUserIdOnChange does not clear password error message', async () => {
    const validUserId = 'user@email.com';
    const invalidUserId = 'b';
    const invalidPassword = 'b';
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    // Do the steps to display an userId error message
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(userIdInput, { target: { value: invalidUserId } });
    fireEvent.change(passwordInput, { target: { value: invalidPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(invalidUserId);
      expect(passwordInput).toHaveValue(invalidPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that the password error message is displayed
    await waitFor(async () => {
      expect(await screen.findByText(loginErrorMessages.password)).toBeInTheDocument();
    });
    // update the userId input
    fireEvent.change(userIdInput, { target: { value: validUserId } });
    await waitFor(async () => {
      expect(userIdInput).toHaveValue(validUserId);
    // verify that the password error message is still displayed
      expect(await screen.findByText(loginErrorMessages.password)).toBeInTheDocument();
    });
  });
  test('handlePasswordOnChange clears password error message', async () => {
    const validUserId = 'user@email.com';
    const validPassword = 'Password123';
    const invalidPassword = 'b';
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    // Do the steps to display an userId error message
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(userIdInput, { target: { value: validUserId } });
    fireEvent.change(passwordInput, { target: { value: invalidPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(passwordInput).toHaveValue(invalidPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that the userId error message is displayed
    await waitFor(async () => {
      expect(await screen.findByText(loginErrorMessages.password)).toBeInTheDocument();
    });
    // update userId input
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(passwordInput).toHaveValue(validPassword);
      expect(screen.queryByText(loginErrorMessages.password)).not.toBeInTheDocument();
    });
  });
  test('handlePasswordOnChange clears general error message', async () => {
    const validUserId = 'user@email.com';
    const validPassword = 'Password123';
    const invalidPassword = 'b';
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const loginUserAsyncThunkAction = {
      type: 'login/loginThunk',
      payload: {
        userId: validUserId,
        password: invalidPassword
      } as ILoginPayload
    }
    const resolvedLoginUserDispatch = {
      meta: { requestStatus: "rejected" },
      payload: {
        message: loginErrorMessages.general,
        status: 400,
        user: null,
        fields: {
          userId: [],
          password: []
        }
      } as IErrorData
    }
    // Do the steps to display an userId error message
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    mocks.loginUser.mockResolvedValue(loginUserAsyncThunkAction);
    mocks.dispatch.mockReturnValue(await Promise.resolve(resolvedLoginUserDispatch));

    fireEvent.change(userIdInput, { target: { value: validUserId } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(validUserId);
      expect(passwordInput).toHaveValue(validPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that the general error message is displayed
    await waitFor(async () => {
      expect(await screen.findByText(loginErrorMessages.general)).toBeInTheDocument();
    });
    // update the password input
    // event though the password is invalid, the general error message should be cleared
    // because the button is not clicked after the password is updated
    fireEvent.change(passwordInput, { target: { value: invalidPassword } });
    await waitFor(() => {
      expect(passwordInput).toHaveValue(invalidPassword);
      // verify that the general error message is not displayed
      expect(screen.queryByText(loginErrorMessages.general)).not.toBeInTheDocument();
    });
  });
  test('handlePasswordOnChange does not clear userId error message', async () => {
    const validPassword = 'Password123';
    const invalidUserId = 'b';
    const invalidPassword = 'b';
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    // Do the steps to display an userId error message
    const userIdInput = screen.getByLabelText(/ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(userIdInput, { target: { value: invalidUserId } });
    fireEvent.change(passwordInput, { target: { value: invalidPassword } });
    await waitFor(() => {
      expect(userIdInput).toHaveValue(invalidUserId);
      expect(passwordInput).toHaveValue(invalidPassword);
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    // verify that the userId error message is displayed
    await waitFor(async () => {
      expect(await screen.findByText(loginErrorMessages.userId)).toBeInTheDocument();
    });
    // update the password input
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    await waitFor(async () => {
      expect(passwordInput).toHaveValue(validPassword);
    // verify that the userId error message is still displayed
      expect(await screen.findByText(loginErrorMessages.userId)).toBeInTheDocument();
    });
  });

});
