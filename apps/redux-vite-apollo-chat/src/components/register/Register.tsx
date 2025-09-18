import { useState } from "react";
import { useAppDispatch } from "@app/hooks"
import {
  registerUser,
} from "@components/register/registerSlice"
import { setPage } from "@components/appSlice";
import { IErrorData } from "@appTypes/types";
import { validateRegisterInputs } from "@utils/index";

export const Register = () => {
  const dispatch = useAppDispatch()
  const [usernameErrorMessage, setUsernameErrorMessage] = useState("")
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("")
  const [nicknameErrorMessage, setNicknameErrorMessage] = useState("")
  const [generalErrorMessage, setGeneralErrorMessage] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")
  
  const handleSubmitRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let isValid = true;
    const {usernameMessageValidation, passwordMessageValidation, nicknameMessageValidation} = validateRegisterInputs(username, password, nickname);
    if (usernameMessageValidation.length > 0) {
      setUsernameErrorMessage(usernameMessageValidation)
      isValid = false;
    }
    if (passwordMessageValidation.length > 0) {
      setPasswordErrorMessage(passwordMessageValidation)
      isValid = false;
    }
    if (nicknameMessageValidation.length > 0) {
      setNicknameErrorMessage(nicknameMessageValidation)
      isValid = false;
    }
    if (!isValid) {
      // payload: IValidData
      return;
    }
    const registerResult = await dispatch(registerUser({ username, password, nickname }));
    if (registerResult.meta.requestStatus === 'fulfilled') {
      return;
    }
    // payload: IErrorData
    const fields = (registerResult.payload as IErrorData)?.fields;
    if (!fields) {
      return;
    }
    if (fields.username.length === 0 && fields.password.length === 0 && (fields.nickname && fields.nickname.length === 0)) {
      setGeneralErrorMessage((registerResult.payload as IErrorData).message);
      return;
    }
    if (fields.username.length > 0) {
      setUsernameErrorMessage(fields.username.join(', '))
    }
    if (fields.password.length > 0) {
      setPasswordErrorMessage(fields.password.join(', '))
    }
    if (fields?.nickname && fields.nickname.length > 0) {
      setNicknameErrorMessage(fields.nickname.join(', '))
    }
  }
  const handleEmailOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
    setUsernameErrorMessage("");
    setGeneralErrorMessage("");
  }
  const handlePasswordOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setPasswordErrorMessage("");
    setGeneralErrorMessage("");
  }
  const handleNicknameOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(event.target.value);
    setNicknameErrorMessage("");
    setGeneralErrorMessage("");
  }
  return (
    <div className="container" >
        <h1 className="container-title">Welcome to Chat App</h1>
        <div className="container-logo">CH</div>
        <form className="container-form" onSubmit={handleSubmitRegister}>
            <h2 className="form-subtitle">Registration</h2>
            <div className="form-text">
                <label htmlFor="user-id" className='text-label'>ID</label>
                <input 
                  type="email"
                  id="user-id"
                  className={(usernameErrorMessage.length > 0) ? 'text-input input-error':'text-input'}
                  value={username}
                  onChange={handleEmailOnChange}
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
                className={(passwordErrorMessage.length > 0) ? 'text-input input-error':'text-input'}
                value={password}
                onChange={handlePasswordOnChange}
                placeholder="••••••"
                required
             />
            </div>
            <div className="error-message" id="password-error">{passwordErrorMessage}</div>

            <div className="form-text">
              <label htmlFor="nickname" className='text-label'>Nickname</label>
              <input
                type="text"
                id="nickname"
                className={(nicknameErrorMessage.length > 0) ? 'text-input input-error':'text-input'}
                value={nickname}
                onChange={handleNicknameOnChange}
                placeholder="Nickname"
                required
             />
            </div>
            <div className="error-message" id="nickname-error">{nicknameErrorMessage}</div>
            <div className="error-message" id="general-error">{generalErrorMessage}</div>
            <button className="button button--active">Register</button>
            <button className="button button--passive" onClick={() => dispatch(setPage('login'))}>Cancel</button>
        </form>
    </div>
  )
}
