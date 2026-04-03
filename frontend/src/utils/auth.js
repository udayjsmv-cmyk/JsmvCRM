// src/utils/auth.js
export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isLoggedIn = () => !!getUser();

export const getUserRole = () => {
  const user = getUser();
  return user ? user.role : null;
};

export const logout = () => {
  localStorage.removeItem("user");
  window.location.href = "/login";
};
