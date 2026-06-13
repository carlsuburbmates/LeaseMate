export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getAuthMode = () => "local" as const;

export const isLocalAuth = () => getAuthMode() === "local";

export const getLoginUrl = () => "/login";
