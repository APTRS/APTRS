// App.tsx
import React from 'react';
import { Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './layouts/layout';
import Home from './pages/home';
import Login from './pages/login';
import Vulnerabilities from './pages/vulnerabilities';
import VulnerabilityRender from './pages/VulnerabilityRender';
import VulnerabilityForm from './pages/vulnerability-form';
import Customers from './pages/customers';
import Projects from './pages/projects/projects'
import ProjectView from './pages/projects/project-view';
import VulnerabilityView from './pages/vulnerability-view';
import ProjectForm from './pages/projects/project-form';
import CompanyForm from './pages/company-form';
import Companies from './pages/companies';
import Dashboard from './pages/dashboard'; // Replace with your protected page component
import Users from './pages/users'
import Groups from './pages/groups'
import ErrorPage from './pages/error-page';
import AccessDenied from './pages/access-denied';
import Profile from './pages/profile';
import Config from './pages/config';
import CustomerDashboard from './pages/customerview/customer-dashboard';
import CustomerProjectView from './pages/customerview/ProjectView';
import CustomerProjectDetails from './pages/customerview/ProjectDetails';
import CustomerVulnerabilityView from './pages/customerview/Vulnerability-view'
import PastProject from './pages/customerview/PastProject';
import SetPassword from './pages/set-password'; // Importing SetPassword page
import { useEffect } from 'react';
import { refreshAuth, getAuthUser, shouldRefreshToken } from './lib/data/api';
import Logout from './pages/logout';
import.meta.env.VITE_APP_ENV


const App: React.FC = () => {
  const user = getAuthUser()
  const navigate = useNavigate()
  const location = useLocation()
  
  useEffect(() => {    // Define paths that should be accessible without authentication
    const publicPaths = [
      '/set-password', // Invitation acceptance page
      '/reset-password', // Password reset page
      '/activate-account', // Account activation page
    ];

    // Check if the current path is in the public paths list
    const isPublicPath = publicPaths.some(path => 
      location.pathname.startsWith(path)
    );

    if (!user && !isPublicPath) {
      if (!localStorage.getItem('redirect')) {
        localStorage.setItem('redirect', document.location.pathname);
      }
      console.log('Redirecting to login page...' + document.location.pathname);
      navigate('/');
    }
    
    const refreshUser = async () => {
      try {
        const refreshedUser = await refreshAuth();
        if(!refreshedUser){
          // can't use useNavigate outside of a Router component
          // see https://stackoverflow.com/questions/70491774/usenavigate-may-be-used-only-in-the-context-of-a-router-component
          navigate('/')
        }
      } catch(error){
        console.error('Error refreshing authentication:', error);
      }
    };
    // Call the refreshUser function every 28 minutes, token valid for 30 mins, 2 mins buffer time to refresh at 28th mins
    const intervalId = setInterval(refreshUser, 1680000);
    return () => clearInterval(intervalId);
  }, [location.pathname]);
  
  if(shouldRefreshToken()){
    refreshAuth()
  }
  return (
        
        
            <Routes>
              <Route path="/" element={<Layout />}>                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                {/* Routes for handling invitation links and password reset - accessible without being logged in */}
                <Route path="/set-password/:token" element={<SetPassword />} />
                <Route path="/reset-password/:token" element={<SetPassword />} />
                {user ? 
                  <>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/companies" element={<Companies />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/projects" element={<Projects pageTitle='Projects' hideActions={false}/>} />
                    <Route path="/projects/new" element={<ProjectForm />} />
                    <Route path="/projects/:id" element={<ProjectView />} />
                    <Route path="/projects/:id/:tab" element={<ProjectView />} />
                    <Route path="/projects/:id/edit" element={<ProjectForm />} />
                    
                    <Route path="/projects/:projectId/vulnerability/add" element={<VulnerabilityForm action='addToProject' />} />
                    <Route path="/projects/:projectId/vulnerability/add/:id" element={<VulnerabilityForm action='addToProject'/>} />
                    <Route path="/projects/:projectId/vulnerability/edit/:id" element={<VulnerabilityForm action='saveToProject'/>} />
                    <Route path="/projects/:projectId/vulnerability/edit/:id/:tab" element={<VulnerabilityForm action='saveToProject'/>} />
                    <Route path="/projects/:projectId/vulnerability/view/:id" element={<VulnerabilityRender action='ViewVulnerability'/>} />
                    <Route path="/companies/:id/edit" element={<CompanyForm />} />
                    <Route path="/companies/new" element={<CompanyForm />} />
                    <Route path="/config" element={<Config />} />
                    <Route path="/vulnerabilities" element={<Vulnerabilities />} />
                    <Route path="/vulnerabilities/:id/edit" element={<VulnerabilityForm />} />
                    
                    <Route path="/vulnerabilities/:id" element={<VulnerabilityView />} />
                    <Route path="/vulnerabilities/new" element={<VulnerabilityForm />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/groups" element={<Groups />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/access-denied" element={<AccessDenied />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/customer-dashboard" element={<CustomerDashboard />} />
                    <Route path="/customer-projects" element={<CustomerProjectView />} />
                    <Route path="/customer/project/:id" element={<CustomerProjectDetails />} />  
                    <Route path="/customer/project/vulnerability/view/:id" element={<CustomerVulnerabilityView />} />
                    <Route path="/customer/past-project" element={<PastProject  pageTitle='Past Projects'/>} />
                    <Route path="*" element={<ErrorPage is404={true}/>} />
                  </>
                : 
                  <>
                    <Route path="404" element={<ErrorPage is404={true}/>} />
                    <Route path="/access-denied" element={<AccessDenied />} />
                    <Route path="/error" element={<ErrorPage />} />
                    
                  </>
                }                
              </Route>
            </Routes>
          
        
  
  );
};
export default App;
