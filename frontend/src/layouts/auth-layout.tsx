import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component for authentication pages (login, reset password, etc.)
 * Provides a consistent layout with a gradient background
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 w-full">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
