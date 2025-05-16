import React, { useState } from 'react';
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '../components/button'
import { login, requestPasswordReset } from '../lib/data/api';
import { StyleLabel, StyleTextfield, FormErrorMessage } from '../lib/formstyles'
import ShowPasswordButton from '../components/show-password-button'
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/auth-layout';

interface LoginProps {
  onSuccess?: () => void
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [resetBtnDisabled, setResetBtnDisabled] = useState(false);

  function togglePasswordVisibility() {
    setPasswordVisible((prevState) => !prevState);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setBtnDisabled(true);
    setLoginError(false);
    
    try {
      const result = await login(email, password);
      
      if (!result) {
        setLoginError(true);
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          // Check if there's a saved redirect URL
          const redirectPath = localStorage.getItem('redirect');
          
          if (redirectPath) {
            localStorage.removeItem('redirect');
            navigate(redirectPath);
          } else {
            // Default redirects based on user role
            if (result.isStaff) {
              navigate('/dashboard');
            } else {
              navigate('/customer-dashboard');
            }
          }
        }
      }     
    } catch (error) {
      console.error('login error', error);
      setLoginError(true);
    } finally {
      setBtnDisabled(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setResetBtnDisabled(true);
    setResetStatus(null);
    
    try {
      await requestPasswordReset(resetEmail);
      setResetStatus({
        success: true,
        message: 'If your email is registered, you will receive a password reset link shortly.'
      });
    } catch (error) {
      console.error('Password reset error', error);
      setResetStatus({
        success: false,
        message: 'An error occurred while trying to reset your password.'
      });
    } finally {
      setResetBtnDisabled(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col w-full">
        <div className="mb-8 text-center">
          <ShieldCheckIcon className="h-16 w-16 mx-auto mb-3 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">APTRS</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Automated Penetration Test Reporting System</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="px-8 py-6">
            {!showResetForm ? (
              <>
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Sign in to your account</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className={StyleLabel} htmlFor="email">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        className={`${StyleTextfield} pl-10`}
                        id="email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        required
                        autoComplete="username"
                      />
                      <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <label className={StyleLabel} htmlFor="password">
                        Password
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setShowResetForm(true)} 
                        className="text-sm font-medium text-primary hover:text-primary-dark focus:outline-none focus:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        className={`${StyleTextfield} pl-10`}
                        id="password"
                        type={passwordVisible ? "text" : "password"}
                        name="password"
                        placeholder="Enter password"
                        required
                        minLength={4}
                        value={password}
                        autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                      <ShowPasswordButton passwordVisible={passwordVisible} clickHandler={togglePasswordVisibility} />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary-dark disabled:opacity-70 transition-colors"
                      disabled={btnDisabled}
                    >
                      {btnDisabled ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Please wait...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          Sign in <ArrowRightIcon className="ml-2 h-5 w-5" />
                        </span>
                      )}
                    </Button>
                  </div>
                  
                  {loginError && (
                    <div className="pt-2" role="alert" aria-live="polite">
                      <FormErrorMessage message="Invalid email or password. Please try again." />
                    </div>
                  )}
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center mb-6">
                  <button 
                    onClick={() => setShowResetForm(false)} 
                    className="text-primary hover:text-primary-dark mr-2 focus:outline-none"
                  >
                    <ArrowRightIcon className="rotate-180 h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reset Password</h2>
                </div>
                
                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  <div>
                    <label className={StyleLabel} htmlFor="reset-email">
                      Email address
                    </label>
                    <div className="relative">
                      <input
                        className={`${StyleTextfield} pl-10`}
                        id="reset-email"
                        type="email"
                        name="reset-email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                      <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      We'll send a password reset link to this email if it's registered in our system.
                    </p>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary-dark disabled:opacity-70 transition-colors"
                      disabled={resetBtnDisabled}
                    >
                      {resetBtnDisabled ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Please wait...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <LockClosedIcon className="mr-2 h-5 w-5" />
                          Send reset link
                        </span>
                      )}
                    </Button>
                  </div>
                  
                  {resetStatus && (
                    <div className={`p-4 rounded-md mt-4 ${resetStatus.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`} role="alert">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {resetStatus.success ? (
                            <ShieldCheckIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                          ) : (
                            <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm ${resetStatus.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {resetStatus.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
        
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          APTRS &copy; {new Date().getFullYear()} - All rights reserved
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;