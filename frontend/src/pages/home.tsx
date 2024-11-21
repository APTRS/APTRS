import Logo from '../components/logo';
import Login from './login';
import { useNavigate } from 'react-router-dom';
import { getAuthUser } from '../lib/data/api';
interface HomeProps {
  isRelogin?: boolean
}
export default function Home({isRelogin = false}: HomeProps) {
  //is this a relogin after session expiration? set in WithAuth in authutils
  const navigate = useNavigate()
  //if logged in, redirect to dashboard
  const user = getAuthUser()
  if(user){
    navigate('/dashboard')
  }
  const onLoginSuccess = () => {
    const storedRedirect = localStorage.getItem('redirect')
      if(storedRedirect){
        localStorage.removeItem('redirect')
        navigate(storedRedirect)
      } else {
        console.log('no redirect, navigating to dashboard')
        navigate('/dashboard')
      }
  }
  
  return (
    <main className="flex min-h-screen flex-col">
      <div className="bg-primary flex h-20 shrink-0 items-end rounded-lg bg-primary-500 color-primary p-4 md:h-52">
        <div className="flex flex-row items-center leading-none text-white">
          <p className="text-[44px]">Automated Penetration Testing Reporting System</p>
        </div>
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6  bg-gray-50 md:w-2/5 md:px-20">
          <p className='text-xl text-gray-800 md:text-3xl md:leading-normal dark:text-white'>
            <strong>Welcome!</strong>
          </p>
          {isRelogin && 
            <p>Please login to proceed.</p>
          }
          <Login onSuccess={onLoginSuccess} />
        </div>
        <div className="flex items-start justify-start align-start p-0 md:w-3/5 md:px-28">
          <div className="h-1/2 flex justify-start items-start">
              <Logo />
          </div>
        </div>
      </div>
    </main>
  );
}
