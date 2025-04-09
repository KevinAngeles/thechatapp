import { validateLoginInputs } from "../utils";
import { authentication } from "./constants";

describe('validateLoginInputs', () => {
  test('validateLoginInputs sets errors for invalid inputs', () => {
    const invalidLoginInputs = {
      userId: "u@o",
      password: "psw"
    };
    const loginErrorMessages = {
      userId: authentication.login.errorMessages.userId.invalid,
      password: authentication.login.errorMessages.password.invalid,
      general: authentication.login.errorMessages.general.credentials
    }
    const userId = invalidLoginInputs.userId;
    const password = invalidLoginInputs.password;
    const { userIdMessageValidation, passwordMessageValidation } = validateLoginInputs(userId, password);
    expect(userIdMessageValidation).toBe(loginErrorMessages.userId);
    expect(passwordMessageValidation).toBe(loginErrorMessages.password);
  });
  test('validateLoginInputs does not set errors for valid inputs', () => {
    const validLoginInputs = {
      userId: 'user@email.com',
      password: 'Password123'
    };
    const userId = validLoginInputs.userId;
    const password = validLoginInputs.password;
    const { userIdMessageValidation, passwordMessageValidation } = validateLoginInputs(userId, password);
    expect(userIdMessageValidation).toBe("");
    expect(passwordMessageValidation).toBe("");
  });
});