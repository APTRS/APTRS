import {  useState, useEffect } from 'react';
import { SingleInputSkeleton } from './skeletons'
import {sortByPropertyName} from '../lib/utilities'
import FilterInput from '../components/filterInput';
import { fetchFilteredUsers } from '../lib/data/api';
import { User } from '../lib/data/definitions';
interface CompanySelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string
  value: any,
  changeHandler: React.ChangeEventHandler | ((e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void)
  error?: boolean
  required?:boolean
  autoFocus?: boolean;
}
export default function UserSelect(props: React.PropsWithChildren<CompanySelectProps>) {
  const [users, setUsers] = useState<User[]>();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // fetch only active users because API won't accept inactive users in the form
        const response = await fetchFilteredUsers({is_active: true})
        const usersData = response.results
        const sortedActiveUsers = sortByPropertyName(usersData, 'full_name');
        setUsers(sortedActiveUsers as User[]);
      } catch (error) {
        console.error("Error fetching companies list:", error);
      }
      return null;
    }
    loadUsers()
  }, []);
  
  // Monitor theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  const handleChange = (event:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    console.log(event)
    props.changeHandler && props.changeHandler(event)
    
  }
  if(typeof users === 'undefined'){
    if(props.multiple){
      return (<><SingleInputSkeleton /><SingleInputSkeleton /></>)
    } else {
      return (<SingleInputSkeleton />)
    }
  }
  return (
          <>
            <FilterInput
              name={props.name}
              defaultValue={props.value}
              autoFocus={props.autoFocus}
              multiple={props.multiple}
              prompt='Type to see users'
              searchArray={users && users.map(user => ({label: user.full_name as string, value: user.username as string}))}
              onSelect={handleChange}
            />
          </>
  )
}