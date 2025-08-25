import { authentication } from "@utils/constants";

export const validateLoginInputs = (userId: string, password: string): { userIdMessageValidation: string, passwordMessageValidation: string } => {
    const userIdRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    const passwordRegEx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    let userIdMessageValidation = "";
    let passwordMessageValidation = "";
    if (!userIdRegEx.test(userId)) {
        userIdMessageValidation = authentication.login.errorMessages.userId.invalid;
    }
    if (!passwordRegEx.test(password)) {
        passwordMessageValidation = authentication.login.errorMessages.password.invalid;
    }
    return { userIdMessageValidation, passwordMessageValidation };
}
export const validateRegisterInputs = (userId: string, password: string, nickname: string): { userIdMessageValidation: string, passwordMessageValidation: string, nicknameMessageValidation: string } => {
    const userIdRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    const passwordRegEx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    const nicknameRegEx = /^[a-zA-Z0-9]{3,}$/
    let userIdMessageValidation = "";
    let passwordMessageValidation = "";
    let nicknameMessageValidation = "";
    if (!userIdRegEx.test(userId)) {
        userIdMessageValidation = authentication.registration.errorMessages.userId.invalid;
    }
    if (!passwordRegEx.test(password)) {
        passwordMessageValidation = authentication.registration.errorMessages.password.invalid;
    }
    if (!nicknameRegEx.test(nickname)) {
        nicknameMessageValidation = authentication.registration.errorMessages.nickname.invalid;
    }
    return { userIdMessageValidation, passwordMessageValidation, nicknameMessageValidation };
}
