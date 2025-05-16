import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { validateInvitationToken, acceptInvitation } from '../lib/data/api';
import { PasswordDescription, validPassword } from '../components/passwordValidator';

const SetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if this is a password reset or an invitation
  const isPasswordReset = location.pathname.includes('reset-password');

  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenType, setTokenType] = useState<'invitation' | 'password_reset'>('invitation');
  const [userData, setUserData] = useState<{ email: string; full_name: string; company: string | null }>({
    email: '',
    full_name: '',
    company: null
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Validate token when component mounts
  useEffect(() => {
    const validateToken = async () => {
      try {
        setLoading(true);
        const response = await validateInvitationToken(token!);
        
        if (response.valid) {
          setTokenValid(true);
          setTokenType(response.token_type || 'invitation');
          setUserData({
            email: response.user_email || '',
            full_name: response.full_name || '',
            company: response.company || null
          });
        } else {
          setError(response.message || 'Invalid token.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'This link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setPasswordError('');
    setError('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    
    // Validate password length and complexity
    if (!validPassword(password)) {
      setPasswordError('Password does not meet the required criteria.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await acceptInvitation(token!, password);
      
      if (response.success) {
        setSuccess(true);
        localStorage.setItem('redirect', '/customer-dashboard')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Failed to set password.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while setting your password.');
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-lg font-medium dark:text-white">
            Validating {isPasswordReset ? 'password reset' : 'invitation'}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full px-4 py-6">
      <div className="w-full max-w-md p-8 mx-auto rounded-lg shadow-lg bg-white dark:bg-gray-800">
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.svg" 
            alt="APTRS Logo" 
            className="h-12" 
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.currentTarget.style.display = 'none';
            }} 
          />
        </div>
        
        {error ? (
          <div className="border px-4 py-3 rounded-lg relative mb-6 animate-fade-in bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-1">{error}</span>
          </div>
        ) : success ? (
          <div className="border px-4 py-3 rounded-lg relative mb-6 animate-fade-in bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline ml-1">Your password has been set successfully.</span>
            <div className="mt-3">
              <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full animate-progress" style={{ width: '100%' }}></div>
              </div>
              <p className="text-center mt-2">Redirecting to login...</p>
            </div>
          </div>        ) : tokenValid ? (
          <>
            <h2 className="text-2xl font-bold mb-2 text-center text-blue-600 dark:text-blue-400">
              {tokenType === 'password_reset' ? 'Reset Your Password' : 'Set Your Password'}
            </h2>
            
            <div className="mb-6">
              {tokenType === 'password_reset' ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300 text-center">
                    <span className="font-bold dark:text-white">Hello, {userData.email}!</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
                    Please enter your new password below.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 text-center">
                    <span className="font-bold dark:text-white">Welcome, {userData.full_name || userData.email}!</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
                    You've been invited to join APTRS
                    {userData.company ? ` for ${userData.company}` : ''}.
                  </p>
                </>
              )}
              <div className="h-px my-4 bg-gray-200 dark:bg-gray-700"></div>
              <p className="text-gray-700 dark:text-white-300 mt-2">
                Please create a strong password {tokenType === 'password_reset' ? 'to access your account' : 'to complete your account setup'}.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700 dark:text-white-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-600 focus:border-blue-600 border focus:outline-none focus:ring-2"
                    placeholder="Enter your new password"
                    required
                  />
                </div>
                
                {password && (
                  <div className="mt-2">
                    <PasswordDescription password={password} />
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-700 dark:text-white-300">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-600 focus:border-blue-600 border focus:outline-none focus:ring-2"
                  placeholder="Confirm your password"
                  required
                />
                {passwordError && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">{passwordError}</p>
                )}
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                    submitting 
                    ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                  } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Setting Password...
                    </div>                  ) : tokenType === 'password_reset' ? 'Reset Password' : 'Set Password & Complete Registration'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center animate-fade-in">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 className="text-2xl font-bold my-4 text-red-600 dark:text-red-400">Invalid Link</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This link is invalid or has expired. Please request a new {isPasswordReset ? 'password reset' : 'invitation'} link.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="py-3 px-6 rounded-lg font-medium transition-colors duration-200 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Login
            </button>
          </div>
        )}

        <div className="mt-8 pt-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <p>© {new Date().getFullYear()} APTRS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;