import { useEffect, useState, useContext } from 'react';
import { ThemeContext } from '../../layouts/layout';
import { useNavigate, useLocation } from "react-router-dom";
import { fetchFilteredProjects, deleteProjects } from "../../lib/data/api";
import { toast } from 'react-hot-toast';
import PageTitle from '../../components/page-title';
import { Link } from 'react-router-dom';
import { WithAuth} from "../../lib/authutils";
import { currentUserCan, getProjectStatusColor } from "../../lib/utilities";
import { useDataReducer } from '../../lib/useDataReducer';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Project, Column, FilteredSet} from '../../lib/data/definitions'
import {  DatasetState, DatasetAction, DEFAULT_DATA_LIMIT } from '../../lib/useDataReducer'
import DataTable from 'react-data-table-component';
import Button from '../../components/button';
import { HeaderFilter, ClearFilter } from "../../components/headerFilter";
import { RowsSkeleton } from '../../components/skeletons'
import ErrorPage from '../../pages/error-page'
import useCustomStyles from '../../components/tableStyle'
 
export interface ProjectsProps {
  pageTitle: string; 
  embedded?: boolean;
  mine?: boolean;
  refresh?: boolean | undefined
  onClear?: () => void //call back to clear search if embedded
}
 
interface ProjectWithActions extends Project {
  actions: JSX.Element;
}

