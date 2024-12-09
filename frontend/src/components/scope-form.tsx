import { useState } from 'react';
import { insertProjectScopes, updateProjectScope } from '../lib/data/api'
import { Scope } from '../lib/data/definitions'
import { StyleTextfield } from '../lib/formstyles'

import { Dialog, DialogBody } from '@material-tailwind/react';


interface ScopeFormProps {
  projectId: number
  scope?: string
  description?: string
  id?:number
  onClose: () => void
  afterSave: () => void
}
export default function ScopeForm(props: ScopeFormProps):JSX.Element{
  const [scope, setScope] = useState(props.scope || '')
  const [description, setDescription] = useState(props.description || '')
  const {id} = props
  const [saving, setSaving] = useState(false)
  const [scopeError, setScopeError] = useState('')
  
  const saveScope = async () => {
    setSaving(true)
    const data = [{scope, description}]
    let result
    try {
      if(id){
        result = await updateProjectScope(id, data[0])
      } else {
        result = await insertProjectScopes(props.projectId, data)
      }
    } catch(error){
      setScopeError('Error saving scope')
    } finally {
      setSaving(false)
    }
    props.afterSave()
    props.onClose()
  }
  const handleScopeChange = (event: any) => {
    setScope(event.target.value)
  }
  const handleDescriptionChange = (event: any) => {
    setDescription(event.target.value)
  }
  return(
      <>
     <div className={`flex w-full ${saving ? 'opacity-50' : ''}`}>
      <div className='flex items-start w-2/5'>
          <input
            type="text"
            autoFocus
            name='scope'
            id='scope'
            placeholder='Host name or IP address'
            className={StyleTextfield}
            value={scope}
            onChange={handleScopeChange}
          />
          
        </div>
        <div className='ml-2 w-2/5'>
          <input
            type="text"
            name='description'
            id='description'
            placeholder='Description'
            className={StyleTextfield}
            value={description}
            onChange={handleDescriptionChange}
          />
        </div>
        <div className='ml-1 w-1/4'>
          <button className='bg-primary text-white p-2 rounded-md inline disabled:opacity-50' disabled={Boolean(scopeError)} onClick={saveScope}>Save</button>
          <span className='text-secondary ml-2 inline cursor-pointer' onClick={props.onClose}>Cancel</span>
        </div>
        
      </div>
      {scopeError && <div className='text-sm text-red-500 mt-1 pl-2'>{scopeError}</div>}
      </>
    )
}
interface ModalScopeFormProps {
  projectId: number
  scope?: string
  description?: string
  id?:number
  onClose: () => void
  afterSave: () => void
}
export function ModalScopeForm(props: ModalScopeFormProps):JSX.Element{
  const [showModal, setShowModal] = useState(true)
  const clearModal = () => {
    props.onClose()
    setShowModal(false)
  }
  return(
    <Dialog handler={clearModal} open={showModal}  size="md" className="modal-box w-full bg-white p-4 rounded-md dark:bg-black" >
          <DialogBody className='max-w-[600px] '>
          <ScopeForm 
            projectId={props.projectId}
            onClose={clearModal}
            description={props.description}
            scope={props.scope}
            id={props.id}
            afterSave={props.afterSave}
          />
          </DialogBody>
        </Dialog>
  )
}
