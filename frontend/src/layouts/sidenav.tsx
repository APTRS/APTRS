// SideNav.tsx
import React from 'react';
import NavLinks from './navlinks';
import { PowerIcon } from '@heroicons/react/24/outline';
import Button from '../components/button';
import { useCurrentUser } from '../lib/customHooks';
import { useNavigate } from 'react-router-dom';
interface SideNavProps {
  theme: string;
  toggleTheme: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ theme, toggleTheme }) => {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const handleSignOut = () => {
    navigate('/logout')
 }
  
  return (
    <>
      {currentUser &&
        <div className="flex h-full flex-col px-3 py-4 md:px-2">
          <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
            <NavLinks theme={theme} toggleTheme={toggleTheme} />
            <div className="hidden h-auto w-full grow rounded-md bg-gray-80 md:block"></div>
            {currentUser && (
              <Button
                className="bg-secondary"
                onClick={handleSignOut}
              >
                <PowerIcon className="w-6 md:w-8 mr-2" />
                <div className="hidden md:block md:text-md">Sign Out</div>
              </Button>
            )}
          </div>
        </div>
      }
    </>  
  );
};

export default SideNav;
