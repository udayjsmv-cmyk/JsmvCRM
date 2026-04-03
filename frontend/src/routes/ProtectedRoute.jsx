import React from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  if (!isLoggedIn()) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Logged in, show the protected content
  return children;
};

export default ProtectedRoute;
