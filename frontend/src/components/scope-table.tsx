import { useState, useEffect, useContext } from 'react'
import {StyleLabel, StyleTextfield} from '../lib/formstyles'
import { deleteProjectScope, getProjectScopes, insertProjectScopes } from '../lib/data/api'
import DataTable from 'react-data-table-component'
import { ThemeContext } from '../layouts/layout'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { Column, Scope } from '../lib/data/definitions'
import ScopeForm, { ModalScopeForm } from '../components/scope-form'
import { Dialog } from "@material-tailwind/react";
import useCustomStyles from '../components/tableStyle'

interface ScopeTableProps {
  projectId: number
  onScopesChange: (scopes: Scope[]) => void
}
export default function ScopeTable(props: ScopeTableProps): JSX.Element {
  const {projectId} = props
  const [editingScope, setEditingScope] = useState<number | false>(false)
  const [newScope, setNewScope] = useState(false)
  const [scopes, setScopes] = useState<Scope[]>([])
  const [selected, setSelected] = useState([])
  const [showDialog, setShowDialog] = useState(false)
  const [bulkScopes, setBulkScopes] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scopeError, setScopeError] = useState('')
  const theme = useContext(ThemeContext);
  const customStyles = useCustomStyles(theme)
  useEffect(() => {
    loadScopes()
  }, [projectId])
  async function deleteScope(event:any, ids: number[]): Promise<void> {
    event.stopPropagation()
    if (!confirm('Are you sure?')) {
      return;
    }
    try {
      await deleteProjectScope(ids)
      toast.success('Scope deleted')
      handleScopeChanges()
    } catch(error){
      console.error(error)
      toast.error(String(error))
    }
  }
  async function deleteMultiple(event:any){
    event.stopPropagation()
    if(selected.length == 0){
      toast.error('Please select at least one scope to delete')
      return
    }
    return deleteScope(event, selected)
    
  }
  const loadScopes = async () => {
    const _scopes = await getProjectScopes(String(projectId)) as ScopeWithActions[]
    props.onScopesChange(_scopes)
    const formatted: ScopeWithActions[] = formatRows(_scopes)
    setScopes(formatted)
    return _scopes
  }
  const handleSelectedChange = (event: any) => {
    const ids = event.selectedRows.map((item:any) => item.id);
    setSelected(ids)
  }
  interface ScopeWithActions extends Scope {
    actions: React.ReactNode
  }
  const addBulkScopes = () => {
    setShowDialog(true)
  }
  const cancelBulkScopes = () => {
    if(editing){
      if(!confirm('Cancel without saving?')){
        return
      }
    }
    setShowDialog(false)
  }
  const saveBulkScopes = async () => {
    setSaving(true)
    setEditing(true)
    
    const lines = bulkScopes.split('\n').map(scopeWithDescription => {
        const [scope, ...description] = scopeWithDescription.trim().split(','); // Split the line into scope and description
        return {
          scope: scope, 
          description:description.join(' ')
        };
      });
    
      try {
        await insertProjectScopes(props.projectId, lines)
        setShowDialog(false) 
        handleScopeChanges() 
        setBulkScopes('')
      } catch(error){
        setScopeError('Error saving scope')
        toast.error(String(error))
      } finally {
        setSaving(false)
      }
    
  }
  const bulkScopesChange = (event: any) => {
    setBulkScopes(event.target.value)
  }
  const handleScopeChanges = () => {
    loadScopes().then((data) => {
      props.onScopesChange(data)
      setScopes(formatRows(data))
    })
  }
  
  function formatRows(rows: ScopeWithActions[]):ScopeWithActions[] {
    let temp: ScopeWithActions[] = []
    rows.forEach((row: ScopeWithActions) => {
      row.actions = (<>
                    <PencilSquareIcon onClick={() => setEditingScope(row.id)} className="inline w-6 cursor-pointer"/>
                    <TrashIcon onClick={(event) => deleteScope(event,[row.id])} className="inline w-6 ml-2 cursor-pointer" />                        
                    </>)
      temp.push(row)
    });
    return temp;
  
  }
  const columns: Column[] = [
    {
      name: 'Action',
      selector: (row: ScopeWithActions) => row.actions,
      maxWidth: '1rem'
    },
    {
      name: 'Scope',
      selector: (row: ScopeWithActions) => row.scope,
    },
    {
      name: 'Description',
      selector: (row: ScopeWithActions) => row.description,
      maxWidth: '10em'
    }
  ]
  return (
      <div className='max-w-2xl'>
        <div className='mb-4'>
        {newScope ? 
          <ScopeForm projectId={Number(projectId)} onClose={()=>setNewScope(false)} afterSave={handleScopeChanges}/>
        :
          <>
            
            {scopes.length > 0 &&
              <button  
                className="bg-secondary float-right p-2 text-white rounded-md disabled:opacity-50"
                disabled={selected.length == 0}
                onClick = {deleteMultiple}
              >
                Delete
              </button>
            }
            <button className='bg-primary text-white p-2 rounded-md inline mr-2 ' onClick={()=>setNewScope(true)}>Add New</button>
            <button className='bg-secondary text-white p-2 rounded-md inline ' onClick={addBulkScopes}>
              Add Multiple
            </button>
            <Dialog handler={cancelBulkScopes} open={showDialog} size="sm" className="modal-box w-[500px] bg-white p-4 rounded-md dark:bg-black" >
              <label 
                htmlFor="bulkScopes"
                className={StyleLabel}>
                Enter URLs with (optional) description seperated by comma, one pair per line
              </label>
              <textarea
                name="bulkScopes"
                id="bulkScopes"
                placeholder='example.com, description'
                rows={8}
                className={StyleTextfield}
                value={bulkScopes}
                onChange={bulkScopesChange}
              />
              {scopeError && <p className="text-red-500">{scopeError}</p>}
              <button 
                onClick={saveBulkScopes}
                className="bg-primary text-white cursor-pointer disabled:bg-gray-300 mt-2 p-2 rounded-md"
                disabled = {bulkScopes.trim() === '' || saving}
                >
                {saving ? 'Saving...' : 'Add'}
              </button>
              <button onClick={cancelBulkScopes}
                className="bg-red-600 text-white cursor-pointer disabled:bg-gray-300 mt-2 ml-2 p-2 rounded-md">
                Cancel
              </button>
            </Dialog>
          </>
        }
        </div>
        <DataTable
          columns={columns}
          data={scopes}
          selectableRows
          pagination
          paginationPerPage={10}
          striped
          onSelectedRowsChange={handleSelectedChange}
          theme={theme}
          customStyles={customStyles}
        />
        {editingScope &&
        <ModalScopeForm
          projectId={projectId}
          scope={scopes.find((scope) => scope.id === editingScope)?.scope}
          description={scopes.find((scope) => scope.id === editingScope)?.description}
          id={editingScope}
          onClose={() => setEditingScope(false)}
          afterSave={handleScopeChanges}
        />
      }
      </div>
                    
  )
}