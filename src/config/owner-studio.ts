export const isVercelDeployment = () =>
  window.location.hostname.endsWith(".vercel.app");

export const adminUrl = () => (isVercelDeployment() ? "/?admin=1" : "?admin=1");
