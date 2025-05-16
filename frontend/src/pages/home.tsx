import Login from './login';
import { useNavigate } from 'react-router-dom';
import { getAuthUser } from '../lib/data/api';

interface HomeProps {
  isRelogin?: boolean;
}

export default function Home({ isRelogin = false }: HomeProps) {
  // Check if this is a relogin after session expiration (set in WithAuth in authutils)
  const navigate = useNavigate();
  
  // If already logged in, redirect to appropriate dashboard
  const user = getAuthUser();
  if (user?.is_staff) {
    navigate('/dashboard');
  } else if (user && !user.is_staff) {
    navigate('/customer-dashboard');
  }
  
  const onLoginSuccess = () => {
    const user = getAuthUser();
    const storedRedirect = localStorage.getItem('redirect');
    
    if (storedRedirect) {
      localStorage.removeItem('redirect');
      navigate(storedRedirect);
    } else {
      if (user?.is_staff) {
        navigate('/dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    }
  };
  
  return (
    <main className="w-full h-screen">
      <Login onSuccess={onLoginSuccess} />
    </main>
  );
}
