// authUtils.tsx
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from './customHooks';

export function WithAuth(Component: React.ComponentType<any>): React.FC<any> {
  const WithAuth: React.FC<any> = (props) => {
    const currentUser = useCurrentUser()
    
    // Redirect to the login page if currentUser does not exist
    if (!currentUser) {
      //capture the current path in localStorage to redirect to after auth
      localStorage.setItem('redirect',document.location.pathname)
      
      const relogin = true;
      return <Navigate to="/" replace={true} state={{ relogin }} />;
    }

    // Render the component if currentUser exists
    return (
            <>
            {currentUser &&
              <Component {...props} />
            }
            </>)
  };

  return WithAuth;
}
