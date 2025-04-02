import { validateLoginInputs } from "../utils";

describe('validateLoginInputs', () => {
  test('validateLoginInputs sets errors for invalid inputs', () => {
    const invalidLoginInputs = {
      userId: "u@o",
      password: "psw"
    };
    const loginErrorMessages = {
      userId: 'Invalid email',
      password: 'Password must contain at least 8 characters, including letters and numbers',
      general: 'Invalid credentials'
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