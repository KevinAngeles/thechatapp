import { Chat } from '@components/chat/Chat';
import { Login } from '@components/login/Login';
import { Register } from '@components/register/Register';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectPage, setPage, setLoggedUser, selectLoggedUser, checkSession } from '@components/appSlice';
import { useEffect } from 'react';
import { isErrorData, postAccessToken, postRefreshToken } from '@components/AuthenticationAPI';
import '@style/app.scss';
import '@style/sign.scss';
import '@style/chat.scss';
import { ISessionData } from '@appTypes/types';

const getCookie = (name: string): { validUntil: Date } | null => {
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
      const response = await dispatch(checkSession());
      const {loggedIn, user} = response.payload as ISessionData;
      if (loggedIn && user) {
        // valid session
        dispatch(setPage('chat'));
        dispatch(setLoggedUser(user));
        return;
      }
      if (!loggedIn) {
        // no session
        dispatch(setPage('login'));
        dispatch(setLoggedUser(null));
        return;
      }
    }
    fetchData().catch(console.error);
  }, [dispatch]);
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
