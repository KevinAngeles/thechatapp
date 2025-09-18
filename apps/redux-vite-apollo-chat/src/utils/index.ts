import { authentication } from "@utils/constants";

export const validateLoginInputs = (username: string, password: string): { usernameMessageValidation: string, passwordMessageValidation: string } => {
    const usernameRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    const passwordRegEx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    let usernameMessageValidation = "";
    let passwordMessageValidation = "";
    if (!usernameRegEx.test(username)) {
        usernameMessageValidation = authentication.login.errorMessages.username.invalid;
    }
    if (!passwordRegEx.test(password)) {
        passwordMessageValidation = authentication.login.errorMessages.password.invalid;
    }
    return { usernameMessageValidation, passwordMessageValidation };
}
export const validateRegisterInputs = (username: string, password: string, nickname: string): { usernameMessageValidation: string, passwordMessageValidation: string, nicknameMessageValidation: string } => {
    const usernameRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    const passwordRegEx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    const nicknameRegEx = /^[a-zA-Z0-9]{3,}$/
    let usernameMessageValidation = "";
    let passwordMessageValidation = "";
    let nicknameMessageValidation = "";
    if (!usernameRegEx.test(username)) {
        usernameMessageValidation = authentication.registration.errorMessages.username.invalid;
    }
    if (!passwordRegEx.test(password)) {
        passwordMessageValidation = authentication.registration.errorMessages.password.invalid;
    }
    if (!nicknameRegEx.test(nickname)) {
        nicknameMessageValidation = authentication.registration.errorMessages.nickname.invalid;
    }
    return { usernameMessageValidation, passwordMessageValidation, nicknameMessageValidation };
}
