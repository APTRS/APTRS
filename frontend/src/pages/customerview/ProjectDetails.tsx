import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { WithAuth } from "../../lib/authutils";
import PageTitle from '../../components/page-title';
import Button from '../../components/button';
import { ThemeContext } from '../../layouts/layout';
import { useContext } from 'react';
import { CustomerProjectType, getSeverityClass, severityColors, statusColors } from '../../lib/data/definitions-customer';
import { getProject, getCustomerProjectVulnerability, fetchProjectRetests, getProjectScopes, getProjectReport } from '../../lib/data/api';
import { getVulnerabilityStatusColor, getProjectStatusColor, formatDate, createMarkup } from '../../lib/utilities';

// Define scope item interface based on API response
interface ScopeItem {
  id: number;
  scope: string;
  description: string;
}

// Extended project type to include scope items
interface ExtendedCustomerProjectType extends CustomerProjectType {
  scopeItems?: Array<ScopeItem>;
}

interface ProjectRetest {
  id: number;
  project: number;
  startdate: string;
  enddate: string;
  is_active: boolean;
  is_completed: boolean;
  owner: string[];
  created_at: string;
}
import { useDebounce } from '@uidotdev/usehooks';
import VulnerabilitiesTab from './VulnerabilitiesTab';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ChartBarSquareIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  BackspaceIcon,
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronDoubleRightIcon,
  ClipboardDocumentListIcon,
  ArrowUturnLeftIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
  LockClosedIcon,
  ArrowDownTrayIcon as DocumentDownloadIcon
} from '@heroicons/react/24/outline';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/solid';

// Default values for project and scopeItems - will be replaced with API data
const DEFAULT_SCOPE_ITEMS = [
  { id: 0, name: "Loading...", type: "N/A", details: "Loading scope information..." }
];

const DEFAULT_RETESTS = [
  { id: 0, name: "Loading retest information...", date: "", status: "Loading" }
];

// Using imported severity and status colors from definitions-customer

// Using imported formatDate and createMarkup from utilities



// Add CSS for CKEditor content styling
const ckeditorContentStyles = `
  .description-content, .exceptions-content {
    max-width: 100%;
    overflow-x: auto;
  }
  
  .description-content p, .exceptions-content p {
    margin-bottom: 0.5rem;
  }
  
  .description-content ul, .exceptions-content ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  
  .description-content ol, .exceptions-content ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  
  .description-content h1, .exceptions-content h1 {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 1rem 0 0.5rem;
  }
  
  .description-content h2, .exceptions-content h2 {
    font-size: 1.25rem;
    font-weight: bold;
    margin: 1rem 0 0.5rem;
  }
  
  .description-content h3, .exceptions-content h3 {
    font-size: 1.1rem;
    font-weight: bold;
    margin: 0.75rem 0 0.5rem;
  }
  
  .description-content img, .exceptions-content img {
    max-width: 100%;
    height: auto;
  }
  
  .description-content table, .exceptions-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.5rem 0;
  }
  
  .description-content table td, .description-content table th,
  .exceptions-content table td, .exceptions-content table th {
    border: 1px solid #ddd;
    padding: 8px;
  }
`;

