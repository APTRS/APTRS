import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WithAuth } from "../../lib/authutils";
import PageTitle from '../../components/page-title';
import Button from '../../components/button';
import { ThemeContext } from '../../layouts/layout';
import { useContext } from 'react';
import { formatDate } from '../../lib/utilities';
import { completedProjects } from '../../lib/data/api';
import { 
  CalendarIcon, 
  ClockIcon, 
  ChartBarSquareIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

// Define the project interface
interface CompletedProject {
  id: number;
  name: string;
  startdate: string;
  enddate: string;
  testingtype: string;
  projecttype: string;
  status: string;
}

// Interface for pagination data
interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CompletedProject[];
}

// Interface for filter state
interface FilterState {
  name: string;
  projecttype: string;
  testingtype: string;
  startdate: string;
  enddate_before: string;
}

function PastProject() {
  const navigate = useNavigate();
  const theme = useContext(ThemeContext);
  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortField, setSortField] = useState<string>('enddate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 20; // Number of items per page
  
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    name: '',
    projecttype: '',
    testingtype: '',
    startdate: '',
    enddate_before: ''
  });

  // Create a ref to observe the last element for infinite scrolling
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProjectElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreProjects();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  const navigateToProject = (projectId: number) => {
    navigate(`/customer/project/${projectId}`);
  };
  
  // Function to handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Function to clear all filters
  const clearFilters = () => {
    setFilters({
      name: '',
      projecttype: '',
      testingtype: '',
      startdate: '',
      enddate_before: ''
    });
    setOffset(0);
    setProjects([]);
    fetchCompletedProjects(0);
  };
  
  // Function to apply filters
  const applyFilters = () => {
    setOffset(0);
    setProjects([]);
    fetchCompletedProjects(0);
  };

  // Function to load more projects for infinite scrolling
  const loadMoreProjects = () => {
    if (!loadingMore && hasMore) {
      const nextOffset = offset + limit;
      setOffset(nextOffset);
      fetchCompletedProjects(nextOffset, true);
    }
  };
  
  // Function to change sorting
  const handleSortChange = (field: string) => {
    if (field === sortField) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortOrder('desc');
    }
    
    // Reset projects and fetch with new sort
    setOffset(0);
    setProjects([]);
    fetchCompletedProjects(0);
  };

  // Fetch completed projects with pagination and filters
  const fetchCompletedProjects = async (pageOffset: number = 0, append: boolean = false) => {
    if (pageOffset === 0) {
      setInitialLoading(true);
    } else if (append) {
      setLoadingMore(true);
    }
    
    try {
      // Build filter params
      const params: any = {
        limit,
        offset: pageOffset,
        sort: sortField,
        order_by: sortOrder
      };
      
      // Add filters if they have values
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params[key] = value;
        }
      });
      
      // Add search term to name filter if it exists
      if (searchTerm) {
        params.name = searchTerm;
      }
      
      const response = await completedProjects(params);
      
      // Handle the paginated response
      if (response && response.results) {
        if (append) {
          setProjects(prev => [...prev, ...response.results]);
        } else {
          setProjects(response.results);
        }
        setTotalCount(response.count);
        setHasMore(response.next !== null);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load completed projects. Please try again later.');
      console.error('Error fetching completed projects:', err);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCompletedProjects();
  }, []);

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.testingtype.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projecttype.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Card style based on theme
  const cardStyle = theme === 'dark'
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';  return (
    <div className="container mx-full px-4 py-6">
      <PageTitle title="Past Projects" />
      <div className="mb-6 mt-8 flex flex-col md:flex-row md:items-center md:justify-start gap-4">
        <div className="text-sm">
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center ${showFilters ? 'bg-blue-700 dark:bg-blue-800' : ''}`}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          {/* Sorting dropdown */}
          <div className="relative inline-block">
            <Button
              onClick={() => {
                const dropdownMenu = document.getElementById('sortDropdown');
                if (dropdownMenu) {
                  dropdownMenu.classList.toggle('hidden');
                }
              }}
              className="flex items-center"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
              Sort
            </Button>
            <div id="sortDropdown" className={`absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5 hidden`}>
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => handleSortChange('name')}
                  className={`block px-4 py-2 text-sm w-full text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Project Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSortChange('startdate')}
                  className={`block px-4 py-2 text-sm w-full text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Start Date {sortField === 'startdate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSortChange('enddate')}
                  className={`block px-4 py-2 text-sm w-full text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  End Date {sortField === 'enddate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className={`mb-6 p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Advanced Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={`block mb-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Project Name
              </label>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                className={`block w-full p-2 text-sm rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              />
            </div>
            
            <div>
              <label className={`block mb-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Project Type
              </label>
              <input
                type="text"
                name="projecttype"
                value={filters.projecttype}
                onChange={handleFilterChange}
                className={`block w-full p-2 text-sm rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              />
            </div>
            
            <div>
              <label className={`block mb-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Testing Type
              </label>
              <input
                type="text"
                name="testingtype"
                value={filters.testingtype}
                onChange={handleFilterChange}
                className={`block w-full p-2 text-sm rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              />
            </div>
            
            <div>
              <label className={`block mb-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Start Date (After)
              </label>              <input
                type="date"
                name="startdate"
                value={filters.startdate}
                onChange={handleFilterChange}
                className={`block w-full p-2 text-sm rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              />
            </div>
            
            <div>
              <label className={`block mb-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                End Date (Before)
              </label>              <input
                type="date"
                name="enddate_before"
                value={filters.enddate_before}
                onChange={handleFilterChange}
                className={`block w-full p-2 text-sm rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4 gap-2">
            <Button
              onClick={clearFilters}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Clear
            </Button>
            <Button
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
      
      {/* Results count */}
      {!initialLoading && !error && (
        <p className={`mb-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {projects.length} of {totalCount} results
        </p>
      )}

      {initialLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className={`p-4 mb-4 text-sm rounded-lg ${theme === 'dark' ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'}`}>
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map((project, index) => (              <div 
                key={project.id}
                ref={index === projects.length - 1 ? lastProjectElementRef : null} 
                className={`border rounded-lg shadow-md overflow-hidden ${cardStyle} transition-transform hover:scale-[1.02] cursor-pointer`}
                onClick={() => navigateToProject(project.id)}
              >
                <div className="p-5">
                  <h5 className={`mb-2 text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {project.name}
                  </h5>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2 text-gray-500" />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatDate(project.startdate)} - {formatDate(project.enddate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <ChartBarSquareIcon className="w-5 h-5 mr-2 text-gray-500" />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Project Type: {project.projecttype}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <ClockIcon className="w-5 h-5 mr-2 text-gray-500" />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Testing Type: {project.testingtype}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-500" />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Status: <span className="font-medium text-green-500">Completed</span>
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full flex justify-end items-center text-blue-600 group">
                      <span className="text-sm font-medium group-hover:underline">View details</span>
                      <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`col-span-full p-6 text-center rounded-lg border ${theme === 'dark' ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              <p className="text-lg font-medium">No completed projects found</p>
              <p className="mt-2">No projects match your current filters.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center mt-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}

export default WithAuth(PastProject);