import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  
  // Simply redirect to the set-password page with the token
  return <Navigate to={`/set-password/${token}`} replace />;
};

export default ResetPassword;