export function CustomerProjectDetails(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useContext(ThemeContext);
  
  // Add the CKEditor styles to the page
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = ckeditorContentStyles;
    // Add the style to the document head
    document.head.appendChild(style);
    
    // Clean up when the component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);  const [loading, setLoading] = useState(false);  
  const [project, setProject] = useState<ExtendedCustomerProjectType | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<any[]>([]);
  const [projectRetests, setProjectRetests] = useState<ProjectRetest[]>([]);
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>([]);
  const [scopeCurrentPage, setScopeCurrentPage] = useState<number>(1);
  const [scopeRowsPerPage, setScopeRowsPerPage] = useState<number>(5);
  const [scopeTotalRows, setScopeTotalRows] = useState<number>(0);
  const [severityCounts, setSeverityCounts] = useState<Record<string, number>>({
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Informational: 0
  });
  const [expandedVuln, setExpandedVuln] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalRows, setTotalRows] = useState<number>(0);
    
  // Load project data from API endpoint
  useEffect(() => {
    if (!id) {
      console.error('No id provided, cannot make API calls');
      return;
    }
    
    setLoading(true);
    console.log('Loading project data for ID:', id);
    
    // Fetch both project details and vulnerabilities
    const fetchData = async () => {
      try {
        console.log('Starting API calls for projectId:', id);
        
        // Enhanced logging to track individual API calls        console.log('Making getProject API call for ID:', id);
        let projectData;
        try {
          console.log('Calling getProject API with projectId:', id);
          projectData = await getProject(id);
          console.log('getProject API call succeeded with response:', projectData);
        } catch (projectError: any) {
          console.error('getProject API call failed with error:', projectError);
          console.error('Error status:', projectError.response?.status);
          console.error('Error message:', projectError.response?.data);
          console.error('Error stack:', projectError.stack);
          toast.error(`Failed to load project data: ${projectError.message || 'Unknown error'}`);
          throw projectError;
        }
          console.log('Making getCustomerProjectVulnerability API call for ID:', id);
        let vulnData;
        try {
          console.log('Calling getCustomerProjectVulnerability API with projectId:', id);
          vulnData = await getCustomerProjectVulnerability(id);
          console.log('getCustomerProjectVulnerability API call succeeded with response:', vulnData);
          
          // Check for proper data structure
          if (!vulnData || !vulnData.vulnerabilities) {
            console.warn('API response is missing vulnerabilities array:', vulnData);
          }
        } catch (vulnError: any) {
          console.error('getCustomerProjectVulnerability API call failed with error:', vulnError);
          console.error('Error status:', vulnError.response?.status);
          console.error('Error message:', vulnError.response?.data);
          console.error('Error stack:', vulnError.stack);
          toast.error(`Failed to load vulnerabilities: ${vulnError.message || 'Unknown error'}`);
            // If we get a 403 error, it's likely a company ID mismatch - log helpful information
          if (vulnError.response?.status === 403) {
            console.error('Authorization error - This may be due to a company ID mismatch between user and project');
            toast.error("Access denied: You may not have permission to view this project's vulnerabilities");
          }
          
          // Don't throw here, instead continue with whatever data we have (projectData should still be valid)
          // This allows the page to still load with basic project info even if vulnerabilities fail
        }
        
        console.log('Both API calls completed successfully');
        
        if (!projectData) {
          toast.error("Failed to load project data");
          return;
        }
        
        // Process the data
        processProjectData(projectData, vulnData);
      } catch (error) {
        console.error("Error fetching project details or vulnerabilities:", error);
        toast.error("Failed to fetch project data.");
        setVulnerabilities([]);
        setFilteredVulnerabilities([]);
        setTotalRows(0);
      } finally {
        setLoading(false);
      }
    };
      // Start the data fetching process
    fetchData();
    
    return () => {}; // No need for cleanup as we're not using a timer anymore
  }, [id]);
  
  // Process the project and vulnerability data
  const processProjectData = (projectData: any, vulnData: any) => {
    if (!projectData) {
      toast.error("Failed to load project data");
      return;
    }
    
    // Create project object with real data and add defaults for missing fields
    const projectWithData: ExtendedCustomerProjectType = {
      ...projectData,      // Use default placeholders for data that might not be available in the API
      scopeItems: projectData.scopeItems || DEFAULT_SCOPE_ITEMS,
      retests: projectData.retests || DEFAULT_RETESTS,
      hasRetests: projectData.hasRetests || false    };
    
    setProject(projectWithData);
    
    if (vulnData && vulnData.vulnerabilities) {
      // Use real vulnerability data from API
      const formattedVulnerabilities = vulnData.vulnerabilities.map((vuln: any) => ({
        id: vuln.id,
        name: vuln.vulnerabilityname,
        severity: vuln.vulnerabilityseverity === 'None' ? 'Informational' : (vuln.vulnerabilityseverity || "Low"),
        cvssscore: vuln.cvssscore || "N/A",
        status: vuln.status || "Open",
        discoveryDate: vuln.published_date,
        // Add placeholder data for fields not in the API
        affectedComponents: [vuln.affected_component || "System"],
        description: vuln.description || "Detailed description not available. Please contact your security team for more information.",
        impact: vuln.impact || "Impact information not available",
        remediation: vuln.remediation || "Remediation information not available",
        retestStatus: vuln.retest_status || "Not Started",
        retestDate: vuln.retest_date || null,
        cve: vuln.cve || null
      }));
      
      // Save vulnerability data
      setVulnerabilities(formattedVulnerabilities);
      setFilteredVulnerabilities(formattedVulnerabilities);
      setTotalRows(formattedVulnerabilities.length);
      
      // Save severity counts from API if available, otherwise calculate them
      if (vulnData.severity_counts) {
        setSeverityCounts(vulnData.severity_counts);
      } else {        // Calculate severity counts from the vulnerability data
        const counts = formattedVulnerabilities.reduce((acc: Record<string, number>, vuln: any) => {
          const severity = vuln.severity === 'None' ? 'Informational' : (vuln.severity || 'Informational');
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {
          Critical: 0,
          High: 0,
          Medium: 0,
          Low: 0,
          Informational: 0
        });
        
        setSeverityCounts(counts);
      }
    } else {
      console.warn("No vulnerability data available:", vulnData);
      
      // Initialize empty vulnerability data - this allows the UI to still display properly      setVulnerabilities([]);
      setFilteredVulnerabilities([]);      setTotalRows(0);
      setSeverityCounts({
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Informational: 0
      });
    }
  };
  
  // Handle search filtering
  const debouncedSearchQuery = useDebounce<string>(searchQuery, 300);
  useEffect(() => {
    if (debouncedSearchQuery) {
      const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
      const filtered = vulnerabilities.filter((vuln) =>
        vuln.name.toLowerCase().includes(lowerCaseQuery) ||
        vuln.affectedComponents.some((component: string) => component.toLowerCase().includes(lowerCaseQuery)) ||
        (vuln.cve && vuln.cve.toLowerCase().includes(lowerCaseQuery)) ||
        vuln.severity.toLowerCase().includes(lowerCaseQuery) ||
        vuln.status.toLowerCase().includes(lowerCaseQuery) ||
        vuln.description.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredVulnerabilities(filtered);
      setTotalRows(filtered.length);
      setCurrentPage(1); // Reset to first page on new search
    } else {
      setFilteredVulnerabilities(vulnerabilities);
      setTotalRows(vulnerabilities.length);
    }  }, [debouncedSearchQuery, vulnerabilities]);
  // Fetch project retests
  useEffect(() => {
    const fetchRetests = async () => {
      if (id) {
        try {
          const retestData = await fetchProjectRetests(parseInt(id));
          if (retestData && Array.isArray(retestData)) {
            setProjectRetests(retestData);
          }
        } catch (error) {
          console.error("Error fetching project retests:", error);
        }
      }
    };

    fetchRetests();
  }, [id]);
  // Fetch project scopes  
  useEffect(() => {
    const fetchScopes = async () => {
      if (id) {
        try {
          const scopeData = await getProjectScopes(id);
          if (scopeData && Array.isArray(scopeData)) {
            setScopeItems(scopeData);
            setScopeTotalRows(scopeData.length);
            console.log("Fetched scope items:", scopeData);
          }
        } catch (error) {
          console.error("Error fetching project scopes:", error);
        }
      }
    };    fetchScopes();
  }, [id]);
  
  // Function to change rows per page for scope pagination
  const handleScopeRowsPerPageChange = (newRowsPerPage: number) => {
    setScopeRowsPerPage(newRowsPerPage);
    setScopeCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Function to determine retest status based on is_active and is_completed
  const getRetestStatus = (retest: ProjectRetest) => {
    if (!retest.is_active && retest.is_completed) {
      return "Completed";
    } else if (!retest.is_active && !retest.is_completed) {
      return "On Hold";
    } else if (retest.is_active && !retest.is_completed) {
      // Return project status for active retest
      return project?.status || "Active";
    }
    return "Unknown"; // Fallback
  };  const handleDownloadReport = async (format: 'pdf' | 'excel', type: 'project' | 'retest', retestId?: number) => {
    if (!id || !project) {
      toast.error("Project information is not available");
      return;
    }
    
    const reportType = type === 'project' ? 'Audit' : 'Re-Audit';
    const reportName = type === 'project' 
      ? `${project?.name} Security Assessment Report` 
      : `Consolidated Retest Report`;
      
    try {
      // Show loading toast
      const toastId = 'report-download';
      toast.loading(`Preparing ${reportName} in ${format.toUpperCase()} format...`, {
        id: toastId,
      });
      
      // Call the API to get the report file
      const response = await getProjectReport({
        projectId: parseInt(id),
        Format: format,
        Type: reportType
      });
      
      if (!response) {
        toast.error('Failed to generate report', { id: toastId });
        return;
      }
      
      // Get content type from response headers or use default
      const contentType = response.headers?.['content-type'] || 
        (format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: contentType });
      
      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or generate default name
      let filename = '';
      const contentDisposition = response.headers?.['content-disposition'];
      if (contentDisposition && contentDisposition.includes('filename=')) {
        // Extract filename from Content-Disposition header
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Use default filename if not found in headers
      if (!filename) {
        const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';
        filename = `${project.name}-${reportType}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      }
      
      link.setAttribute('download', filename);
      
      // Append to document, click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Update the toast to success
      toast.success(`${reportName} downloaded successfully!`, { id: toastId });
      
    } catch (error: any) {
      console.error('Error downloading report:', error);
      const errorMessage = error.response?.data?.message || 'Failed to download report. Please try again later.';
      toast.error(errorMessage, { id: 'report-download' });
    }
  };
  // Calculate stats for the overview tab
  const getVulnerabilityStats = () => {
    // Use the severity counts from the API if available, otherwise calculate from the vulnerabilities array
    const total = vulnerabilities.length;
    
    // Use API-provided severity counts when available
    const critical = severityCounts.Critical || vulnerabilities.filter(v => v.severity === 'Critical').length;
    const high = severityCounts.High || vulnerabilities.filter(v => v.severity === 'High').length;
    const medium = severityCounts.Medium || vulnerabilities.filter(v => v.severity === 'Medium').length;
    const low = severityCounts.Low || vulnerabilities.filter(v => v.severity === 'Low').length;
    
    // These still need to be calculated as they're not directly provided by the API
    const fixed = vulnerabilities.filter(v => v.status === 'Fixed' || v.status === 'Verified Fixed').length;
    const open = vulnerabilities.filter(v => v.status === 'Open').length;
    
    return { total, critical, high, medium, low, fixed, open };
  };
  
  const renderSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 w-3/4 rounded mb-6"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      
      <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/2 rounded mb-4"></div>
      <div className="space-y-3 mb-8">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
  
  const renderTabs = () => (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap -mb-px">
        <button
          className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
            activeTab === 'overview' 
              ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' 
              : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <ChartBarSquareIcon className="w-5 h-5 mr-2" />
          Overview
        </button>
        <button
          className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
            activeTab === 'vulnerabilities' 
              ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' 
              : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('vulnerabilities')}
        >
          <ShieldExclamationIcon className="w-5 h-5 mr-2" />
          Vulnerabilities
        </button>
        <button
          className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
            activeTab === 'scope' 
              ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' 
              : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('scope')}
        >
          <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
          Scope
        </button>
        <button
          className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
            activeTab === 'retests' 
              ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' 
              : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('retests')}
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          Retests
        </button>
        <button
          className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
            activeTab === 'reports' 
              ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' 
              : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('reports')}
        >
          <DocumentChartBarIcon className="w-5 h-5 mr-2" />
          Reports
        </button>
      </div>
    </div>
  );
  
  const renderProjectHeader = () => {
    if (!project) return null;
    
    return (
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">              <span className={`${getProjectStatusColor(project.status)} px-3 py-1 text-sm font-semibold rounded-full border-2`}>
                {project.status}
              </span>
              
              {project.testingtype && project.testingtype.trim() !== '' && (
                <span className="bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300 px-3 py-1 text-sm font-semibold rounded-full border-2">
                  {project.testingtype}
                </span>
              )}
              
              <span className="bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 px-3 py-1 text-sm font-semibold rounded-full border-2 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {formatDate(project.startdate)} - {formatDate(project.enddate)}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/customer/projects')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white flex items-center px-3 py-2 rounded-lg"
            >
              <ArrowUturnLeftIcon className="w-5 h-5 mr-1" />
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderOverviewTab = () => {
    if (!project) return null;
    
    const stats = getVulnerabilityStats();
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Project Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Project Summary
            </h3>            <div className="space-y-3">              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <div 
                  className="font-medium description-content prose dark:prose-invert prose-sm max-w-none" 
                  dangerouslySetInnerHTML={createMarkup(project.description)}
                />
              </div>
              
              {project.projectexception && project.projectexception.trim() !== '' && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Project Exceptions</p>
                  <div 
                    className="font-medium exceptions-content prose dark:prose-invert prose-sm max-w-none" 
                    dangerouslySetInnerHTML={createMarkup(project.projectexception)}
                  />
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Project Type</p>
                <p className="font-medium">{project.projecttype}</p>
              </div>              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Standards</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(project.standard) && project.standard.length > 0 
                    ? project.standard.map((std, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 text-xs rounded">
                          {std}
                        </span>
                      ))
                    : <span className="text-gray-500 dark:text-gray-400 text-sm">No standards specified</span>
                  }
                </div>
              </div>
            </div>
          </div>
          
          {/* Security Assessment Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <ShieldExclamationIcon className="w-5 h-5 mr-2" />
              Security Assessment
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</p>
                <p className="text-sm text-red-800 dark:text-red-300">Critical</p>
              </div>
              
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.high}</p>
                <p className="text-sm text-orange-800 dark:text-orange-300">High</p>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.medium}</p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">Medium</p>
              </div>
              
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.low}</p>
                <p className="text-sm text-blue-800 dark:text-blue-300">Low</p>
              </div>            </div>
          </div>
          
          {/* Team & Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Project Team
            </h3>
            <div className="space-y-3 mb-4">
              {/* Display engineers if available */}
              {Array.isArray(project.engineers) && project.engineers.length > 0 
                ? project.engineers.map((engineer) => (
                    <div key={`eng-${engineer.id}`} className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-indigo-800 dark:text-indigo-300 text-sm font-medium">
                          {engineer.name?.split(' ').map(n => n[0]).join('') || '??'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{engineer.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{engineer.role}</p>
                      </div>
                    </div>
                  ))
                : null
              }
              
              {/* Display owner array if available and engineers array is empty */}
              {Array.isArray(project.owner) && project.owner.length > 0 && 
               (!Array.isArray(project.engineers) || project.engineers.length === 0) ? (
                project.owner.map((owner, idx) => (
                  <div key={`own-${idx}`} className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <span className="text-indigo-800 dark:text-indigo-300 text-sm font-medium">
                        {owner?.split(' ').map(n => n[0]).join('') || '??'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{owner}</p>
                     
                    </div>
                  </div>
                ))
              ) : null}
              
              {/* Show message if no team members found */}
              {(!Array.isArray(project.engineers) || project.engineers.length === 0) && 
               (!Array.isArray(project.owner) || project.owner.length === 0) && (
                <div className="text-gray-500 dark:text-gray-400 text-sm">No team members assigned</div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2 flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Timeline
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Start Date</span>
                  <span className="font-medium">{formatDate(project.startdate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">End Date</span>
                  <span className="font-medium">{formatDate(project.enddate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <ShieldExclamationIcon className="w-5 h-5 mr-2" />
            Recent Findings
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Finding</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Severity</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Discovery Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {vulnerabilities.slice(0, 3).map((vuln) => (
                    <tr key={vuln.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setActiveTab('vulnerabilities')}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">{vuln.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{vuln.affectedComponents.join(', ')}</div>
                      </td>                      <td className="px-4 py-4 whitespace-nowrap">                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-2 ${getSeverityClass(vuln.severity === 'None' ? 'Informational' : vuln.severity)}`}>
                          {vuln.severity === 'None' ? 'Informational' : vuln.severity}
                        </span>
                      </td><td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-2 ${getVulnerabilityStatusColor(vuln.status)}`}>
                          {vuln.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(vuln.discoveryDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vulnerabilities.length > 3 && (
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 text-center">
                  <button 
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center justify-center mx-auto"
                    onClick={() => setActiveTab('vulnerabilities')}
                  >
                    View all {vulnerabilities.length} vulnerabilities
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );  };
    const renderVulnerabilitiesTab = () => {
    // Use the new VulnerabilitiesTab component instead of implementing the functionality directly
    return <VulnerabilitiesTab project={project} vulnerabilities={vulnerabilities} />;  };
  
  const renderScopeTab = () => {
    if (scopeItems.length === 0) return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No scope information available for this project.</p>
      </div>
    );
    
    // Calculate pagination
    const indexOfLastItem = scopeCurrentPage * scopeRowsPerPage;
    const indexOfFirstItem = indexOfLastItem - scopeRowsPerPage;
    const currentScopeItems = scopeItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(scopeTotalRows / scopeRowsPerPage);
    
    // Handle page changes
    const handlePreviousPage = () => {
      if (scopeCurrentPage > 1) {
        setScopeCurrentPage(scopeCurrentPage - 1);
      }
    };
    
    const handleNextPage = () => {
      if (scopeCurrentPage < totalPages) {
        setScopeCurrentPage(scopeCurrentPage + 1);
      }
    };
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
        <div className="p-4 bg-gray-50 dark:bg-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
            <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
            Project Scope
          </h3>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target URL/IP</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentScopeItems.length > 0 
                  ? currentScopeItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.scope}</td>
                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{item.description}</td>
                      </tr>
                    ))
                  : <tr>
                      <td colSpan={2} className="px-4 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                        No scope items available
                      </td>
                    </tr>
                }
              </tbody>
            </table>
              {/* Pagination controls */}
            {scopeItems.length > 0 && (
              <div className="flex flex-wrap items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, scopeTotalRows)}
                    </span>{" "}
                    of <span className="font-medium">{scopeTotalRows}</span> items
                  </p>
                  
                  <div className="flex items-center">
                    <label htmlFor="rows-per-page" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                      Rows:
                    </label>                    <select
                      id="rows-per-page"
                      value={scopeRowsPerPage}
                      onChange={(e) => handleScopeRowsPerPageChange(Number(e.target.value))}
                      className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-blue-500 focus:border-blue-500 p-1"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    <button
                      onClick={handlePreviousPage}
                      disabled={scopeCurrentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md 
                        ${scopeCurrentPage === 1 
                          ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <ChevronLeftIcon className="h-5 w-5 mr-1" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {scopeCurrentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={scopeCurrentPage === totalPages}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md 
                        ${scopeCurrentPage === totalPages 
                          ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      Next
                      <ChevronRightIcon className="h-5 w-5 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">Note:</span> The assessment was conducted only on the items specified in the scope above.
          </p>
        </div>
      </div>
    );
  };
    const renderRetestsTab = () => {
    if (!project) return null;
    
    if (projectRetests.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No retests have been scheduled for this project yet.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
        <div className="p-4 bg-gray-50 dark:bg-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Scheduled Retests
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {projectRetests.map((retest) => {
            // Determine the status for this retest
            const status = getRetestStatus(retest);
            
            return (
              <div key={retest.id} className="p-6">                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-lg">
                      Retest
                    </h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatDate(retest.startdate)} - {formatDate(retest.enddate)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <UserGroupIcon className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Retest Team: {Array.isArray(retest.owner) ? retest.owner.join(', ') : 'Retest Team'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <ClockIcon className="w-4 h-4 text-gray-500 mr-2" />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-2 ${getProjectStatusColor(status)}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
  
                </div>
                
                {status === 'Completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="font-medium text-sm text-gray-900 dark:text-white mb-2">Fixed Issues</h5>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        No detailed information available about fixed issues
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };  const renderReportsTab = () => {
    if (!project) return null;
    const isProjectCompleted = project.status === 'Completed';
    
    // Use projectRetests instead of project.retests since it contains the correct data structure
    const hasRetests = projectRetests.length > 0;
    
    // Use the same logic as getRetestStatus to determine completed/incomplete retests
    const hasCompletedRetests = hasRetests && projectRetests.some(r => !r.is_active && r.is_completed);
    const hasIncompleteRetests = hasRetests && projectRetests.some(r => !((!r.is_active && r.is_completed)));
    const hasVulnerabilities = vulnerabilities.length > 0;
    
    // Show retest reports only when there are retests AND all retests are completed
    // This means we have some completed retests and NO incomplete retests
    const showRetestReports = hasRetests && hasCompletedRetests && !hasIncompleteRetests;
    
    console.log("hasRetests", hasRetests);
    console.log("hasCompletedRetests", hasCompletedRetests);
    console.log("hasIncompleteRetests", hasIncompleteRetests);
    console.log("projectRetests", projectRetests);
    console.log("showRetestReports", showRetestReports);
    
    return (
      <div className="space-y-6">        {/* Project Reports - Show if project has at least one vulnerability */}
        {hasVulnerabilities && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Project Reports
              </h3>
            </div>
            
            <div className="p-6">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                {isProjectCompleted 
                  ? "Download comprehensive security assessment reports in your preferred format."
                  : "Download draft security assessment reports in your preferred format."}
              </p>
              
              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => handleDownloadReport('pdf', 'project')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="mr-4 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {isProjectCompleted ? "Security Assessment Report (PDF)" : "Draft Security Assessment Report (PDF)"}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Complete findings with detailed recommendations</p>
                  </div>
                  <DocumentDownloadIcon className="w-5 h-5 text-gray-500" />
                </button>
                
                <button 
                  onClick={() => handleDownloadReport('excel', 'project')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="mr-4 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <TableCellsIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">Vulnerability Tracker (Excel)</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Spreadsheet for tracking remediation status</p>
                  </div>
                  <DocumentDownloadIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Retest Reports - Show based on conditions */}
        {showRetestReports && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Retest Reports
              </h3>
            </div>
              <div className="p-6">
              {hasCompletedRetests ? (
                <div>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    Download retest reports for completed security reassessments.
                  </p>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <button 
                      onClick={() => handleDownloadReport('pdf', 'retest')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="mr-4 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                        <DocumentTextIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">Retest Report (PDF)</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Complete retest findings and results</p>
                      </div>
                      <DocumentDownloadIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    
                    <button 
                      onClick={() => handleDownloadReport('excel', 'retest')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="mr-4 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                        <TableCellsIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">Retest Results (Excel)</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Detailed retest results in spreadsheet format</p>
                      </div>
                      <DocumentDownloadIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              ) : hasIncompleteRetests ? (
                // Show disabled retest report section for incomplete retests
                <div className="text-center p-6">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Retest reports will be available when the retest is completed.
                    </p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 mt-4 opacity-50 pointer-events-none">
                    <button 
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      <div className="mr-4 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                        <DocumentTextIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">Retest Report (PDF)</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pending completion</p>
                      </div>
                      <DocumentDownloadIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    
                    <button 
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      <div className="mr-4 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                        <TableCellsIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">Retest Results (Excel)</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pending completion</p>
                      </div>
                      <DocumentDownloadIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render different content based on active tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'vulnerabilities':
        return renderVulnerabilitiesTab();
      case 'scope':
        return renderScopeTab();
      case 'retests':
        return renderRetestsTab();
      case 'reports':
        return renderReportsTab();
      default:
        return renderOverviewTab();
    }
  };
    return (
    <div className="px-4 py-2 mx-auto">
      <style dangerouslySetInnerHTML={{ __html: ckeditorContentStyles }} />
      <PageTitle title="Project Details" />
      
      {loading ? renderSkeleton() : (
        <>
          {renderProjectHeader()}
          {renderTabs()}
          {renderTabContent()}
        </>
      )}
    </div>
  );
}

export default WithAuth(CustomerProjectDetails);