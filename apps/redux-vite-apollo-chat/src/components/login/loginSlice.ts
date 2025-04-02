import { createAsyncThunk } from "@reduxjs/toolkit"
import { createAppSlice } from "@/app/createAppSlice"
import { isErrorData, postLogin } from "@/components/AuthenticationAPI"
import type { ILoginPayload, LoginSliceState } from "@/types/types"
import { setLoggedUser, setPage } from "@/components/appSlice"

const initialState: LoginSliceState = {
  loginStatus: 'idle'
}

export const loginUser = createAsyncThunk(
  "login/loginThunk",
  async ({ userId, password }: ILoginPayload, thunkAPI) => {
    const response = await postLogin(userId, password)
    if (isErrorData(response)) {
      return thunkAPI.rejectWithValue(response);
    } else {
      thunkAPI.dispatch(setLoggedUser({ id: response.user.id, nickname: response.user.nickname }));
      thunkAPI.dispatch(setPage('chat'));
      return thunkAPI.fulfillWithValue(response);
    }
  }
)

export const loginSlice = createAppSlice({
  name: "login",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(loginUser.pending, (state) => {
      state.loginStatus = 'loading'
    })
    builder.addCase(loginUser.fulfilled, (state) => {
      state.loginStatus = 'idle'
    })
    builder.addCase(loginUser.rejected, (state) => {
      state.loginStatus = 'failed'
    })
  },
  selectors: {
    selectLoginStatus: data => data.loginStatus
  },
})

// Action creators are generated for each case reducer function.
// export const {  } = registerSlice.actions

// Selectors returned by `slice.selectors` take the root state as their first argument.
export const { selectLoginStatus } = loginSlice.selectors

export default loginSlice.reducer