export function Projects(props:ProjectsProps): JSX.Element {
  const initialState: DatasetState = {
    mode: 'idle',
    data: [],
    queryParams: {offset:0, limit:DEFAULT_DATA_LIMIT},
    totalRows: 0
  }
  
  // initial load - if there's a search term in the url, set it in state,
  // this makes search load immediately in useEffect
  const params = new URLSearchParams(window.location.search);
  const search = params.get('name') || '';
  const canEdit = currentUserCan('Manage Users')
  const theme = useContext(ThemeContext);
  const customStyles = useCustomStyles(theme);
  
  if(search){
    initialState.queryParams = {offset:0, limit:DEFAULT_DATA_LIMIT, name: search};
  }
  function formatDataActions(data:Project[] | undefined):ProjectWithActions[] {
    if(!data){
      return []
    }
    // Ensure each row object is new for React's change detection
    return data.map((row: Project) => ({
        ...row,
        actions: (<>
                      <Link to={`/projects/${row.id}/edit`}><PencilSquareIcon className="inline w-5" /></Link>
                      <TrashIcon className="inline w-5 ml-1 cursor-pointer" onClick={()=> handleDelete([row.id])}/>
                    </>)
    }));
  }
  
  //partial reducer for search and pagination; the rest is handled by useDataReducer
  const reducer = (state: DatasetState, action: DatasetAction): DatasetState => {
    switch (action.type) {
      case 'set-search': {
        if (state.queryParams.name === action.payload) {
          return state;
        }
        // Correctly type and construct newQueryParams
        const newQueryParams: DatasetState['queryParams'] = {
          ...state.queryParams, // Spread existing params to preserve filters, sort, limit
          name: action.payload,   // Set/update the name for searching
          offset: 0,              // Reset pagination to the first page
        };
        return { ...state, queryParams: newQueryParams };
      }
      default: // Add default case for completeness
        return state;
    }
  };  // Direct approach - avoid type issues by manually handling the state
  const [dataState, setDataState] = useState<DatasetState>(initialState);
  
  // Create a dispatch function that will update our state
  const dispatch = (action: DatasetAction) => {
    setDataState(prevState => {
      switch (action.type) {
        case 'set-search': 
          return reducer(prevState, action);
        case 'set-filter': {
          const newQueryParams: DatasetState['queryParams'] = { 
            offset: 0, // Reset offset for new filters
            limit: prevState.queryParams.limit || DEFAULT_DATA_LIMIT
          };
          
          if (prevState.queryParams.sort) {
            newQueryParams.sort = prevState.queryParams.sort;
            newQueryParams.order_by = prevState.queryParams.order_by;
          }
          
          Object.keys(action.payload).forEach(key => {
            const payloadValue = action.payload[key as keyof typeof action.payload];
            if (payloadValue !== '' && payloadValue !== null && payloadValue !== undefined) {
              (newQueryParams as Record<string, any>)[key] = payloadValue;
            }
          });
          
          console.log('Dispatch set-filter - New QueryParams:', newQueryParams);
          return { ...prevState, queryParams: newQueryParams, mode: 'idle' }; // Ensure mode is idle to trigger loading if needed
        }
        case 'set-data':
          console.log('Dispatch set-data - Payload:', action.payload.data);
          return { ...prevState, data: action.payload.data.results || [], totalRows: action.payload.data.count || 0, mode: 'idle' };
        case 'set-mode':
          return { ...prevState, mode: action.payload };
        case 'reset':
          const baseResetParams: Partial<DatasetState['queryParams']> = { 
            offset: 0,
            limit: prevState.queryParams.limit || DEFAULT_DATA_LIMIT,
          };
          if (prevState.queryParams.sort) { 
            baseResetParams.sort = prevState.queryParams.sort; 
            baseResetParams.order_by = prevState.queryParams.order_by; 
          }

          let resetQueryParams: DatasetState['queryParams'] = { 
            offset: baseResetParams.offset!,
            limit: baseResetParams.limit!,
            sort: baseResetParams.sort,
            order_by: baseResetParams.order_by,
          };

          if (search && initialState.queryParams.name === search) {
            resetQueryParams.name = search;
          }
          console.log('Dispatch reset - New QueryParams:', resetQueryParams);
          return {...initialState, queryParams: resetQueryParams, data: [], totalRows: 0, mode: 'idle' };
        case 'set-rows-per-page':
          return { ...prevState, queryParams: { ...prevState.queryParams, limit: action.payload, offset: 0 }, mode: 'idle' };
        case 'set-page':
          const newOffset = (action.payload - 1) * (prevState.queryParams.limit || DEFAULT_DATA_LIMIT);
          return { ...prevState, queryParams: { ...prevState.queryParams, offset: newOffset }, mode: 'idle' };
        case 'set-sort':
          return { ...prevState, queryParams: { ...prevState.queryParams, sort: action.payload.sort, order_by: action.payload.order_by, offset: 0 }, mode: 'idle' };
        case 'set-error':
          return { ...prevState, error: action.payload, mode: 'error' };
        case 'clear-search': // Assuming you might want a specific action for this
            const clearedSearchParams: DatasetState['queryParams'] = { ...initialState.queryParams, name: '' }; // or remove name
            // delete clearedSearchParams.name; // if name should be fully removed
            return { ...prevState, queryParams: clearedSearchParams, mode: 'idle' };
        default:
          return prevState;
      }
    });
  };
  
  // Renamed to avoid conflicts with existing state references
  const state = dataState;
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();  const [filterValues, setFilterValues] = useState({
    name: '',
    companyname: '',
    owner: '',
    status: '',
    projecttype: '',
    testingtype: '',
    startdate: '', // Added for start date filter
    enddate_before: '' // Added for end date filter (assuming API expects end of day or similar)
  });
  const handleSort = (name: string, sortDirection: string) => {
    if(name && sortDirection){
      // Dispatch will update queryParams, then useEffect will call loadData
      dispatch({ type: 'set-sort', payload: {sort: name, order_by: sortDirection as 'asc' | 'desc'} });
    }
  }
  
  useEffect(() => {
    console.log('useEffect triggered by queryParams change. New queryParams:', state.queryParams);
    loadData();
  }, [state.queryParams]);
  
  const handlePerRowsChange = (newPerPage: number) => {
    dispatch({ type: 'set-rows-per-page', payload: newPerPage });
  };
  function handlePageChange(page: number){
    dispatch({ type: 'set-page', payload: page });
  }
  const loadData = async () => {
    try {
      // Add debugging to see what's in state.queryParams
      console.log('loadData - Current queryParams:', state.queryParams);
      
      dispatch({ type: 'set-mode', payload: 'loading' });
      let apiResponse:FilteredSet;
      console.log('Sending API request with params:', state.queryParams);
        apiResponse = await fetchFilteredProjects(state.queryParams)
      

      // Format data here before dispatching set-data
      const formattedResults = formatDataActions(apiResponse.results); 
      const dataToDispatch = {
        results: formattedResults,
        count: apiResponse.count,
      };
      dispatch({ type: 'set-data', payload: {data: dataToDispatch} }); // Dispatch formatted data

    } catch(error){
      console.error(error)
      toast.error(error as string)
      dispatch({ type: 'set-error', payload: error });
    } finally {
      dispatch({ type: 'set-mode', payload: 'idle' });
    }
  }
  const onRowClicked = (row:any) => navigate(`/projects/${row.id}`);  const handleFilter = (event:any) => {
    const {name, value} = event.target
    setFilterValues((prevFilterValues) => ({
      ...prevFilterValues,
      [name]: value,
    }));  };
  const clearFilter = () => {
    setFilterValues({
      name: '',
      companyname: '',
      owner: '',
      status: '',
      projecttype: '',
      testingtype: '',
      startdate: '', // Reset start date filter
      enddate_before: '' // Reset end date filter
    });
    dispatch({ type: 'reset'});
  };
  const filterCommit = (event?: any) => {
    console.log('Filter committed with values:', filterValues);
    
    const finalFilters: Record<string, any> = {};
    
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        return;
      }
      // Ensure date values are properly formatted if needed, though HeaderFilter should handle ISO string
      finalFilters[key] = value;
    });
    
    console.log('Dispatching filter update to state with:', finalFilters);
    dispatch({ type: 'set-filter', payload: finalFilters });
    
    // The useEffect hook listening to state.queryParams will handle calling loadData.
    console.log('Filter dispatch sent. useEffect will trigger loadData if queryParams changed.');
  }
  const columns: Column[] = [
    
    ...(canEdit ? [{
      name: 'Action',
      selector: (row: any) => row.actions,
      maxWidth: '1rem',
      omit: props.embedded,
    }] : []),
    {
      name: props.mine ? 'Name' 
            : 
            <HeaderFilter 
              label='Name' 
              name='name' 
              defaultValue={filterValues.name} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: Project) => row.name,
      maxWidth: '16rem',
    },
    {
      name: props.mine ? 'Company' 
            : 
            <HeaderFilter 
              label='Company' 
              name='companyname' 
              defaultValue={filterValues.companyname} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: Project) => row.companyname,
      maxWidth: '9rem',
    },
    {
      name: props.mine ? 'Owner' 
            : 
            <HeaderFilter 
              label='Owner' 
              name='owner' 
              defaultValue={filterValues.owner} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: Project) => row.owner?.length > 0 ? row.owner.map((owner: string) => owner.trim()).join(', ') : 'none',
      maxWidth: '7rem',
    },
    {
      name: props.mine ? 'Status' 
            : 
            <HeaderFilter 
              label='Status' 
              name='status' 
              defaultValue={filterValues.status} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: Project) => <span className={getProjectStatusColor(row.status)}>{row.status}</span>,
      maxWidth: '7rem',
    },
    {
      name: props.mine ? 'Project Type' 
            : 
            <HeaderFilter 
              label='Type' 
              name='projecttype' 
              defaultValue={filterValues.projecttype} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: Project) => row.projecttype,
    },    {
      name: props.mine ? 'Testing Type' 
            : 
            <HeaderFilter 
              label='Testing Type' 
              name='testingtype' 
              defaultValue={filterValues.testingtype} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: Project) => row.testingtype,
    },
    {
      name: props.mine ? 'Starts' 
            : 
            <HeaderFilter 
              label='Starts' 
              name='startdate' 
              defaultValue={filterValues.startdate} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              isDate={true} // Enable date picker
              />,
      selector: (row: Project) => row.startdate,
      maxWidth: '37rem',
    },
    {
      name: props.mine ? 'Ends' 
            : 
            <HeaderFilter 
              label='Ends' 
              name='enddate_before' // Using enddate_before for range query
              defaultValue={filterValues.enddate_before} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              isDate={true} // Enable date picker
              />,
      selector: (row: Project) => row.enddate,
      maxWidth: '7rem',
    },
  ];
  
  
  
  
  const handleNew = () => {
    navigate('/projects/new')
  }
  const handleDelete = async (ids: any[]) => {
    if(!currentUserCan('Manage Projects')){
      return
    }
    if (!confirm('Are you sure?')) {
      return false;
    }
    const count = ids.length;
    try {
      await deleteProjects(ids)
      dispatch({ type: 'reset'});
      let msg: string;
      if (count === 1) {
        msg = 'Project deleted';
      } else {
        msg = `${count} projects deleted`;
      }
      toast.success(msg);
      setSelected([])
    } catch(error) {
      dispatch({ type: 'set-error', payload: error });
    }
    
  };
  const deleteMultiple = () => {
    return handleDelete(selected)
  }
  const handleSelectedChange = (event: any) => {
    const ids = event.selectedRows.map((item:any) => item.id);
    setSelected(ids)
  }
  const handleSearch = (term = '') => {
    if (term) {
      dispatch({ type: 'set-search', payload: term });
      const params = new URLSearchParams(window.location.search);
      params.set('name', term);
      navigate(`?${params.toString()}`, { replace: true });
    } else {
      dispatch({ type: 'clear-search'})
      navigate(location.pathname, { replace: true });
    }
  }
  const clearSearch = () => {
    return handleSearch('')
  }
  if(state.error){
    console.error('Error state:', state.error);
    return <ErrorPage message={typeof state.error === 'string' ? state.error : 'An unexpected error occurred'}/>
  }

  // Log right before rendering DataTable
  console.log('Rendering DataTable with data (count):', state.data.length, 'data:', state.data);
  console.log('Rendering DataTable with totalRows:', state.totalRows);
  console.log('Current queryParams for this render:', state.queryParams);
  console.log('Current filterValues (local form state):', filterValues);

  return(
    <>      {props.pageTitle && <PageTitle title={props.pageTitle} /> }      <div className="flex flex-col" >
        <div className="flex justify-between items-center mb-4">
          <div>
            {state.queryParams.name &&
              <p>
                Results for &quot;{state.queryParams.name}&quot;
                <span className="text-xs ml-1">(<span className="underline text-blue-600" onClick={clearSearch}>clear</span>)</span>
              </p>
            }
            <ClearFilter queryParams={state.queryParams} clearFilter={clearFilter}/>
          </div>
          {currentUserCan('Manage Projects') && !props.embedded &&
            <div className="flex justify-end">
              <Button className='btn bg-primary m-2' onClick={handleNew}>
                New Project
              </Button>
              <Button 
                className="btn bg-secondary m-2 mr-0 disabled:opacity-50" 
                disabled={selected.length == 0}
                onClick={deleteMultiple}>
                  Delete
              </Button>
            </div>
          }
        </div>        {state.mode === 'loading' && <div className="mt-16"><RowsSkeleton numRows={state.queryParams.limit}/></div>} 
        <div className={state.mode != 'idle' ? 'hidden' : ''}>
            <div className="table-container relative">
              <DataTable
                columns={columns}
                data={formatDataActions(state.data)}
                selectableRows={!props.embedded}
                onRowClicked={onRowClicked}
                progressPending={state.mode != 'idle'}
                pagination
                paginationServer
                paginationPerPage={state.queryParams.limit}
                onChangeRowsPerPage={handlePerRowsChange}
                onChangePage={handlePageChange}
                paginationTotalRows={state.totalRows}
                striped 
                highlightOnHover
                pointerOnHover
                fixedHeader
                onSelectedRowsChange={handleSelectedChange}
                theme={useContext(ThemeContext)}
                customStyles={customStyles}
              />
            </div>
        </div>
      </div>
    </>
  )
}

export default WithAuth(Projects);

