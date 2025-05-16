import { fetchCompanies } from '../lib/data/api';
import { Company } from  '../lib/data/definitions'
import {  useState, useEffect } from 'react';
import {SingleInputSkeleton} from './skeletons'
import {sortByPropertyName} from '../lib/utilities'
import FilterInput from '../components/filterInput';

interface CompanySelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string
  value: any,
  changeHandler: React.ChangeEventHandler | ((e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void)
  error?: boolean
  required?:boolean
}
export default function CompanySelect(props: React.PropsWithChildren<CompanySelectProps>) {
  
  const [companies, setCompanies] = useState<Company[]>();
  const [value, setValue] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>(
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await fetchCompanies()
        const sorted = sortByPropertyName(companiesData,'name')
        setCompanies(sorted as Company[]);
      } catch (error) {
        console.error("Error fetching companies list:", error);
      }
      return null;
    }
    loadCompanies()
  }, []);
  
  useEffect(() => {
    setValue(props.value || ''); 
  }, [props.value])
  
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
  
 const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     props.changeHandler && props.changeHandler(event);
   };
 

  
  if(typeof companies === 'undefined'){
    console.log("Company is undefiended")
    return (<SingleInputSkeleton />)
  }
  return (
    <FilterInput
      name={props.name}
      defaultValue={value}
      autoFocus={props.autoFocus}
      multiple={props.multiple}
      searchArray={companies.map((company) => ({
        label: company.name as string,
        value: company.name as string,
      }))}
      onSelect={handleChange}
    />
  );
  
}