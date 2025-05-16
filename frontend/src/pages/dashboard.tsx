import { WithAuth } from "../lib/authutils";
import PageTitle from '../components/page-title';
import { useState, useEffect } from 'react';
import { FaProjectDiagram, FaCalendarCheck, FaExclamationTriangle, FaPauseCircle, FaHourglassHalf } from 'react-icons/fa';
import { MdOutlineRateReview } from 'react-icons/md';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { IconType } from 'react-icons';
import { MyDashbaord } from '../lib/data/api';
import axios from 'axios';
import React from 'react';

// Ensure proper type casting for react-icons components
const FaProjectDiagramIcon = FaProjectDiagram as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const FaCalendarCheckIcon = FaCalendarCheck as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const FaExclamationTriangleIcon = FaExclamationTriangle as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const FaPauseCircleIcon = FaPauseCircle as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const FaHourglassHalfIcon = FaHourglassHalf as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const MdOutlineRateReviewIcon = MdOutlineRateReview as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

// Define types
interface Project {
  id: string;
  name: string;
  company_name: string;
  start_date: string;
  end_date: string;
  testing_type: string;
  status: string;
  project_type: string;
}

interface Retest {
  id: string;
  project_id: string;
  project_name: string;
  company_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface DashboardData {
  status_counts: {
    Delayed: number;
    In_Progress: number;
    On_Hold: number;
    Upcoming: number;
  };
  projects: {
    Delayed: Project[];
    In_Progress: Project[];
    On_Hold: Project[];
    Upcoming: Project[];
  };
  retests: {
    Delayed: Retest[];
    In_Progress: Retest[];
    On_Hold: Retest[];
    Upcoming: Retest[];
  };
}

interface StatusCardProps {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  count: number;
  color: string;
}

interface ProjectCardProps {
  project: Project;
  type: 'ongoing' | 'upcoming' | 'onHold' | 'delayed';
}

interface RetestCardProps {
  retest: Retest;
  type: 'upcoming' | 'onHold' | 'delayed' | 'ongoing';
}

// Components
const StatusCard: React.FC<StatusCardProps> = ({ icon: Icon, title, count, color }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md px-4 py-4 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{count}</p>
      </div>
      <Icon className="text-2xl text-gray-400 dark:text-gray-500" />
    </div>
  </div>
);

const ProjectCard: React.FC<ProjectCardProps> = ({ project, type }) => (
  <Link to={`/projects/${project.id}/summary`}>
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${
      type === 'onHold' ? 'border-l-4 border-l-amber-500' :
      type === 'delayed' ? 'border-l-4 border-l-red-500' : ''
    } cursor-pointer hover:shadow-md transition-shadow duration-200`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-md font-semibold text-gray-800 dark:text-white truncate">{project.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          type === 'ongoing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
          type === 'upcoming' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
          type === 'onHold' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {project.project_type}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{project.company_name}</p>
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">          <FaCalendarCheckIcon className="mr-1" />
          <span>Due: {format(new Date(project.end_date), 'MMM d, yyyy')}</span>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${
          project.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
          project.status === 'Upcoming' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
          project.status === 'On Hold' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {project.status}
        </span>
      </div>
    </div>
  </Link>
);

const RetestCard: React.FC<RetestCardProps> = ({ retest, type }) => (
  <Link to={`/projects/${retest.project_id}/retest`}>
    <div className={`border-l-4 ${
      type === 'ongoing' ? 'border-blue-500' :
      type === 'upcoming' ? 'border-green-500' :
      type === 'onHold' ? 'border-amber-500' : 'border-red-500'
    } bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200`}>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1 truncate">{retest.project_name}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{retest.company_name}</p>
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">          <FaCalendarCheckIcon className="mr-1" />
          <span>Due: {format(new Date(retest.end_date), 'MMM d, yyyy')}</span>
        </div>
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          type === 'ongoing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
          type === 'upcoming' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
          type === 'onHold' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {retest.status}
        </span>
      </div>
    </div>
  </Link>
);

// Dashboard Component
const Dashboard = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Use the API function that we've imported directly
        const data = await MyDashbaord();
        
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-center">
          <p className="text-lg">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  // Extract counts
  const { Delayed: delayedCount, In_Progress: inProgressCount, On_Hold: onHoldCount, Upcoming: upcomingCount } = dashboardData.status_counts;
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <PageTitle title={'Pentester Dashboard'} />
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back! Here's an overview of your projects and retests.
        </p>
      </div>
      
      {/* Status Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard icon={FaProjectDiagramIcon} title="Active Projects" count={inProgressCount} color="border-blue-500" />
        <StatusCard icon={FaExclamationTriangleIcon} title="Delayed Projects" count={delayedCount} color="border-red-500" />
        <StatusCard icon={FaPauseCircleIcon} title="On Hold Projects" count={onHoldCount} color="border-amber-500" />
        <StatusCard icon={FaCalendarCheckIcon} title="Upcoming Projects" count={upcomingCount} color="border-green-500" />
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Projects Section */}
        <div className="space-y-6">
          {/* Active Projects Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                  <FaProjectDiagramIcon className="mr-2 text-blue-500" /> Projects
                </h2>
                <Link to="/projects" className="text-blue-500 text-sm hover:underline">View All</Link>
              </div>
            </div>
            <div className="p-4">              {/* Delayed Projects */}
              {dashboardData.projects.Delayed.length > 0 && (
                <>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <FaExclamationTriangleIcon className="inline-block mr-2 text-red-500" /> Delayed
                  </h3>
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    {dashboardData.projects.Delayed.map(project => (
                      <ProjectCard key={project.id} project={project} type="delayed" />
                    ))}
                  </div>
                </>
              )}
              
              {/* In Progress Projects */}
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 mt-6">
                <FaProjectDiagramIcon className="inline-block mr-2 text-blue-500" /> In Progress
              </h3>
              <div className="grid grid-cols-1 gap-4 mb-6">
                {dashboardData.projects.In_Progress.map(project => (
                  <ProjectCard key={project.id} project={project} type="ongoing" />
                ))}
                {dashboardData.projects.In_Progress.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">No projects in progress</p>
                )}
              </div>
                {/* On Hold Projects */}
              {dashboardData.projects.On_Hold.length > 0 && (
                <>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 mt-6">
                    <FaPauseCircleIcon className="inline-block mr-2 text-amber-500" /> On Hold
                  </h3>
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    {dashboardData.projects.On_Hold.map(project => (
                      <ProjectCard key={project.id} project={project} type="onHold" />
                    ))}
                  </div>
                </>
              )}
                {/* Upcoming Projects */}
              {dashboardData.projects.Upcoming.length > 0 && (
                <>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 mt-6">
                    <FaCalendarCheckIcon className="inline-block mr-2 text-green-500" /> Upcoming
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {dashboardData.projects.Upcoming.map(project => (
                      <ProjectCard key={project.id} project={project} type="upcoming" />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Retests Section */}
        <div className="space-y-6">
          {/* Retests Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                  <MdOutlineRateReviewIcon className="mr-2 text-purple-500" /> Retests
                </h2>
                <Link to="/projects" className="text-blue-500 text-sm hover:underline">View All</Link>
              </div>
            </div>
            <div className="p-4">              {/* Delayed Retests */}
              {dashboardData.retests.Delayed.length > 0 && (
                <>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <FaExclamationTriangleIcon className="inline-block mr-2 text-red-500" /> Delayed
                  </h3>
                  <div className="mb-6">
                    {dashboardData.retests.Delayed.map(retest => (
                      <RetestCard key={retest.id} retest={retest} type="delayed" />
                    ))}
                  </div>
                </>
              )}
                {/* In Progress Retests */}
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 mt-6">
                <MdOutlineRateReviewIcon className="inline-block mr-2 text-blue-500" /> In Progress
              </h3>
              <div className="mb-6">
                {dashboardData.retests.In_Progress.map(retest => (
                  <RetestCard key={retest.id} retest={retest} type="ongoing" />
                ))}
                {dashboardData.retests.In_Progress.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">No retests in progress</p>
                )}
              </div>
                {/* On Hold Retests */}
              {dashboardData.retests.On_Hold.length > 0 && (
                <>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 mt-6">
                    <FaPauseCircleIcon className="inline-block mr-2 text-amber-500" /> On Hold
                  </h3>
                  <div className="mb-6">
                    {dashboardData.retests.On_Hold.map(retest => (
                      <RetestCard key={retest.id} retest={retest} type="onHold" />
                    ))}
                  </div>
                </>
              )}
                {/* Upcoming Retests */}
              {dashboardData.retests.Upcoming.length > 0 && (
                <>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 mt-6">
                    <FaCalendarCheckIcon className="inline-block mr-2 text-green-500" /> Upcoming
                  </h3>
                  <div>
                    {dashboardData.retests.Upcoming.map(retest => (
                      <RetestCard key={retest.id} retest={retest} type="upcoming" />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithAuth(Dashboard);