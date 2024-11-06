import SideNav from './sidenav'; 
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useCurrentUser } from '../lib/customHooks';
import { getInitials, avatarUrl } from '../lib/utilities'
import { Link } from 'react-router-dom';
import { Avatar } from '@material-tailwind/react';
import { useEffect, useState, createContext } from 'react';
import { LoginUser } from '../lib/data/definitions'
import { ThemeIcon } from '../components/themeIcon';

export const ThemeContext = createContext('light')
const Layout: React.FC = () => {
  const navigate = useNavigate()
  const [theme, setTheme] = useState('light')
  const toggleTheme = () => {
    if(theme === 'light'){
      document.documentElement.classList.add('dark')
      const editors = document.querySelectorAll('.ck');
      editors.forEach(editor => {
        editor.classList.add('custom-ckeditor-dark');
    });
      setTheme('dark')
    } else {
      document.documentElement.classList.remove('dark')
      const editors = document.querySelectorAll('.ck');
      editors.forEach(editor => {
        editor.classList.remove('custom-ckeditor-dark');
    });
      setTheme('light')
    }
  }
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
      setTheme('dark')
      const editors = document.querySelectorAll('.ck');
      editors.forEach(editor => {
        editor.classList.add('custom-ckeditor-dark');
      });
    }
  }, [])
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(useCurrentUser())
  // can't use useLocation here because the layout is outside of the  Router in App.tsx
  const location = useLocation();
  // useEffect(() => {
  //   const user = useCurrentUser()
  //   setCurrentUser(user)
  //   if(!user){
  //     if(!['/','/401'].includes(location.pathname)){
  //       navigate('/')
  //     }
  //   }
  // }, [location.pathname])
   
  return (
        <>
          <ThemeContext.Provider value={theme}>
            <Toaster />
            <div className="flex h-screen flex-col md:flex-row md:overflow-hidden dark:bg-gray-darkest dark:text-white">
              
                {!['/','/401'].includes(location.pathname) &&
                  <div className="w-full flex-none md:w-64 md:mt-20">
                    <SideNav theme={theme} toggleTheme={toggleTheme} />
                  </div>
                }   
                
              <div className="flex-grow p-6 md:overflow-y-auto  cursor-pointer">
                  {currentUser &&
                    <>
                      <div className="md:flex md:items-center avatar placeholder md:justify-end hidden">
                        <ThemeIcon size='md' theme={theme} toggleTheme={toggleTheme} className='mr-4'/>
                        {currentUser.profilepic && 
                            <Link className='text-white' to="/profile">
                              <Avatar src={avatarUrl(currentUser.profilepic as string)} size="lg"/>
                            </Link>
                          }
                          {!currentUser.profilepic &&
                            <div className="bg-primary text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
                              <Link className='text-white' to="/profile">
                                {getInitials(currentUser.full_name as string)}
                              </Link>
                            </div>
                          }
                      </div>
                      </>
                    }
                <div className='mt-10 z-10 bg-white dark:bg-gray-darkest'>
                  <Outlet />
                </div>
              </div>
            </div>
          </ThemeContext.Provider>
        </>
  );
};

export default Layout;
