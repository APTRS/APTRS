import { fetchPermissionGroups } from '../lib/data/api';
import { PermissionGroup } from  '../lib/data/definitions'
import {  useState, useEffect } from 'react';
import { StyleTextfield } from '../lib/formstyles';
import { StyleTextfieldError } from '../lib/formstyles';
import {SingleInputSkeleton} from './skeletons'

interface PermissionGroupProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string
  value: string[] | undefined,
  changeHandler: React.ChangeEventHandler | undefined
  error?: boolean
}
export default function PermissionGroupSelect(props: React.PropsWithChildren<PermissionGroupProps>) {
  
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>();

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await fetchPermissionGroups()
        setPermissionGroups(data as PermissionGroup[]);
      } catch (error) {
        console.error("Error fetching companies list:", error);
      }
      return null;
    }
    loadGroups()
  }, []);
  if(typeof permissionGroups == 'undefined'){
    return (<SingleInputSkeleton />)
  }
  return (
          <>
           
           {permissionGroups && (
            <select name={props.name}
              size = {permissionGroups.length}
              multiple={true}
              defaultValue={props.value}
              onChange={props.changeHandler}
              className={props.error ? `${StyleTextfieldError}` :`${StyleTextfield}`}
            >
            {permissionGroups && permissionGroups.map((group =>
                <option 
                  key={group.id} 
                  value={group.name}
                >
                  {group.name}
                </option>
           ))}
            </select>
          )}
          </>
  )
}