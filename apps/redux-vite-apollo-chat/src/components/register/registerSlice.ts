import { createAsyncThunk } from "@reduxjs/toolkit"
import { createAppSlice } from "@app/createAppSlice"
import { isErrorData, postRegister } from "@components/AuthenticationAPI"
import { setLoggedUser, setPage } from "@components/appSlice"
import { IRegisterPayload, RegisterSliceState } from "@appTypes/types"

const initialState: RegisterSliceState = {
  registerStatus: "idle",
}

export const registerUser = createAsyncThunk(
  "registerThunk",
  async ({ username, password, nickname }: IRegisterPayload, thunkAPI) => {
    const response = await postRegister(username, password, nickname)
    if (isErrorData(response)) {
      return thunkAPI.rejectWithValue(response)
    } else {
      thunkAPI.dispatch(setLoggedUser({ publicId: response.user.publicId, nickname: response.user.nickname }));
      thunkAPI.dispatch(setPage('chat'));
      return thunkAPI.fulfillWithValue(response);
    }
  }
)

export const registerSlice = createAppSlice({
  name: "register",
  initialState,
  reducers: {
  },
  extraReducers: builder => {
    builder.addCase(registerUser.pending, (state) => {
      state.registerStatus = 'loading'
    })
    builder.addCase(registerUser.fulfilled, (state) => {
      state.registerStatus = 'idle'
    })
    builder.addCase(registerUser.rejected, (state) => {
      state.registerStatus = 'failed'
    })
  },
  selectors: {
    selectRegisterStatus: data => data.registerStatus,
  },
})

// Action creators are generated for each case reducer function.
// export const {} = registerSlice.actions

// Selectors returned by `slice.selectors` take the root state as their first argument.
export const { selectRegisterStatus } = registerSlice.selectors

export default registerSlice.reducer