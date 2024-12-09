import React, { useState, useEffect } from 'react';
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import {Button} from '../components/button'
import { login } from '../lib/data/api';
import { StyleLabel } from '../lib/formstyles'
import ShowPasswordButton from '../components/show-password-button'
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onSuccess?: () => void
}
const Login: React.FC<LoginProps> = ({onSuccess}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const navigate = useNavigate()
  const [passwordVisible, setPasswordVisible] = useState(false)
  function togglePasswordVisibility() {
    setPasswordVisible((prevState) => !prevState);
  }
  const handleLogin = async (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    
    setBtnDisabled(true)
    try {
      const result = await login(email,password)
      if(!result){
        //bad email & password
        setLoginError(true)
        setBtnDisabled(false)
      } else {
        if(onSuccess) {
          onSuccess()
        } else {
          navigate('/dashboard')
        }
      }     
    } catch (error) {
      console.error('login error', error)
      setLoginError(true)
    } finally {
      setBtnDisabled(false)
    }
  }
  return (
            <div className="max-w-sm flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
                  <form onSubmit={handleLogin}>
                  <div className="w-full mb-4">
                    <div>
                      <label
                        className={StyleLabel}
                        htmlFor="email"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <input
                          className="w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 dark:text-white dark:bg-black"
                          id="email"
                          type="email"
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="user@example.com"
                          required
                          autoComplete="username"
                        />
                        <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label
                        className={StyleLabel}
                        htmlFor="password"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          className="w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 dark:text-white dark:bg-black"
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
                        <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900 dark:text-white" />
                        <ShowPasswordButton passwordVisible={passwordVisible} clickHandler={togglePasswordVisibility} />
                      </div>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-primary disabled:bg-gray-300"
                    disabled = {btnDisabled}
                  >
                      {btnDisabled ? 'Please wait' : 'Log in'} <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
                  </Button>
                  {loginError &&
                    <div className="flex h-8 mt-1em items-end space-x-1" aria-live="polite" aria-atomic="true">
                      <>
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                        <p className="text-sm text-red-500">Invalid credentials</p>
                      </>
                    </div>
                  } 
                </form>
            </div>)
          
};


export default Login;