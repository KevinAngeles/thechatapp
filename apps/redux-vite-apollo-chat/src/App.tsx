import { Chat } from './components/chat/Chat';
import { Login } from './components/login/Login';
import { Register } from './components/register/Register';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { selectPage, setPage, setLoggedUser, selectLoggedUser } from './components/appSlice';
import { useEffect } from 'react';
import { isErrorData, postAccessToken, postRefreshToken } from './components/AuthenticationAPI';
import './style/app.scss';
import './style/sign.scss';
import './style/chat.scss';

let getCookie = (name: string): { validUntil: Date } | null => {
  const match = document.cookie.match(`(?:(?:^|.*; *)${name} *= *([^;]*).*$)|^.*$`);
  const c = match ? match[1] : '';
  if (c) {
    return JSON.parse(decodeURIComponent(c));
  } else {
    return null;
  }
}
export default function App(props: { disableCustomTheme?: boolean }) {
  const LOGGED_USER = useAppSelector(selectLoggedUser);
  const CURRENT_PAGE = useAppSelector(selectPage);
  const dispatch = useAppDispatch();
  useEffect(() => {
    const fetchData = async () => {
      const accessTokenData = getCookie('accessTokenData');
      if (!accessTokenData) {
        // no access token
        return;
      }
      const validAccessUntil = new Date(accessTokenData.validUntil);
      const currentDate = new Date();
      if (currentDate < validAccessUntil) {
        const accessResult = await postAccessToken();
        if (!isErrorData(accessResult)) {
          // valid access token
          dispatch(setPage('chat'));
          dispatch(setLoggedUser(accessResult.user));
          dispatch(setLoggedUser({ id: accessResult?.user.id, nickname: accessResult?.user.nickname }));
          return;
        }
      }
      const refreshTokenData = getCookie('refreshTokenData');
      if (!refreshTokenData) {
        // no refresh token;
        return;
      }
      const validRefreshUntil = new Date(refreshTokenData.validUntil);
      if (currentDate >= validRefreshUntil) {
        // refresh token expired
        return;
      }
      const refreshResult = await postRefreshToken();
      if (!isErrorData(refreshResult)) {
        // valid refresh request
        dispatch(setPage('chat'));
        dispatch(setLoggedUser({ id: refreshResult.user.id, nickname: refreshResult.user.nickname }));
      } else {
        // refresh request forbidden
        dispatch(setPage('login'));
        dispatch(setLoggedUser(null));
      }
    }
    fetchData();
  }, []);
  return (
    LOGGED_USER ? (
      <Chat />
    ) : (
      CURRENT_PAGE === 'register' ? (
        <Register />
      ) : (
        <Login />
      )
    )
  );
}
