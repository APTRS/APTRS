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

  return (
    <>
      <ThemeContext.Provider value={theme}>
        <Toaster />
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden dark:bg-black dark:text-white">
          {!['/', '/401'].includes(location.pathname) && (
            <div className="w-full flex-none md:w-64 md:mt-20 dark:bg-black">
              <SideNav theme={theme} toggleTheme={toggleTheme} />
            </div>
          )}

          <div className="flex-grow p-6 md:overflow-y-auto cursor-pointer dark:bg-black">
            {currentUser && (
              <div className="md:flex md:items-center avatar placeholder md:justify-end hidden">
                <ThemeIcon size="md" theme={theme} toggleTheme={toggleTheme} className="mr-4" />
                {currentUser.profilepic ? (
                  <Link className="text-white" to="/profile">
                    <Avatar src={avatarUrl(currentUser.profilepic as string)} size="lg" />
                  </Link>
                ) : (
                  <div className="bg-primary text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
                    <Link className="text-white" to="/profile">
                      {getInitials(currentUser.full_name as string)}
                    </Link>
                  </div>
                )}
              </div>
            )}
            <div className="mt-10 z-10 bg-white dark:bg-black mx-3">
              <Outlet />
            </div>
          </div>
        </div>
      </ThemeContext.Provider>
    </>
  );
};

export default Layout;
