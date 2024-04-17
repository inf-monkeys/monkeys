export const handleOidcLogin = () =>
  (window.location.href = `/api/auth/oidc/login?redirect_to=${window.location.origin}/login/callback`);

export const handleOidcLogout = () => (window.location.href = `/api/auth/oidc/logout`);
