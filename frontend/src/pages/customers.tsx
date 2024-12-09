import { 
        useEffect, 
        useState, 
        useRef, 
        useCallback,
        useContext } from 'react'
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../layouts/layout';
import { fetchFilteredCustomers, deleteCustomers } from "../lib/data/api";
import { DatasetState, DatasetAction, DEFAULT_DATA_LIMIT, useDataReducer } from '../lib/useDataReducer';
import { RowsSkeleton } from '../components/skeletons'
import PageTitle from '../components/page-title';
import { WithAuth } from "../lib/authutils";
import { currentUserCan } from "../lib/utilities";
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../components/button';
import CustomerForm from './customer-form';
import { Dialog, DialogBody } from '@material-tailwind/react'
import {Customer, Column, FilteredSet} from '../lib/data/definitions'
import DataTable from 'react-data-table-component';
import { HeaderFilter, ClearFilter } from "../components/headerFilter";
import { toast } from 'react-hot-toast'
import useCustomStyles from '../components/tableStyle'


export function Customers() {
  const theme = useContext(ThemeContext);
  const customStyles = useCustomStyles(theme);
  const initialState: DatasetState = {
    mode: 'idle',
    data: [],
    queryParams: {offset:0, limit:DEFAULT_DATA_LIMIT},
    totalRows: 0,
  };
  // initial load - if there's a search term in the url, set it in state,
  // this makes search load immediately in useEffect
  const params = new URLSearchParams(window.location.search);
  const search = params.get('full_name') || '';
  if(search){
    initialState.queryParams = {offset:0, limit:DEFAULT_DATA_LIMIT, full_name: search};
  }
  const reducer = (state: DatasetState, action: DatasetAction): DatasetState|void => {
    switch (action.type) {
      case 'set-search': {
        if(state.queryParams.full_name === action.payload) {
          return state
        }
        let newQueryParams = {full_name: action.payload, offset: 0, limit: state.queryParams?.limit || DEFAULT_DATA_LIMIT}
        return {...state, queryParams: newQueryParams};
      }
    }
  };
  const handleSort = (name: any, sortDirection: string) => {
    let order_by = sortDirection ? sortDirection : 'asc'
    if(name){
      dispatch({ type: 'set-sort', payload: {sort: name, order_by: order_by as 'asc' | 'desc'} });
      loadData()
    }
  }
  const [state, dispatch] = useDataReducer(reducer, initialState);
  const navigate = useNavigate()
  
  /* MODAL CREATING AND HANDLING */
  const [customerId, setCustomerId] = useState('') //id of the object to be edited in modal
  const [refresh, setRefresh] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState([])
  

  const openModal = useCallback((id: string ='') => {
    setCustomerId(id)
    setShowModal(true)
    ref.current?.showModal();
    
  }, [ref]);
  useEffect(() => {
    if(showModal){
      ref.current?.showModal()
    } else {
      ref.current?.close()
    }
  },[showModal])
  
  const clearModal = () => {
    setCustomerId('')
    setShowModal(false);
  }
  const handleNew = () => {
    openModal('')
  }
  /* FETCH OF DATA TO RENDER */
  //CustomerWithActions is a type of customer that allows appending an actions column for use in the table view
  interface CustomerWithActions extends Customer {
    actions: JSX.Element;
  }
  const loadData = async() => {
    try {
      dispatch({ type: 'set-mode', payload: 'loading' });
      const data:FilteredSet = await fetchFilteredCustomers(state.queryParams)
      let temp: any = []
      data.results.forEach((row: CustomerWithActions) => {
        row.actions = (<>
                      <PencilSquareIcon onClick={() => openModal(String(row.id))} className="inline w-6 cursor-pointer"/>
                      <TrashIcon onClick={() => handleDelete([row.id] as number[])} className="inline w-6 ml-2 cursor-pointer" />                        
                      </>)
        temp.push(row)
      });
      data.results = temp
      dispatch({ type: 'set-data', payload: {data} });
    } catch(error){
      dispatch({ type: 'set-error', payload: error });      
    } finally {
      dispatch({ type: 'set-mode', payload: 'idle' });
    }
    setRefresh(false)
  }
  useEffect(() => {
    loadData()
  }, [refresh, state.queryParams]);
  
  // filter params
  // full_name
  // company
  // email
  // position
  // is_active
  const [filterValues, setFilterValues] = useState({
    full_name: '',
    company: '',
    email: '',
    position: '',
    is_active: '',
  });
  const handleFilter = (event:any) => {
    const {name, value} = event.target
    setFilterValues((prevFilterValues) => ({
      ...prevFilterValues,
      [name]: value,
    }));
  }
  const clearFilter = () => {
    setFilterValues({
      full_name: '',
      company: '',
      email: '',
      position: '',
      is_active: '',
    });
    dispatch({ type: 'reset'})
  }
  const filterCommit = () => {
    dispatch({ type: 'set-filter', payload: filterValues})
  }
  const columns: Column[] = [
    ...(currentUserCan('Manage Customers') ? [{
      name: 'Action',
      selector: (row: any) => row.actions,
      maxWidth: '1rem'
    }] : []),
    {
      name: <HeaderFilter 
              label='Name' 
              name='full_name' 
              defaultValue={filterValues.full_name} 
              currentFilter={state.queryParams}
              onCommit={filterCommit} 
              onChange={handleFilter}
              handleSort={handleSort}
            />,
      selector: (row: Customer) => row.full_name,
    },
    {
      name: <HeaderFilter 
              label='Company' 
              name='company' 
              defaultValue={filterValues.company} 
              currentFilter={state.queryParams}
              onCommit={filterCommit} 
              onChange={handleFilter}
              handleSort={handleSort}
            />,
      selector: (row: Customer) => row.company,
    },
    {
      name: <HeaderFilter 
              label='Active?' 
              name='is_active' 
              defaultValue={filterValues.is_active} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              isBoolean={true}
            />,
      selector: (row: Customer) => row.is_active ? 'Yes' : 'No',
      maxWidth: '120px'
    },
    {
      name: <HeaderFilter 
              label='Position' 
              name='position' 
              defaultValue={filterValues.position} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
            />,
      selector: (row: Customer) => row.position,      
    },
    {
      name: <HeaderFilter 
              label='Email' 
              name='email' 
              defaultValue={filterValues.email} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
            />,
      selector: (row: Customer) => row.email,
    },
    {
      name: 'Phone',
      selector: (row: Customer) => row.number,
    },
  ];
  
  const handleDelete = async (id: number | number[]) => {
    if(!currentUserCan('Manage Customers')){
      return
    }
    let toDelete = Array.isArray(id) ? id : [id]
    
    try {
      await deleteCustomers(toDelete)
      setRefresh(true)
      let msg:string;
      if(toDelete.length == 1) {
        msg = 'Customer deleted';
      } else {
        msg = `${toDelete.length} customers deleted`;
      }
      toast.success(msg)
      
      setSelected([])
    } catch(error){
      dispatch({ type: 'set-error', payload: error });
    } finally {
      dispatch({ type: 'set-mode', payload: 'idle' });
    }
    
  }
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
      params.set('full_name', term);
      navigate(`?${params.toString( )}`, { replace: true });
    } else {
      dispatch({ type: 'clear-search'})
      navigate(location.pathname, { replace: true });
    }
  }
  const handlePerRowsChange = (newPerPage: number) => {
    dispatch({ type: 'set-rows-per-page', payload: newPerPage });
  }
  function handlePageChange(page: number){
    dispatch({ type: 'set-page', payload: page });
  }
  if(state.error){
    navigate('/error')
  } 
  return(
    <>
      <PageTitle title='Customers' />
      {/* modal content */}
      {showModal &&
      <Dialog handler={clearModal} open={showModal} size="md" className="p-4 rounded-md dark:bg-black dark:text-white">
    
        <form method="dialog" onSubmit={clearModal}>
        <Button className="absolute right-4 top-4  rounded-full text-lg w-8 h-8 flex justify-center items-center">
        <span className="dark:bg-white">X</span>
      </Button>
        </form>
        <DialogBody className="w-full dark:bg-black dark:text-white">
        {customerId   && <CustomerForm id={customerId} forwardedRef={ref} setRefresh={setRefresh} onClose={clearModal}/>}
        {!customerId && <CustomerForm forwardedRef={ref} setRefresh={setRefresh} onClose={clearModal}/>}
        </DialogBody>
      </Dialog>
      }
      {/* END modal content */}
      <div className="flow-root">
        {currentUserCan('Manage Customers') && (
            <>
              <Button className='btn bg-primary float-right m-2' onClick={handleNew}>
                  New Customer
              </Button>
              <Button 
                className="btn bg-secondary float-right m-2 mr-0 disabled:opacity-50" 
                disabled={selected.length == 0}
                onClick = {deleteMultiple}
                >
                  Delete
              </Button>
            </>
          )}
        <ClearFilter queryParams={state.queryParams} clearFilter={clearFilter}/>
        {state.mode === 'loading' && <div className="mt-16 "><RowsSkeleton numRows={state.queryParams.limit}/></div>} 
        <div className={state.mode != 'idle' ? 'hidden' : ''}>
          <DataTable
              columns={columns}
              data={state.data}
              progressPending={state.mode != 'idle'}
              pagination
              paginationServer
              paginationPerPage={state.queryParams.limit}
              paginationTotalRows={state.totalRows}
              onChangeRowsPerPage={handlePerRowsChange}
              onChangePage={handlePageChange}
              striped
              progressComponent={<RowsSkeleton numRows={state.queryParams.limit}/>}
              onSelectedRowsChange={handleSelectedChange}
              theme={theme}
              customStyles={customStyles}
              {...(currentUserCan('Manage Customers') ? { selectableRows: true } : {})}
          />
        </div>
      </div>
    </>
  )
}

export default WithAuth(Customers);