import React from 'react';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../lib/utilities';
import { CustomerProjectType } from '../lib/data/definitions-customer';
import { ProjectStatusBadge } from './status-badges';
import Button from './button';

interface ProjectCardProps {
  project: CustomerProjectType;
  onViewDetails: (id: number | undefined) => void;
}

/**
 * Calculates days remaining or days overdue for a project
 */
const calculateDaysRemaining = (endDate?: string): { value: number; isOverdue: boolean } => {
  if (!endDate) return { value: 0, isOverdue: false };
  
  const today = new Date();
  const end = new Date(endDate);
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diff = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { value: Math.abs(diff), isOverdue: diff < 0 };
};

/**
 * Project card component for displaying project information
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewDetails }) => {
  const daysInfo = calculateDaysRemaining(project.enddate);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {project.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              <ProjectStatusBadge status={project.status} />
              
              {project.projectType === 'retest' && (
                <span className="bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-medium rounded-full border-2 flex items-center">
                  <ArrowPathIcon className="w-3 h-3 mr-1" />
                  Retest
                </span>
              )}
              
              {project.testingtype && (
                <span className="bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 px-2.5 py-0.5 text-xs font-medium rounded-full border-2">
                  {project.testingtype}
                </span>
              )}
            </div>
          </div>
          
          <Button
            onClick={() => onViewDetails(project.id)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center"
          >
            View Details
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <CalendarIcon className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
            <span>
              {formatDate(project.startdate, 'short')} - {formatDate(project.enddate, 'short')}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <UserGroupIcon className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
            <span>
              {project.engineers && project.engineers.length > 0 
                ? project.engineers.slice(0, 2).map(e => e.name).join(', ') +
                  (project.engineers.length > 2 ? ' +' + (project.engineers.length - 2) : '')
                : 'No engineers assigned'}
            </span>
          </div>
          
          <div className="flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
            <span className={daysInfo.isOverdue 
              ? "text-red-600 dark:text-red-400" 
              : "text-green-600 dark:text-green-400"
            }>
              {daysInfo.isOverdue 
                ? `${daysInfo.value} days overdue` 
                : `${daysInfo.value} days remaining`}
            </span>
          </div>
        </div>

        {/* Display hold reason if project is on hold */}
        {project.status.toLowerCase() === 'on hold' && project.holdReason && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded-md">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
            <span><strong>On Hold Reason:</strong> {project.holdReason}</span>
          </div>
        )}

        {/* Display delay reason if project is delayed */}
        {project.status.toLowerCase() === 'delay' && project.delayReason && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-2 rounded-md">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
            <span><strong>Delay Reason:</strong> {project.delayReason}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
