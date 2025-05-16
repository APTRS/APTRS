import React, { useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  RadialLinearScale,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { 
  BriefcaseIcon, 
  CalendarIcon, 
  ClockIcon, 
  ShieldCheckIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentCheckIcon,
  PauseCircleIcon,
  UserGroupIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useNavigate, Link } from 'react-router-dom';

import { fetchDashboardProjects, fetchLastTenVulnerability, getVulnerabilityDashboardStats, getOrganizationVulnerabilityStats } from '../../lib/data/api';
import { getProjectStatusColor } from '../../lib/utilities';
import { getSeverityClass } from '../../lib/data/definitions-customer';
import { ProjectCard } from '../../components/project-card';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title,
  RadialLinearScale
);

// Chart data type definitions
type PieChartData = ChartData<'pie', number[], string>;
type LineChartData = ChartData<'line', number[], string>;
type BarChartData = ChartData<'bar', number[], string>;
type RadarChartData = ChartData<'radar', string[], string>;

// Chart options type definitions
type PieChartOptions = ChartOptions<'pie'>;
type LineChartOptions = ChartOptions<'line'>;
type BarChartOptions = ChartOptions<'bar'>;
type RadarChartOptions = ChartOptions<'radar'>;

// Reusable table component
interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  cellRenderer?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
}

