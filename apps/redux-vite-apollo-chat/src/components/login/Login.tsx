import { useState } from 'react';
import { useAppDispatch } from '@app/hooks';
import { setLoggedUser, setPage } from '@components/appSlice';
import { IErrorData, IValidData, ILoginPayload } from '@appTypes/types';
import { loginUser } from '@components/login/loginSlice';
import { validateLoginInputs } from '@utils/index';

export const Login = (props: { disableCustomTheme?: boolean }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [keepLogged, setKeepLogged] = useState(false);
    const [usernameErrorMessage, setUsernameErrorMessage] = useState('');
    const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
    const [generalErrorMessage, setGeneralErrorMessage] = useState('');

    const dispatch = useAppDispatch();

    const handleUsernameOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setUsername(event.target.value);
        setUsernameErrorMessage("");
        setGeneralErrorMessage("");
    }

    const handlePasswordOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setPassword(event.target.value);
        setPasswordErrorMessage("");
        setGeneralErrorMessage("");
    }

    const handleLoginUser = async (username: string, password: string, keepLogged: boolean) => {
        const loginResult = await dispatch(loginUser({ username, password, keepLogged } as ILoginPayload));
        if (loginResult.meta.requestStatus === 'rejected') {
            // IErrorData is a type that contains an error message
            dispatch(setLoggedUser(null));
            const fields = (loginResult.payload as IErrorData)?.fields;
            if (!fields) {
                return;
            }
            if (fields.username.length === 0 && fields.password.length === 0) {
                setGeneralErrorMessage((loginResult.payload as IErrorData).message);
                return;
            }
            if (fields.username.length > 0) {
                setUsernameErrorMessage(fields.username.join(', '))
            }
            if (fields.password.length > 0) {
                setPasswordErrorMessage(fields.password.join(', '))
            }
        } else {
            // IValidData is a type that contains a user object
            dispatch(setLoggedUser({ publicId: (loginResult.payload as IValidData).user.publicId, nickname: (loginResult.payload as IValidData).user.nickname }));
            dispatch(setPage('chat'));
        }
    }

    const handleSubmitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const { usernameMessageValidation, passwordMessageValidation } = validateLoginInputs(username, password);
        let hasValidInputs = true;
        if (usernameMessageValidation.length > 0) {
            hasValidInputs = false;
            setUsernameErrorMessage(usernameMessageValidation);
        }
        if (passwordMessageValidation.length > 0) {
            hasValidInputs = false;
            setPasswordErrorMessage(passwordMessageValidation)
        }
        if (!hasValidInputs) {
            return;
        }
        await handleLoginUser(username, password, keepLogged);
    }
    const handleClickRegister = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        dispatch(setPage('register'));
    }

    const handleOnChangeKeepLogged = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setKeepLogged(event.target.checked);
    }

    return (
        <div className="container" >
            <h1 className="container-title">Welcome to Chat App</h1>
            <div className="container-logo">CH</div>
            <form className="container-form" onSubmit={handleSubmitLogin}>
                <h2 className="form-subtitle">Login</h2>
                <div className="form-text">
                    <label htmlFor="user-id" className='text-label'>ID</label>
                    <input
                        type="text"
                        id="user-id"
                        className={(usernameErrorMessage.length > 0) ? 'text-input error-input' : 'text-input'}
                        value={username}
                        onChange={handleUsernameOnChange}
                        placeholder="your@email.com"
                        required
                    />
                </div>
                <div className="error-message" id="user-id-error">{usernameErrorMessage}</div>

                <div className="form-text">
                    <label htmlFor="password" className='text-label'>Password</label>
                    <input
                        type="password"
                        id="password"
                        className={(passwordErrorMessage.length > 0) ? 'text-input error-input' : 'text-input'}
                        value={password}
                        onChange={handlePasswordOnChange}
                        placeholder="••••••"
                        required
                    />
                </div>
                <div className="error-message" id="password-error">{passwordErrorMessage}</div>

                <div className="form-checkbox">
                    <input type="checkbox" id="keep-logged-in" className='checkbox-input' checked={keepLogged} onChange={handleOnChangeKeepLogged} />
                    <label htmlFor="keep-logged-in" className='checkbox-label'>Keep me logged in</label>
                </div>
                <div className="error-message" id="general-error">{generalErrorMessage}</div>
                <button className="button button--active">Login</button>
                <button className="button button--passive" onClick={handleClickRegister}>Register</button>
            </form>
        </div>
    )
}