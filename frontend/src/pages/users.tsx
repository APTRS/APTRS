import { User, Column, FilteredSet } from '../lib/data/definitions'
import { useEffect, useState, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom'
import { fetchFilteredUsers, deleteUsers } from "../lib/data/api";
import { RowsSkeleton } from '../components/skeletons'
import PageTitle from '../components/page-title';
import { WithAuth } from "../lib/authutils";
import { parseErrors, currentUserCan } from "../lib/utilities";
import Button from '../components/button';
import UserForm from './user-form';
import { Dialog, DialogBody } from '@material-tailwind/react'
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { useCurrentUser } from '../lib/customHooks';
import { useDataReducer } from '../lib/useDataReducer';
import { DatasetState, DatasetAction, DEFAULT_DATA_LIMIT } from '../lib/useDataReducer'
import {HeaderFilter, ClearFilter} from '../components/headerFilter'
import { ThemeContext } from '../layouts/layout';
import useCustomStyles from '../components/tableStyle'

interface UserWithActions extends User {
  actions: JSX.Element;
}

export function Users() {
  const initialState: DatasetState = {
    mode: 'idle',
    data: [],
    queryParams: {offset:0, limit:DEFAULT_DATA_LIMIT},
    totalRows: 0,
  }
  const theme = useContext(ThemeContext);
  const customStyles = useCustomStyles(theme);
  // initial load - if there's a search term in the url, set it in state,
  // this makes search load immediately in useEffect
  const params = new URLSearchParams(window.location.search);
  const search = params.get('full_name') || '';
  if(search){
    initialState.queryParams = {offset:0, limit:DEFAULT_DATA_LIMIT, full_name: search};
  }

  const canEdit = currentUserCan('Manage Users')
  const reducer = (state: DatasetState, action: DatasetAction): DatasetState | void => {
    switch (action.type) {
      case 'set-search': {
        if(state.queryParams.full_name === action.payload) {
          return state
        }
        let newQueryParams = {full_name: action.payload, offset: 0, limit: state.queryParams?.limit || DEFAULT_DATA_LIMIT}
        return {...state, queryParams: newQueryParams};
      }
    }
  }
  const handleSort = (name: string, sortDirection: string) => {
    let order_by = sortDirection ? sortDirection : 'asc'
    if(name){
      dispatch({ type: 'set-sort', payload: {sort: name, order_by: order_by as 'asc' | 'desc'} });
      loadData()
    }
  }
  const [state, dispatch] = useDataReducer(reducer, initialState);
  //super user check to prevent url tampering
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  if(!currentUserCan('Manage Users')){
    navigate('/access-denied')
  }
  const [selected, setSelected] = useState([])
  const [filterValues, setFilterValues] = useState({
    username: '',
    full_name: '',
    company: '',
    is_active: 1,
    email: '',
    groups: ''
  });
  
  //modal state variables
  const [userId, setUserId] = useState('')
  const [refresh, setRefresh] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const ref = useRef<HTMLDialogElement>(null);
  
  const openModal = useCallback((id = '') => {
    setUserId(id)
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
    setShowModal(false);
    setUserId('')
  }
  const hideModal = () => {    
    setUserId('')
    setShowModal(false);
  }
  const handleNew = () => {
    openModal('')
  }
  const handleSelectedChange = (event: any) => {
    const ids = event.selectedRows.map((item:any) => item.id);
    setSelected(ids)
    
  }
  const deleteMultiple = () => {
    return handleDelete(selected)
  }
  const handleFilter = (event:any) => {
    const {name, value} = event.target
    setFilterValues((prevFilterValues) => ({
      ...prevFilterValues,
      [name]: value,
    }));
  }
  const filterCommit = () => {
    dispatch({ type: 'set-filter', payload: filterValues})
  }
  const clearFilter = () => {
    setFilterValues({
      username: '',
      full_name: '',
      is_active: 1,
      email: '',
      company: '',
      groups: ''
    });
    dispatch({ type: 'reset'})
  }
  const columns: Column[] = [
    ...(currentUserCan('Manage Users') ? [{
      name: 'Action',
      selector: (row: any) => row.actions,
      maxWidth: '1rem'
    }] : []),
    {
      name: <HeaderFilter 
              label='Name' 
              name='full_name' 
              defaultValue={filterValues.full_name} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: User) => row.full_name,
    },
    {
      name: <HeaderFilter 
              label='Username' 
              name='username' 
              defaultValue={filterValues.username} 
              onCommit={filterCommit} 
              onChange={handleFilter}
              currentFilter={state.queryParams}
              handleSort={handleSort}
              />,
      selector: (row: User) => row.username,
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
      selector: (row: User) => row.email,
    },
    {
      name: 'Phone',
      selector: (row: User) => row.number
    },
    {
      name: 'Position',
      selector: (row: User) => row.position
    },
    {
      name: 
        <HeaderFilter 
          label='Active?' 
          name='is_active' 
          isBoolean={true} 
          defaultValue={String(filterValues.is_active)}          
          onCommit={filterCommit} 
          onChange={handleFilter} 
          currentFilter={state.queryParams}
          handleSort={handleSort} 
        />,
      selector: (row: User) => row.is_active ? "Yes" : "No",
    },
    {
      name: 
        <HeaderFilter 
          label='Groups' 
          name='groups' 
          defaultValue={String(filterValues.groups)}          
          onCommit={filterCommit} 
          onChange={handleFilter} 
          currentFilter={state.queryParams}
          handleSort={handleSort} 
        />,
      selector: (row: User) => row.groups?.join(', '),
    },
    {
      name: 'Admin?',
      selector: (row: User) => row.is_superuser ? "Yes" : "No",
      sortable: true,
    },
  ];
  const handleDelete = async (ids: any[]) => {
    if(ids.includes(currentUser?.id)){
      toast.error("You cannot delete your own account")
      return false
    }
    if(!confirm('Are you sure?')){
      return false;
    }
    try {
      await deleteUsers(ids)
      setRefresh(true)
      let msg:string;
      if(ids.length == 1) {
        msg = 'User deleted';
      } else {
        msg = `${ids.length} users deleted`;
      }
      toast.success(msg)
    } catch(error){
      setRefresh(false)
      toast.error(parseErrors(error))
    }
  }
  const handleSearch = (term = '') => {
    if (term) {
      dispatch({ type: 'set-search', payload: term });
      const params = new URLSearchParams(window.location.search);
      params.set('full_name', term);
      navigate(`?${params.toString()}`, { replace: true });
    } else {
      dispatch({ type: 'clear-search'})
      navigate(location.pathname, { replace: true });
    }
  }
  const clearSearch = () => {
    return handleSearch('')
  }
  const loadData = async () => {
    try {
      dispatch({ type: 'set-mode', payload: 'loading' });
      const data:FilteredSet = await fetchFilteredUsers(state.queryParams)
      const temp: any = []
      data.results.forEach((row: UserWithActions) => {
        row.actions = (<>
                      <PencilSquareIcon onClick={() => openModal(String(row.id))} className="inline w-6 cursor-pointer"/>
                      <TrashIcon onClick={() => handleDelete([row.id])} className="inline w-6 ml-2 cursor-pointer" />                        
                      </>)
        temp.push(row)
      });
      dispatch({ type: 'set-data', payload: {data} });
    } catch(error){
      dispatch({ type: 'set-error', payload: error });
    } finally {
      dispatch({ type: 'set-mode', payload: 'idle' });
    }
  }
  useEffect(() => {
    loadData();
  }, [refresh, state.queryParams]);

  const handlePerRowsChange = (newPerPage: number) => {
    dispatch({ type: 'set-rows-per-page', payload: newPerPage });
  }
  function handlePageChange(page: number){
    dispatch({ type: 'set-page', payload: page });
  }
  if(state.mode == 'error'){
    console.error(state.error)
    navigate('/error')
  }
  return(
    <>
      <PageTitle title='Users' />
        
      {/* modal content */}
        {showModal &&
        <Dialog handler={clearModal} open={showModal} size="sm" className="modal-box w-[500px] bg-white dark:bg-black dark:text-white p-4 rounded-md" >
          <form method="dialog" onSubmit={hideModal}>
            <Button className="bg-gray visible absolute right-2 top-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-md w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white">
              <span className="text-gray-400 hover:text-white-900">x</span>
            </Button>
          </form>
          <DialogBody className='max-w-[600px] dark:bg-black '>
          {userId   && <UserForm id={userId} forwardedRef={ref} setRefresh={setRefresh} onClose={clearModal}/>}
          {!userId && <UserForm forwardedRef={ref} setRefresh={setRefresh} onClose={clearModal}/>}
          </DialogBody>
        </Dialog>
        }
        
        {/* END modal content */}
      <div className="flow-root">
        
        <Button className='btn bg-primary float-right m-2' onClick={handleNew}>
            New User
        </Button>
        {currentUserCan('Manage Users') &&
          <Button 
          className="btn bg-secondary float-right m-2 mr-0 disabled:opacity-50" 
            disabled={selected.length == 0}
            onClick = {deleteMultiple}
            >
              Delete
          </Button>
        }
        {state.queryParams.full_name &&
          <p className="mt-8">
            Results for &quot;{state.queryParams.full_name}&quot;
            <span className="text-xs ml-1">(<span className="underline text-blue-600" onClick={clearSearch}>clear</span>)</span>
          </p>
        }
        <ClearFilter queryParams={state.queryParams} clearFilter={clearFilter}/>
        <div className='mt-20 w-xl'>
          
          {state.mode == 'loading' && <RowsSkeleton numRows={state.queryParams.limit} />}
          <div className={state.mode != 'idle' ? 'hidden' : ''}>
            <DataTable
                columns={columns}
                data={state.data}
                pagination
                paginationServer
                paginationPerPage={state.queryParams.limit}
                onChangeRowsPerPage={handlePerRowsChange}
                onChangePage={handlePageChange}
                paginationTotalRows={state.totalRows}
                striped
                onSelectedRowsChange={handleSelectedChange}
                theme={theme}
                customStyles={customStyles}
                {...(canEdit ? { selectableRows: true, pointerOnHover: true } : {})}

            />
          </div>
        </div>
      </div>
    </>
  )
}

export default WithAuth(Users);