function DataTable<T>({ data, columns, keyField, onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 dark:text-white">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index} 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item) => (
            <tr 
              key={String(item[keyField])} 
              className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column, index) => (
                <td key={index} className={index === 0 ? "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white" : "px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-white-300"}>
                  {column.cellRenderer 
                    ? column.cellRenderer(item)
                    : typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : String(item[column.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Reusable components
interface DataCardProps {
  title: string;
  value: number | string;
  color: string;
  icon: React.ForwardRefExoticComponent<any>;
}

function DataCard({ title, value, color, icon: Icon }: DataCardProps) {
  return (
    <div
      className={`p-6 rounded-xl shadow-lg text-white bg-gradient-to-br ${color} flex items-center justify-between transition-transform transform hover:scale-105`}
    >
      <div>
        <h2 className="text-lg font-semibold mb-1">{title}</h2>
        <p className="text-4xl font-bold">{value}</p>
      </div>
      <Icon className="h-10 w-10 text-white opacity-75" />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  subtext?: string;
  color: string;
  icon: React.ForwardRefExoticComponent<any>;
}

function MetricCardComponent({ title, value, subtext, color, icon: Icon }: MetricCardProps) {
  return (
    <div
      className={`p-6 rounded-xl shadow-md bg-white dark:bg-gray-800 border-l-4 border-${color.split(' ')[0]} flex items-center justify-between transition-transform transform hover:scale-105`}
    >
      <div>
        <h2 className="text-base font-medium mb-1 text-gray-700 dark:text-white-100">{title}</h2>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtext && (
          <p className="text-sm text-gray-700 dark:text-blue-300 mt-1">{subtext}</p>
        )}
      </div>
      <div className={`p-3 rounded-full bg-gradient-to-br ${color}`}>
        <Icon className="h-7 w-7 text-white" />
      </div>
    </div>
  );
}

// Chart component wrappers to simplify the JSX
interface ChartSectionProps {
  title: string;
  children: React.ReactNode;
  span?: number;
}

function ChartSection({ title, children, span = 1 }: ChartSectionProps) {
  return (
    <div className={`lg:col-span-${span} bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md`}>
      <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white-200">{title}</h2>
      <div className="h-64 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Section component for projects and retests
interface ProjectSectionProps {
  title: string;
  children: React.ReactNode;
}

function ProjectSection({ title, children }: ProjectSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{title}</h2>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden">
        {children}
      </div>
    </section>
  );
}

// Interface for vulnerability dashboard stats data
interface MonthlyTrend {
  month: string;
  month_name: string;
  year: number;
  Critical: number;
  High: number;
  Medium: number;
}

interface SeverityCounts {
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
  None: number;
  total: number;
}

interface VulnerabilityDashboardStats {
  severity_counts: SeverityCounts;
  monthly_trends: MonthlyTrend[];
}

// Interface for organization vulnerability stats
interface SecurityScore {
  current: number;
  change: number;
  change_text: string;
}

interface RemediatedIssues {
  count: number;
  percentage: number;
  text: string;
}

interface AvgFixTime {
  days: number | null;
  text: string;
  critical_days: number | null;
}

interface OrganizationVulnerabilityStats {
  security_score: SecurityScore;
  remediated_issues: RemediatedIssues;
  avg_fix_time: AvgFixTime;
}

interface Retest {
  id: number;
  name: string;
  startdate: string;
  enddate: string;
  owners: Owner[];
  status: string;
  project_id: number;
}

// Interface for dashboard project data
interface DashboardProject {
  id: number;
  name: string;
  startdate: string;
  enddate: string;
  owners: Owner[];
  status: string;
}

interface Owner {
  username: string;
  full_name: string;
}

interface DashboardData {
  counts: {
    active_count: number;
    delay_count: number;
    upcoming_count: number;
    on_hold_count: number; // Added on_hold_count
    total_count: number;
  };
  active: {
    projects: DashboardProject[];
    retests: Retest[];
  };
  delay: {
    projects: DashboardProject[];
    retests: Retest[];
  };
  upcoming: {
    projects: DashboardProject[];
    retests: Retest[];
  };
  on_hold: { // Added on_hold section
    projects: DashboardProject[];
    retests: Retest[];
  };
}

interface Finding {
  id: number;
  name: string;
  project: string;
  project_id: number;
  date: string;
  severity: string; // Changed from enum to string to match API response
}

interface DashboardProjectCardProps {
  project: DashboardProject;
  type?: 'ongoing' | 'delayed' | 'onHold' | 'upcoming';
}

/**
 * Project card component for dashboard using the dashboard data structure
 * Mimics the styling of the main ProjectCard component for consistency
 */
const DashboardProjectCard: React.FC<DashboardProjectCardProps> = ({ project, type = 'ongoing' }) => {
  const navigate = useNavigate();
  
  // Calculate days remaining or overdue
  const calculateDaysRemaining = (endDate?: string): { value: number; isOverdue: boolean } => {
    if (!endDate) return { value: 0, isOverdue: false };
    
    const today = new Date();
    const end = new Date(endDate);
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { value: Math.abs(diff), isOverdue: diff < 0 };
  };

  const daysInfo = calculateDaysRemaining(project.enddate);
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {project.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-2 ${getProjectStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customer/project/${project.id}`);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center"
          >
            View Details
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <CalendarIcon className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
            <span>
              {project.startdate} - {project.enddate}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <UserGroupIcon className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
            <span>
              {project.owners && project.owners.length > 0
                ? project.owners.slice(0, 2).map(o => o.full_name).join(', ') +
                  (project.owners.length > 2 ? ' +' + (project.owners.length - 2) : '')
                : 'No owners assigned'}
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
      </div>
    </div>
  );
};

interface ProjectCardGridProps {
  projects: DashboardProject[];
  title: string;
  type?: 'ongoing' | 'delayed' | 'onHold' | 'upcoming';
  emptyMessage?: string;
}

/**
 * Grid layout for displaying project cards
 */
const ProjectCardGrid: React.FC<ProjectCardGridProps> = ({
  projects, 
  title, 
  type = 'ongoing',
  emptyMessage = 'No projects to display'
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
      </div>
      <div className="p-4">
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {projects.map(project => (
              <DashboardProjectCard key={project.id} project={project} type={type} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
};

interface DashboardRetestCardProps {
  retest: Retest;
  type?: 'ongoing' | 'delayed' | 'onHold' | 'upcoming';
}

/**
 * Retest card component for dashboard using the dashboard data structure
 * Mimics the styling of the project cards for consistency
 */
const DashboardRetestCard: React.FC<DashboardRetestCardProps> = ({ retest, type = 'ongoing' }) => {
  const navigate = useNavigate();
  
  // Calculate days remaining or overdue
  const calculateDaysRemaining = (endDate?: string): { value: number; isOverdue: boolean } => {
    if (!endDate) return { value: 0, isOverdue: false };
    
    const today = new Date();
    const end = new Date(endDate);
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { value: Math.abs(diff), isOverdue: diff < 0 };
  };

  const daysInfo = calculateDaysRemaining(retest.enddate);
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => navigate(`/projects/${retest.id}`)}
    >
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {retest.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-2 ${getProjectStatusColor(retest.status)}`}>
                {retest.status}
              </span>
              <span className="bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-medium rounded-full border-2 flex items-center">
                <ArrowPathIcon className="w-3 h-3 mr-1" />
                Retest
              </span>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customer/project/${retest.project_id}`);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center"
          >
            View Details
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <CalendarIcon className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />            <span>
              {retest.startdate} - {retest.enddate}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <UserGroupIcon className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
            <span>
              {retest.owners && retest.owners.length > 0
                ? retest.owners.slice(0, 2).map(o => o.full_name).join(', ') +
                  (retest.owners.length > 2 ? ' +' + (retest.owners.length - 2) : '')
                : 'No owners assigned'}
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
      </div>
    </div>
  );
};

interface RetestCardGridProps {
  retests: Retest[];
  title: string;
  type?: 'ongoing' | 'delayed' | 'onHold' | 'upcoming';
  emptyMessage?: string;
}

/**
 * Grid layout for displaying retest cards
 */
const RetestCardGrid: React.FC<RetestCardGridProps> = ({
  retests, 
  title, 
  type = 'ongoing',
  emptyMessage = 'No retests to display'
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
      </div>
      <div className="p-4">
        {retests.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {retests.map(retest => (
              <DashboardRetestCard key={retest.id} retest={retest} type={type} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
};

const CustomerDashboard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentFindings, setRecentFindings] = useState<Finding[]>([]);
  const [vulnerabilityStats, setVulnerabilityStats] = useState<VulnerabilityDashboardStats | null>(null);
  const [orgVulnerabilityStats, setOrgVulnerabilityStats] = useState<OrganizationVulnerabilityStats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel using Promise.all for better performance
        const [projectData, findingsData, statsData, orgStats] = await Promise.all([
          fetchDashboardProjects(),
          fetchLastTenVulnerability(),
          getVulnerabilityDashboardStats(),
          getOrganizationVulnerabilityStats()
        ]);
        
        // Set state with fetched data
        setDashboardData(projectData);
        
        setRecentFindings(findingsData.map((finding: any) => ({
          id: finding.id,
          name: finding.name,
          project: finding.project,
          project_id: finding.project_id,
          date: finding.date,
          severity: finding.severity
        })));
        
        setVulnerabilityStats(statsData);
        setOrgVulnerabilityStats(orgStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const cardData = [
    { title: 'Active Projects', value: dashboardData?.counts.active_count || 0, color: 'from-indigo-500 to-blue-500', icon: BriefcaseIcon },
    { title: 'Upcoming Projects', value: dashboardData?.counts.upcoming_count || 0, color: 'from-green-500 to-teal-500', icon: CalendarIcon },
    { title: 'Delayed Projects', value: dashboardData?.counts.delay_count || 0, color: 'from-red-500 to-pink-500', icon: ClockIcon },
    { title: 'On Hold Projects', value: dashboardData?.counts.on_hold_count || 0, color: 'from-amber-800 to-yellow-600', icon: PauseCircleIcon },
  ];

  const metricCards: MetricCardProps[] = [
    { 
      title: 'Security Score', 
      value: orgVulnerabilityStats ? `${orgVulnerabilityStats.security_score.current}/100` : 'N/A', 
      subtext: orgVulnerabilityStats?.security_score.change_text || 'No data available', 
      color: 'from-emerald-500 to-teal-600', 
      icon: ShieldCheckIcon 
    },
    { 
      title: 'Remediated Issues', 
      value: orgVulnerabilityStats?.remediated_issues.text || 'N/A', 
      subtext: orgVulnerabilityStats ? `${orgVulnerabilityStats.remediated_issues.percentage}% of total` : 'No data available', 
      color: 'from-blue-500 to-cyan-600', 
      icon: CheckCircleIcon 
    },
    { 
      title: 'Avg. Time to Fix', 
      value: orgVulnerabilityStats?.avg_fix_time.text || 'N/A', 
      subtext: orgVulnerabilityStats?.avg_fix_time.critical_days ? `Critical issues: ${orgVulnerabilityStats.avg_fix_time.critical_days} days` : 'No critical data available', 
      color: 'from-violet-500 to-purple-600', 
      icon: ClockIcon 
    },
  ];

  // Default chart data to use when API data is not available
  const defaultPieChartData: PieChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'Information'],
    datasets: [
      {
        data: [10, 20, 30, 25, 15],
        backgroundColor: ['#DC2626', '#F97316', '#FACC15', '#84CC16', '#3B82F6'],
        borderWidth: 1,
        borderColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      },
    ],
  };

  const defaultTrendChartData: LineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Critical',
        data: [5, 8, 12, 10, 7],
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.5)',
        tension: 0.3,
      },
      {
        label: 'High',
        data: [12, 19, 15, 17, 14],
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Medium',
        data: [18, 25, 20, 22, 17],
        borderColor: '#FACC15',
        backgroundColor: 'rgba(250, 204, 21, 0.5)',
        tension: 0.3,
      }
    ],
  };

  // Create pie chart data from API response
  const generatePieChartData = (): PieChartData => {
    if (!vulnerabilityStats) {
      return defaultPieChartData; // Return default data if stats not available
    }
    
    const { severity_counts } = vulnerabilityStats;
    
    return {
      labels: ['Critical', 'High', 'Medium', 'Low', 'Information'],
      datasets: [
        {
          data: [
            severity_counts.Critical,
            severity_counts.High,
            severity_counts.Medium,
            severity_counts.Low,
            severity_counts.None || (severity_counts as any).Informational || 0, // API returns 'None' but we display as 'Informational'
          ],
          backgroundColor: ['#DC2626', '#F97316', '#FACC15', '#84CC16', '#3B82F6'],
          borderWidth: 1,
          borderColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        },
      ],
    };
  };
  
  // Create trend data from API response
  const generateTrendChartData = (): LineChartData => {
    if (!vulnerabilityStats) {
      return defaultTrendChartData; // Return default data if stats not available
    }
    
    const { monthly_trends } = vulnerabilityStats;
    
    return {
      labels: monthly_trends.map(m => m.month_name.substring(0, 3)),
      datasets: [
        {
          label: 'Critical',
          data: monthly_trends.map(m => m.Critical),
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.5)',
          tension: 0.3,
        },
        {
          label: 'High',
          data: monthly_trends.map(m => m.High),
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Medium',
          data: monthly_trends.map(m => m.Medium),
          borderColor: '#FACC15',
          backgroundColor: 'rgba(250, 204, 21, 0.5)',
          tension: 0.3,
        }
      ],
    };
  };

  const pieChartData: PieChartData = useMemo(() => generatePieChartData(), [vulnerabilityStats, isDarkMode]);

  const pieChartOptions: PieChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          boxWidth: 12,
          font: {
            size: 12,
          },
          color: isDarkMode ? '#D1D5DB' : '#4B5563',
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
      },
    },
  }), [isDarkMode]);

  const monthlyTrendData: LineChartData = useMemo(() => generateTrendChartData(), [vulnerabilityStats]);

  const lineChartOptions: LineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)',
        },
        ticks: {
          color: isDarkMode ? '#D1D5DB' : '#4B5563',
        }
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)',
        },
        ticks: {
          color: isDarkMode ? '#D1D5DB' : '#4B5563',
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { size: 12 },
          color: isDarkMode ? '#D1D5DB' : '#4B5563',
        }
      },
      title: {
        display: true,
        text: 'Monthly Trend of Findings',
        color: isDarkMode ? '#F3F4F6' : '#111827',
        font: { size: 14, weight: 'bold' as const }
      }
    }
  }), [isDarkMode]);

  const activeProjects = dashboardData?.active.projects || [];
  const upcomingProjects = dashboardData?.upcoming.projects || [];
  const delayedProjects = dashboardData?.delay.projects || [];
  const onHoldProjects = dashboardData?.on_hold.projects || [];
  const activeRetests = dashboardData?.active.retests || [];
  const upcomingRetests = dashboardData?.upcoming.retests || [];
  const delayedRetests = dashboardData?.delay.retests || [];
  const onHoldRetests = dashboardData?.on_hold.retests || [];

  const handleFindingClick = (finding: Finding) => {
    navigate(`/projects/${finding.project_id}/vulnerability/view/${finding.id}`);
  };

  return (
    <div className="p-6 md:p-10 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0 text-gray-900 dark:text-white">Customer Dashboard</h1>
        
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cardData.map((card, index) => (
          <DataCard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {metricCards.map((card, index) => (
          <MetricCardComponent key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Open Findings by Severity</h2>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Monthly Finding Trends</h2>
          <div className="h-64">
            <Line data={monthlyTrendData} options={lineChartOptions} />
          </div>
        </div>
      </div>      <div className="mb-10 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Last 10 Findings</h2>        <DataTable
          data={recentFindings}
          keyField="id"
          onRowClick={handleFindingClick}
          columns={[
            { header: 'Finding', accessor: 'name' },
            { 
              header: 'Severity', 
              accessor: 'severity', 
              cellRenderer: (item) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border-2 ${getSeverityClass(item.severity === 'None' || item.severity === 'Info' ? 'Informational' : item.severity)}`}>
                  {item.severity === 'None' || item.severity === 'Info' ? 'Informational' : item.severity}
                </span>
              )
            },
            { header: 'Project', accessor: 'project' },
            { header: 'Published Date', accessor: 'date' },
            { 
              header: 'Actions', 
              accessor: (item) => null,
              cellRenderer: (item) => (
                <Link
                  to={`/customer/project/vulnerability/view/${item.id}`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()} // Prevent row click handler from firing
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Link>
              )
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10 flex flex-col">
          <ProjectCardGrid
            title="Active Projects"
            projects={activeProjects}
            type="ongoing"
            emptyMessage="No active projects"
          />
          
          {delayedProjects.length > 0 && (
            <ProjectCardGrid
              title="Delayed Projects"
              projects={delayedProjects}
              type="delayed"
              emptyMessage="No delayed projects"
            />
          )}
          
          {onHoldProjects.length > 0 && (
            <ProjectCardGrid
              title="On Hold Projects"
              projects={onHoldProjects}
              type="onHold"
              emptyMessage="No on-hold projects"
            />
          )}
          
          {upcomingProjects.length > 0 && (
            <ProjectCardGrid
              title="Upcoming Projects"
              projects={upcomingProjects}
              type="upcoming"
              emptyMessage="No upcoming projects"
            />
          )}
        </div>        <div className="space-y-10 flex flex-col">
          <RetestCardGrid
            title="Active Retests"
            retests={activeRetests}
            type="ongoing"
            emptyMessage="No active retests"
          />
          
          {upcomingRetests.length > 0 && (
            <RetestCardGrid
              title="Upcoming Retests"
              retests={upcomingRetests}
              type="upcoming"
              emptyMessage="No upcoming retests"
            />
          )}
          
          {delayedRetests.length > 0 && (
            <RetestCardGrid
              title="Delayed Retests"
              retests={delayedRetests}
              type="delayed"
              emptyMessage="No delayed retests"
            />
          )}
          
          {onHoldRetests.length > 0 && (
            <RetestCardGrid
              title="On Hold Retests"
              retests={onHoldRetests}
              type="onHold"
              emptyMessage="No on-hold retests"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;