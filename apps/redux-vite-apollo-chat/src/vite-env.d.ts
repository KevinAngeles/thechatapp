/// <reference types="vite/client" />

interface ImportMetaEnv {
    VITE_API_LOGIN_URL: string;
    VITE_API_REGISTER_URL: string;
    VITE_API_REFRESH_URL: string;
    VITE_API_ACCESS_URL: string;
    VITE_API_LOGOUT_URL: string;
    VITE_GRAPHQL_URL_HTTP: string;
    VITE_GRAPHQL_URL_WS: string;
    VITE_PORT: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
