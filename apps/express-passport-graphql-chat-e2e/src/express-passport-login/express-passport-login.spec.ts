import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
describe('GET /', () => {
  it('should return an error when sending invalid credentials', async () => {
    const data = { userId: "", password: "" }
    try {
      const LOGIN_REQUEST_URL = process.env.EXPRESS_LOGIN_BASE_URL+`/api/auth/login`;
      const res = await axios.post(LOGIN_REQUEST_URL, data);
      expect(res.status).not.toBe(200);
    } catch (error: any) {
      console.log("error", error);
      expect(error.status).toBe(500);
      expect(error.response.data.message).toEqual("Login: Internal server error");
    }
  });
})
