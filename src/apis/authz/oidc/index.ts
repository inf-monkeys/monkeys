export const handleOidcLogin = () =>
  (window.location.href = `/api/auth/oidc/login?redirect_to=${window.location.origin}/login/callback`);
