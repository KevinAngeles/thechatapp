import { createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { createAppSlice } from "@/app/createAppSlice"
import { isErrorData, postLogout } from "@/components/AuthenticationAPI"
import { AppSliceState } from "@/types/types"

const initialState: AppSliceState = {
  page: "login",
  loggedUser: null,
  logoutStatus: "idle"
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
