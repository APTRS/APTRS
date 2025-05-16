import SideNav from './sidenav'; 
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { getAuthUser } from '../lib/data/api';
import { getInitials, avatarUrl } from '../lib/utilities';
import { Link } from 'react-router-dom';
import { Avatar } from '@material-tailwind/react';
import { useEffect, useState, createContext } from 'react';
import { LoginUser } from '../lib/data/definitions';
import { ThemeIcon } from '../components/themeIcon';

// Ensure proper type casting for Avatar component
const AvatarComponent = Avatar as unknown as React.FC<{ src: string; size: string; className?: string; placeholder?: string; onPointerEnterCapture?: () => void; onPointerLeaveCapture?: () => void }>;

export const ThemeContext = createContext('light');

const Layout: React.FC = () => {
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      const editors = document.querySelectorAll('.ck');
      editors.forEach(editor => {
        editor.classList.add('custom-ckeditor-dark');
      });
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      const editors = document.querySelectorAll('.ck');
      editors.forEach(editor => {
        editor.classList.remove('custom-ckeditor-dark');
      });
      setTheme('light');
    }
  };

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
      const editors = document.querySelectorAll('.ck');
      editors.forEach(editor => {
        editor.classList.add('custom-ckeditor-dark');
      });
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<LoginUser | null>(getAuthUser());
  const location = useLocation();

  useEffect(() => {
    setCurrentUser(getAuthUser());
  }, [location.pathname]);
  // Check if we're on the login or unauthorized page
  const isLoginPage = ['/', '/401'].includes(location.pathname);
  
  return (
    <>
      <ThemeContext.Provider value={theme}>
        <Toaster />        <div className={`flex h-screen flex-col md:flex-row ${isLoginPage ? '' : 'md:overflow-hidden'} bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-white`}>
          {!isLoginPage && (
            <div className="w-full flex-none md:w-64 md:mt-20">
              <SideNav theme={theme} toggleTheme={toggleTheme} />
            </div>
          )}

         <div className={`flex-grow ${isLoginPage ? '' : 'p-6 md:overflow-y-auto'} cursor-pointer`}>
            {!isLoginPage && currentUser && (
              <div className="md:flex md:items-center avatar placeholder md:justify-end hidden">
                <ThemeIcon size="md" theme={theme} toggleTheme={toggleTheme} className="mr-4" />
                {currentUser.profilepic ? (
                  <Link className="text-white" to="/profile">
                    <AvatarComponent src={avatarUrl(currentUser.profilepic as string)} size="lg" />
                  </Link>
                ) : (
                  <div className="bg-primary text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
                    <Link className="text-white" to="/profile">
                      {getInitials(currentUser.full_name as string)}
                    </Link>
                  </div>
                )}
              </div>
            )}            <div className={`${isLoginPage ? '' : 'mt-10 mx-3'} z-10`}>
              <Outlet />
            </div>
          </div>
        </div>
      </ThemeContext.Provider>
    </>
  );
};

export default Layout;
