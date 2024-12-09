// NavLinks.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  RocketLaunchIcon,
  CircleStackIcon,
  UserIcon,
  UsersIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
// ... (Icons and other imports)
import { ThemeIcon } from '../components/themeIcon';
import { currentUserCan } from '../lib/utilities';
interface NavLinksProps {
  theme: string;
  toggleTheme: () => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ theme, toggleTheme }) => {
  const pathname = useLocation().pathname;

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: RocketLaunchIcon },
    { name: 'Companies', href: '/companies', icon: BuildingOfficeIcon },
    { name: 'Customers', href: '/customers', icon: UserGroupIcon },
    { name: 'Projects', href: '/projects', icon: RocketLaunchIcon },
    { name: 'Vulnerability DB', href: '/vulnerabilities', icon: CircleStackIcon },
    ...(currentUserCan('Manage Users') ? [
      { name: 'Users', href: '/users', icon: UserIcon },
      { name: 'Groups', href: '/groups', icon: UsersIcon },
    ] : []),
    ...(currentUserCan('Manage Configurations') ? [
      { name: 'Configurations', href: '/config', icon: Cog6ToothIcon },
    ] : []),
  ];

  return (
    <div className="flex flex-col h-full space-y-4 py-6">
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            to={link.href}
            className={clsx(
              'flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ease-in-out dark:text-white',
              pathname === link.href
                ? 'bg-gray-700 text-white dark:bg-gray-900' // Active link with black background and white text
                : 'text-gray-700  hover:bg-blue-300 hover:text-white dark:hover:text-white', // Non-active link with default text color
              'md:flex-none md:justify-start md:p-3 md:px-6 md:w-full'
            )}
          >
            <LinkIcon className="w-6 h-6 md:w-8 md:h-8 dark:white" />
            <p className="text-base font-medium hidden md:block dark:text-white">{link.name}</p>
          </Link>
        );
      })}
    </div>
  );
};

export default NavLinks;
