import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import PageTitle from '../../components/page-title';
import { WithAuth } from "../../lib/authutils";
import Button from '../../components/button';
import { ThemeContext } from '../../layouts/layout';
import { useContext } from 'react';
import { CustomerProjectType, ProjectTabType } from '../../lib/data/definitions-customer';
import { CustomerProjectDetails } from '../../lib/data/api';
import { formatDate } from '../../lib/utilities';
import ProjectCard from '../../components/project-card';
import { 
  ArrowRightIcon, 
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ArrowPathIcon,
  CalendarIcon, 
  UserGroupIcon, 
  ClockIcon
} from '@heroicons/react/24/outline';



export function CustomerProjectView(): JSX.Element {
  const navigate = useNavigate();
  const theme = useContext(ThemeContext);
  
  const [activeTab, setActiveTab] = useState<ProjectTabType>('ongoing');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<CustomerProjectType[]>([]);
  const [projectCounts, setProjectCounts] = useState({
    on_hold_count: 0,
    in_progress_count: 0,
    upcoming_count: 0,
    delay_count: 0,
    total_count: 0
  });
  
  // Load projects from API
  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await CustomerProjectDetails();
        // Transform API response to match CustomerProjectType
      const transformedProjects = response.projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        description: project.projecttype,
        projecttype: project.projecttype,
        testingtype: project.testingtype,
        startdate: project.has_active_retest ? project.retest_startdate : project.startdate,
        enddate: project.has_active_retest ? project.retest_enddate : project.enddate,
        companyname: "",
        owner: project.has_active_retest ? project.retest_owner_emails : project.owner_emails,
        holdReason: project.hold_reason,
        // Customer view specific fields
        engineers: project.has_active_retest 
          ? project.retest_owner_emails.map((email: string, idx: number) => ({ 
              id: idx, 
              name: email, 
              role: "Security Engineer" 
            }))
          : project.owner_emails.map((email: string, idx: number) => ({ 
              id: idx, 
              name: email, 
              role: "Security Engineer" 
            })),
        hasRetests: project.has_active_retest,
        retests: project.has_active_retest 
          ? [{ 
              id: project.retest_id, 
              name: `Retest for ${project.name}`, 
              date: project.retest_startdate, 
              status: project.retest_status 
            }] 
          : [],
        projectType: project.has_active_retest ? 'retest' : 'project'
      }));
      
      setProjects(transformedProjects);
      setProjectCounts(response.counts);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadProjects();
  }, []);
  // Handle view details button click
  const handleViewDetails = (id: number | undefined) => {
    if (id) navigate(`/customer/project/${id}`);
  };
  // Using imported formatDate from utilities with 'short' format
  
  // Calculate days remaining or overdue
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else {
      return `${diffDays} days remaining`;
    }
  };  // Render combined status and project type badge
  const renderStatusBadge = (status: string, projectType: 'project' | 'retest' = 'project') => {
    let bgColor = "bg-gray-100 text-gray-800";
    
    if (status.toLowerCase() === "ongoing" || status.toLowerCase() === "in progress") {
      bgColor = "bg-blue-100 text-blue-800";
    } else if (status.toLowerCase() === "delayed" || status.toLowerCase() === "delay") {
      bgColor = "bg-amber-100 text-amber-800";
    } else if (status.toLowerCase() === "on hold") {
      bgColor = "bg-yellow-100 text-yellow-800";
    } else if (status.toLowerCase() === "upcoming") {
      bgColor = "bg-purple-100 text-purple-800";
    }
    
    // Add icon based on project type
    const icon = projectType === 'retest' 
      ? <ArrowPathIcon className="w-4 h-4 mr-1" />
      : <DocumentArrowDownIcon className="w-4 h-4 mr-1" />;
    
    return (
      <div className="flex space-x-2">
        <span className={`${bgColor} px-3 py-1 rounded-full text-sm font-medium flex items-center`}>
          {status}
        </span>
        <span className={`${
          projectType === 'retest' 
            ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300' 
            : 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200'
        } px-3 py-1 rounded-full text-sm font-medium flex items-center`}>
          {icon}
          {projectType === 'retest' ? 'Retest' : 'Project'}
        </span>
      </div>
    );
  };  // The project type badge is now combined with the status badge// Render project cards for the selected tab
  const renderProjectCards = () => {
    // Filter projects based on active tab
    const projectsToShow = projects.filter((project) => {
      switch(activeTab) {
        case 'ongoing':
          return project.status === 'In Progress';
        case 'delayed':
          return project.status === 'Delay';
        case 'onhold':
          return project.status === 'On Hold';
        case 'upcoming':
          return project.status === 'Upcoming';
        default:
          return false;
      }
    });
    
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 animate-pulse rounded-xl h-64"></div>
          ))}
        </div>
      );
    }
    
    if (projectsToShow.length === 0) {
      return (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No {activeTab} projects found
          </p>
        </div>
      );
    }    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projectsToShow.map(project => (
          <div key={project.id}>
            <ProjectCard 
              project={project} 
              onViewDetails={() => handleViewDetails(project.id)} 
            />
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="px-4 py-2">
      <PageTitle title="Company Projects" />
      
      {/* Project Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">          <button
            className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium text-sm ${
              activeTab === 'ongoing' ? 
                'border-blue-500 text-blue-600 dark:text-blue-400' : 
                'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('ongoing')}
          >
            <ClockIcon className="w-5 h-5" />
            <span>Ongoing ({projectCounts.in_progress_count})</span>
          </button>
          
          <button
            className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium text-sm ${
              activeTab === 'delayed' ? 
                'border-amber-500 text-amber-600 dark:text-amber-400' : 
                'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('delayed')}
          >
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>Delayed ({projectCounts.delay_count})</span>
          </button>

          <button
            className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium text-sm ${
              activeTab === 'onhold' ? 
                'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 
                'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('onhold')}          >
            <ClockIcon className="w-5 h-5" />
            <span>On Hold ({projectCounts.on_hold_count})</span>
          </button>
          
          <button
            className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming' ? 
                'border-purple-500 text-purple-600 dark:text-purple-400' : 
                'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            <ArrowRightIcon className="w-5 h-5" />
            <span>Upcoming ({projectCounts.upcoming_count})</span>
          </button>
        </div>
      </div>
      
      {/* Project Cards */}
      {renderProjectCards()}
      
      {/* Footer Actions */}
      <div className="flex flex-wrap justify-between mt-8">
       
        
        <div className="flex space-x-3">
          <Button 
            onClick={() => navigate('/customer/past-projects')} 
            className="bg-secondary px-4 py-2 rounded-lg flex items-center"
          >
            View Completed Projects
          </Button>
          
          <Button 
            onClick={() => navigate('/customer-dashboard')} 
            className="bg-primary px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WithAuth(CustomerProjectView);