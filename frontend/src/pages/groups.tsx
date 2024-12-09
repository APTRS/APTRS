import {Group, Column } from '../lib/data/definitions'
import { useEffect, useState, useContext } from 'react';
import * as api from "../lib/data/api";
import { RowsSkeleton } from '../components/skeletons'
import PageTitle from '../components/page-title';
import { WithAuth } from "../lib/authutils";
import { currentUserCan } from "../lib/utilities";
import { ThemeContext } from '../layouts/layout';
import Button from '../components/button';
import GroupForm from './group-form';
import { Dialog, DialogBody } from '@material-tailwind/react'
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import useCustomStyles from '../components/tableStyle'

export function Groups() {
  const theme = useContext(ThemeContext);
  const customStyles = useCustomStyles(theme);
  const [loading, setLoading] = useState(true)
  
  // initial load - if there's a search term in the url, set it in state,
  // this makes search load immediately in useEffect
  const canEdit = currentUserCan('Manage Group')
  //partial reducer for search and pagination; the rest is handled by useDataReducer
  const [selected, setSelected] = useState([])
  const [groups, setGroups] = useState<Group[]>([])
  //modal state variables
  const [refresh, setRefresh] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [group, setGroup] = useState<GroupFormProps>({name: '', description: '', list_of_permissions: []})
  
  interface GroupFormProps {
    id?: number,
    name: string,
    description: string,
    list_of_permissions: string[]
  }
  const openModal = (group: GroupFormProps) => {
    setGroup(group)
    setShowModal(true)
  }
  
  const clearModal = () => {
    setShowModal(false);
  }
  const handleNew = () => {
    openModal({name: '', description: '', list_of_permissions: []})
  }
  const columns: Column[] = [
    ...(currentUserCan('Manage Group') ? [{
      name: 'Action',
      selector: (row: any) => row.actions,
      maxWidth: '1rem'
    }] : []),
    {
      name: 'Name',
      selector: (row: Group) => row.name,
      sortable: true,
      maxWidth: '10rem'
    },
    {
      name: 'Description',
      selector: (row: Group) => row.description,
      sortable: true,
      maxWidth: '14rem'
    },
    {
      name: 'Permissions',
      selector: (row: Group) => (
        <div className={`my-1 grid gap-x-4 ${row.list_of_permissions.length > 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {row.list_of_permissions.map((permission, index) => (
            <div key={index} className="mb-1 w-[170px]">{permission}</div>
          ))}
        </div>
      ),
      sortable: true,
    },
  ];
  interface GroupWithActions extends Group {
    actions: JSX.Element;
  }
  const deleteMultiple = () => {
    return handleDelete(selected)
  }
    
  const handleDelete = async (ids: number | number[]) => {
    if(!currentUserCan('Manage Group')){
      return false;
    }
    if(!confirm('Are you sure?')){
      return false;
    }
    let toDelete = Array.isArray(ids) ? ids : [ids]
    try {
      await api.deleteGroups(toDelete)
      setRefresh(true)
      let msg:string;
      if(toDelete.length == 1) {
        msg = 'Group deleted';
      } else {
        msg = `${toDelete.length} groups deleted`;
      }
      toast.success(msg)
    } catch(error){
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  const loadData = async() => {
    try {
      const data = await api.fetchGroups()
      let temp: any = []
      data.forEach((row: GroupWithActions) => {
        row.actions = (<>
                      <PencilSquareIcon onClick={() => openModal({id: row.id, name:row.name, description: row.description, list_of_permissions: row.list_of_permissions})} className="inline w-6 cursor-pointer"/>
                      <TrashIcon onClick={() => handleDelete([row.id])} className="inline w-6 ml-2 cursor-pointer" />                        
                      </>)
        temp.push(row)
      });
      setGroups(temp)
    } catch(error){
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  const handleSelectedChange = (event: any) => {
    const ids = event.selectedRows.map((item:any) => item.id);
    setSelected(ids)
    
  }
  useEffect(() => {
    loadData()
    setRefresh(false)
  }, [refresh]);
  
  return(
    <>
      <PageTitle title='User Groups' />
      {/* modal content */}
        {showModal &&
        <Dialog handler={clearModal} open={showModal} size="md" className="rounded-md dark:bg-black dark:text-white" >
          <DialogBody>
          {group  && <GroupForm group={group} onSave={() => setRefresh(true)} onClose={clearModal}/>}
          </DialogBody>
        </Dialog>
        }
        {/* END modal content */}
      <div className="flow-root">
        {currentUserCan('Manage Group') &&
          <>
            <Button className='btn bg-primary float-right m-2' onClick={handleNew}>
                New Group
            </Button>
              <Button 
                className="btn bg-secondary float-right m-2 mr-0 disabled:opacity-50" 
                disabled={selected.length == 0}
                onClick = {deleteMultiple}
                >
                  Delete
              </Button>
            
          </>
        }
       
        {loading && <div className="mt-16"><RowsSkeleton numRows={10}/></div>} 
        <div className={loading ? 'hidden' : ''}>
          <DataTable
            columns={columns}
            data={groups}
            onSelectedRowsChange={handleSelectedChange}
            pagination
            striped
            progressPending={loading}
            theme={theme}
            customStyles={customStyles}
            {...(canEdit ? { selectableRows: true } : {})}
          />
        </div>
      </div>
    </>
  )
}

export default WithAuth(Groups);