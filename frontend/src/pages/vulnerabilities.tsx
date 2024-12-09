import { Column, FilteredSet, VulnWithActions} from '../lib/data/definitions';
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom'
import { fetchFilteredVulnerabilities, deleteVulnerabilities } from "../lib/data/api";
import { RowsSkeleton } from '../components/skeletons'
import PageTitle from '../components/page-title';
import { WithAuth } from "../lib/authutils";
import { currentUserCan } from "../lib/utilities";
import { DatasetState, DatasetAction, DEFAULT_DATA_LIMIT, useDataReducer } from '../lib/useDataReducer';
import Button from '../components/button';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import DataTable from 'react-data-table-component';
import { useVulnerabilityColor } from '../lib/customHooks';
import { toast } from 'react-hot-toast';
import { HeaderFilter, ClearFilter } from '../components/headerFilter';
import { ThemeContext } from '../layouts/layout';
import useCustomStyles from '../components/tableStyle'


 
const Vulnerabilities = () => {
  const initialState: DatasetState = {
    mode: 'idle',
    data: [],
    queryParams: {offset:0, limit:DEFAULT_DATA_LIMIT},
    totalRows: 0,
  };
  const theme = useContext(ThemeContext);
  const customStyles = useCustomStyles(theme);
  // initial load - if there's a search term in the url, set it in state,
  // this makes search load immediately in useEffect
  const params = new URLSearchParams(window.location.search);
  const search = params.get('vulnerabilityname') || '';
  if(search){
    initialState.queryParams = {offset:0, limit:DEFAULT_DATA_LIMIT, vulnerabilityname: search};
  }
  const canEdit = currentUserCan('Manage Vulnerability Data')
  //reducer for search and pagination
  const reducer = (state: DatasetState, action: DatasetAction): DatasetState|void => {
    switch (action.type) {
      case 'set-search': {
        if(state.queryParams.vulnerabilityname === action.payload) {
          return state
        }
        let newQueryParams = {vulnerabilityname: action.payload, offset: 0, limit: state.queryParams?.limit || DEFAULT_DATA_LIMIT}
        return {...state, queryParams: newQueryParams};
      }
    }
  };
  const [state, dispatch] = useDataReducer(reducer, initialState);
  const [selected, setSelected] = useState([])
  const navigate = useNavigate()
  
  const loadData = async () => {
    try {
      dispatch({ type: 'set-mode', payload: 'loading' });
      const data:FilteredSet = await fetchFilteredVulnerabilities(state.queryParams)
      let temp = formatRows(data.results)
      data.results = temp
      dispatch({ type: 'set-data', payload: {data} });
    } catch(error){
      dispatch({ type: 'set-error', payload: error });      
    } finally {
      dispatch({ type: 'set-mode', payload: 'idle' });
    }
  }
  const handleSelectedChange = (event: any) => {
    const ids = event.selectedRows.map((item:any) => item.id);
    setSelected(ids)
  }
  const onRowClicked = (row:any) => navigate(`/vulnerabilities/${row.id}`);
  
  useEffect(() => {
    loadData()
  }, [state.queryParams]);
  const handlePerRowsChange = (newPerPage: number) => {
    dispatch({ type: 'set-rows-per-page', payload: newPerPage });
  }
  function handlePageChange(page: number){
    dispatch({ type: 'set-page', payload: page });
  }
  
  const handleDelete = async (ids: any[]) => {
    if (!confirm('Are you sure?')) {
      return false;
    }
    try {
      const count = ids.length;
      await deleteVulnerabilities(ids)
      let msg: string;
      if (count === 1) {
        msg = 'Vulnerability deleted';
      } else {
        msg = `${count} vulnerabilities deleted`;
      }
      toast.success(msg);
    } catch(error) {
        console.error(error);
        dispatch({ type: 'set-error', payload: error });
    } finally {
        dispatch({ type: 'reset'});
        setSelected([])
    };
    return false;
  };
  function formatRows(rows: VulnWithActions[]):VulnWithActions[] {
    let temp: any = []
    rows.forEach((row: VulnWithActions) => {
      row.actions = (<>
                    <PencilSquareIcon onClick={() => navigate(`/vulnerabilities/${row.id}/edit`)} className="inline w-6 cursor-pointer"/>
                    
                    <TrashIcon onClick={() => handleDelete([row.id])} className="inline w-6 ml-2 cursor-pointer" />                        
                    </>)
      const [meaning, color] = useVulnerabilityColor(row.vulnerabilityseverity as string)
      row.severity = (<span className={`text-[${color}]`}>{meaning}</span>)
      temp.push(row)
    });
    return temp;
  
  }
  // vulnerabilityname
  // vulnerabilityseverity
  // cvssscore
  const handleFilter = (event:any) => {
    const {name, value} = event.target
    setFilterValues((prevFilterValues) => ({
      ...prevFilterValues,
      [name]: value,
    }));
  }
  const clearFilter = () => {
    setFilterValues({
      vulnerabilityname: '',
      vulnerabilityseverity: '',
      cvssscore: '',
    })
    dispatch({ type: 'reset'})
  }
  const [filterValues, setFilterValues] = useState({
    vulnerabilityname: '',
    vulnerabilityseverity: '',
    cvssscore: '',
  });
  const filterCommit = () => {
    dispatch({ type: 'set-filter', payload: filterValues})
  }
  const handleSort = (name: string, sortDirection: string) => {
    let order_by = sortDirection ? sortDirection : 'asc'
    if(name){
      dispatch({ type: 'set-sort', payload: {sort: name, order_by: order_by as 'asc' | 'desc'} });
      loadData()
    }
  }
  const columns: Column[] = [
    ...(currentUserCan('Manage Vulnerability Data') ? [{
      name: 'Action',
      selector: (row: VulnWithActions) => row.actions,
      maxWidth: '1rem'
    }] : []),
    {
      name: <HeaderFilter 
              label='Name' 
              name='vulnerabilityname' 
              defaultValue={filterValues.vulnerabilityname} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: VulnWithActions) => row.vulnerabilityname,
      maxWidth: '30em'
    },
    {
      name: <HeaderFilter 
              label='Severity' 
              name='vulnerabilityseverity' 
              defaultValue={filterValues.vulnerabilityseverity} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: VulnWithActions) => row.vulnerabilityseverity,
      maxWidth: '10em'
    },
    {
      name: <HeaderFilter 
              label='CVSS 3.1' 
              name='cvssscore' 
              defaultValue={filterValues.cvssscore} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: VulnWithActions) => row.cvssscore,
      maxWidth: '15em'
    },
    
  ]
  
  const deleteMultiple = () => {
    return handleDelete(selected)
  }
  if(state.error){
    console.error(state.error)
    navigate('/error')
  }
  return(
    <>
      <PageTitle title='Vulnerability Templates' />
      <div className="flow-root" >
        
      {currentUserCan('Manage Vulnerability Data') &&
        <Button 
          className='btn bg-primary float-right m-2 mr-0' 
          onClick={()=> navigate('/vulnerabilities/new')}
          >
          New Vulnerability
        </Button>
        }
        {currentUserCan('Manage Vulnerability Data') &&
          <Button  
            className="btn bg-secondary float-right m-2 mr-0 disabled:opacity-50" 
            disabled={selected.length == 0}
            onClick = {deleteMultiple}
          >
            Delete
          </Button>
        }
        <ClearFilter queryParams={state.queryParams} clearFilter={clearFilter}/>
        {state.mode === 'loading' && <div className="mt-16"><RowsSkeleton numRows={state.queryParams.limit}/></div>} 
        <div className={state.mode != 'idle' ? 'hidden' : ''}>
          <DataTable
              columns={columns}
              data={state.data}
              progressPending={state.mode != 'idle'}
              pagination
              paginationServer
              onRowClicked={onRowClicked}
              paginationPerPage={state.queryParams.limit}
              paginationTotalRows={state.totalRows}
              onChangeRowsPerPage={handlePerRowsChange}
              onChangePage={handlePageChange}
              striped
              onSelectedRowsChange={handleSelectedChange}
              pointerOnHover
              theme={theme}
              customStyles={customStyles}
              {...(canEdit ? { selectableRows: true } : {})}
          />
        </div>
      </div>
    </>
       
    );
};


export default WithAuth(Vulnerabilities);

