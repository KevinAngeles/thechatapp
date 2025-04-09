import { createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { createAppSlice } from "../app/createAppSlice"
import { isErrorData, postLogout, getCheckSession } from "../components/AuthenticationAPI"
import { AppSliceState, ISessionData } from "../types/types"

const initialState: AppSliceState = {
  page: "login",
  loggedUser: null,
  logoutStatus: "idle",
  sessionStatus: 'idle'
}

// create async thunk
export const logoutUser = createAsyncThunk(
  "logout",
  async ({ userId }: {userId: string}, thunkAPI) => {
    const response = await postLogout(userId)
    if (!isErrorData(response)) {
      thunkAPI.dispatch(setPage('login'))
      thunkAPI.dispatch(setLoggedUser(null));
    } else {
      console.log("Error in logout", response);
    }
  }
)

export const checkSession = createAsyncThunk(
  "app/checkSessionThunk",
  async (_, thunkAPI) => {
    const response = await getCheckSession();
    if (isErrorData(response)) {
      return thunkAPI.fulfillWithValue({loggedIn: false} as ISessionData);
    }
    return thunkAPI.fulfillWithValue(response);
  }
)

export const appSlice = createAppSlice({
  name: "app",
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<AppSliceState['page']>) => {
      state.page = action.payload
    },
    setLoggedUser: (state, action: PayloadAction<AppSliceState['loggedUser']>) => {
      state.loggedUser = action.payload
    }
  },
  extraReducers: builder => {
    builder.addCase(logoutUser.pending, (state, action) => {
      state.logoutStatus = "loading"
    })
    builder.addCase(logoutUser.fulfilled, (state, action) => {
      state.logoutStatus = "idle"
    })
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.logoutStatus = "failed"
    })
    builder.addCase(checkSession.pending, (state, action) => {
      state.sessionStatus = "loading"
    })
    builder.addCase(checkSession.fulfilled, (state, action) => {
      state.sessionStatus = "idle"
    })
    builder.addCase(checkSession.rejected, (state, action) => {
      state.sessionStatus = "failed"
    })
  },
  selectors: {
    selectPage: state => state.page,
    selectLoggedUser: state => state.loggedUser
  },
})

// Action creators are generated for each case reducer function.
export const { setPage, setLoggedUser } = appSlice.actions

// Selectors returned by `slice.selectors` take the root state as their first argument.
export const { selectPage, selectLoggedUser } = appSlice.selectors

export default appSlice.reducer
