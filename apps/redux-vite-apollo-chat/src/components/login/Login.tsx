import { useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { setLoggedUser, setPage } from '../../components/appSlice';
import { IErrorData, IValidData } from '../../types/types';
import { loginUser } from '../../components/login/loginSlice';
import { validateLoginInputs } from '../../utils';

export const Login = (props: { disableCustomTheme?: boolean }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [userIdErrorMessage, setUserIdErrorMessage] = useState('');
    const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
    const [generalErrorMessage, setGeneralErrorMessage] = useState('');

    const dispatch = useAppDispatch();

    const handleUserIdOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setUserId(event.target.value);
        setUserIdErrorMessage("");
        setGeneralErrorMessage("");
    }

    const handlePasswordOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setPassword(event.target.value);
        setPasswordErrorMessage("");
        setGeneralErrorMessage("");
    }

    const handleLoginUser = async (userId: string, password: string) => {
        const loginResult = await dispatch(loginUser({ userId, password }));
        if (loginResult.meta.requestStatus === 'rejected') {
            // IErrorData is a type that contains an error message
            dispatch(setLoggedUser(null));
            const fields = (loginResult.payload as IErrorData)?.fields;
            if (!fields) {
                return;
            }
            if (fields.userId.length === 0 && fields.password.length === 0) {
                setGeneralErrorMessage((loginResult.payload as IErrorData).message);
                return;
            }
            if (fields.userId.length > 0) {
                setUserIdErrorMessage(fields.userId.join(', '))
            }
            if (fields.password.length > 0) {
                setPasswordErrorMessage(fields.password.join(', '))
            }
        } else {
            // IValidData is a type that contains a user object
            dispatch(setLoggedUser({ id: (loginResult.payload as IValidData).user.id, nickname: (loginResult.payload as IValidData).user.nickname }));
            dispatch(setPage('chat'));
        }
    }

    const handleSubmitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const { userIdMessageValidation, passwordMessageValidation } = validateLoginInputs(userId, password);
        let hasValidInputs = true;
        if (userIdMessageValidation.length > 0) {
            hasValidInputs = false;
            setUserIdErrorMessage(userIdMessageValidation);
        }
        if (passwordMessageValidation.length > 0) {
            hasValidInputs = false;
            setPasswordErrorMessage(passwordMessageValidation)
        }
        if (!hasValidInputs) {
            return;
        }
        await handleLoginUser(userId, password);
    }
    const handleClickRegister = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        dispatch(setPage('register'));
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
                        className={(userIdErrorMessage.length > 0) ? 'text-input error-input' : 'text-input'}
                        value={userId}
                        onChange={handleUserIdOnChange}
                        placeholder="your@email.com"
                        required
                    />
                </div>
                <div className="error-message" id="user-id-error">{userIdErrorMessage}</div>

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
                    <input type="checkbox" id="keep-logged-in" className='checkbox-input' />
                    <label htmlFor="keep-logged-in" className='checkbox-label'>Keep me logged in</label>
                </div>
                <div className="error-message" id="general-error">{generalErrorMessage}</div>
                <button className="button button--active">Login</button>
                <button className="button button--passive" onClick={handleClickRegister}>Register</button>
            </form>
        </div>
    )
}