// authUtils.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from './customHooks';


export function WithAuth(Component: React.ComponentType<any>): React.FC<any> {
  const WithAuth: React.FC<any> = (props) => {

    const currentUser = useCurrentUser();
    const location = useLocation();

    // Define paths that should be accessible without authentication
    const publicPaths = [
      '/set-password', // Password reset page
      '/activate-account', // Account activation page
    
    ];

    // Check if the current path is in the public paths list
    const isPublicPath = publicPaths.some(path => 
      location.pathname.startsWith(path)
    );

    // Redirect to the login page if currentUser does not exist and not on a public path
    if (!currentUser && !isPublicPath) {
      const redirectPath = location.pathname + location.search;
      //capture the current path in localStorage to redirect to after auth
      console.log('Redirecting to login page...' + redirectPath)
      localStorage.setItem('redirect', redirectPath)

      
      const relogin = true;
      return <Navigate to="/" replace={true} state={{ relogin }} />;
    }

    // Render the component if currentUser exists or if it's a public path
    return (
            <>
            <Component {...props} />
            </>)
  };

  return WithAuth;
}
