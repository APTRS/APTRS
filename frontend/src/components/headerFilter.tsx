import { useState, useRef } from 'react'
import { BackspaceIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { PiKeyReturnThin } from "react-icons/pi"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DatasetState } from '../lib/useDataReducer'
import { CiCircleRemove } from "react-icons/ci";
import { FaArrowUp, FaArrowDown } from "react-icons/fa6";

interface HeaderFilterProps {
  label: string;
  name: string;
  defaultValue: string;
  isDate?: boolean;
  isBoolean?: boolean;
  onChange: (event: any) => void;
  onCommit: (event: any) => void;
  handleSort?: (name: string, order: string) => void;
}

export function isFiltered(queryParams: DatasetState['queryParams']): boolean {
  const { limit, offset, order_by, sort, ...rest } = queryParams;
  return Object.values(rest).some(value => value !== '');
}

interface ClearFilterProps {
  queryParams: DatasetState['queryParams'];
  clearFilter: (event: any) => void;
  
}
export function ClearFilter({queryParams, clearFilter }: ClearFilterProps): JSX.Element {
  if(!isFiltered(queryParams)) {
    return <></>
  }
  return (
      <div className='text-sm text-center my-4'  onClick={clearFilter}>
          <CiCircleRemove className='w-4 h-4 text-secondary inline'/> Clear filter
      </div>
  )
}
interface HeaderFilterProps {
  label: string;
  name: string;
  defaultValue: string;
  isDate?: boolean;
  isBoolean?: boolean;
  onChange: (event: any) => void;
  onCommit: (event: any) => void;
  handleSort?: (name: string, order: string) => void;
  currentFilter: DatasetState['queryParams'];
}
export function HeaderFilter({label, name, defaultValue, isDate = false, isBoolean = false, onChange, onCommit, handleSort, currentFilter }: HeaderFilterProps): JSX.Element {
  const [active, setActive] = useState(isBoolean ? false : Boolean(defaultValue))
  const [value, setValue] = useState(defaultValue)
  const [focus, setFocus] = useState(false)
  const inputRef = useRef(null);
  const filterKeyDown = (event:any) => {
    if(event.key === 'Enter') {
      onCommit(event)
    }
    if(event.key === 'Escape') {
      clearValue()
    }
  }
  const handleRadioChange = (event:any) => {
    setValue(event.target.value)
    setFocus(true)
    const ev = {
      target: {
        name: name,
        value: event.target.value
      }
    }
    onChange(ev)
  }
  const clearValue = () => {
    setValue('')
    setActive(false)
  }
  const handleChange = (event:any) => {
    setValue(event.target.value)
    if(event.target.value) {
      setFocus(true)
    }
    if(onChange) {
      onChange(event)
    }
  }
  const handleBlur = () => {
    setFocus(false)
    setActive(Boolean(value))
  }
  const handleDatePicker = (date:string) => {
    setValue(new Date(date).toISOString())
    setFocus(true)
    setActive(Boolean(date))
    if(onChange) {
      const event = {
        target: {
          name: name,
          value: new Date(date).toISOString()
        }
      }
      onChange(event)
    }
  }
  const isSorted = currentFilter?.sort === name
  const sortDirection = isSorted ? currentFilter.order_by : ''
  const nextSort = sortDirection === 'asc' ? 'desc' : 'asc'
  return (
    <>
    {active ? (
      <>
        {isDate || isBoolean ? (
          <>
          {isDate ? (
          <DatePicker
           key={name}
           ref={inputRef}
           id={name}
           name={name}
           placeholderText='Select date'
           dateFormat="yyyy-MM-dd"
           onChange={handleDatePicker}
           selected={value ? new Date(value) : ''}
           onBlur={handleBlur}
           popperProps={{ strategy: "fixed" }}
           autoComplete="off"
           onKeyDown={filterKeyDown}
           className="dark:bg-black dark:text-white"

          />) : (
            <div className='block'>
              <label className='ml-2'>{label}</label>
              <div className='absolute top-9 bg-white z-50 p-1 border border-gray-300 rounded-md' onKeyDown={filterKeyDown}>
                <div><input type='radio' name={name} value='1' checked={value==='1'} onChange={handleRadioChange} onBlur={handleBlur} /> Yes</div>
                <div><input type='radio' name={name} value='0' checked={value==='0'} onChange={handleRadioChange} onBlur={handleBlur}/> No</div>
              </div>
            </div>
          )}
        </>
        ): (
        <input 
          type="text" className='p-2 border border-gray-300 rounded-md w-full mr-2 dark:bg-black dark:text:white' 
          ref={inputRef}
          autoFocus={active} 
          key={label+name} 
          name={name} 
          placeholder={label} 
          value={value} 
          onKeyDown={filterKeyDown} 
          onChange={handleChange} 
          onBlur={handleBlur}
          autoComplete='off'
        />)}
        {value && !isBoolean && (
          <BackspaceIcon className='-ml-8 w-5 h-5 text-secondary' onClick={()=>clearValue()}/>
        )}
        {active && focus && !isBoolean &&
          <span className='absolute top-10 left-4 bg-white bg-opacity-75 p-1 w-5/8 border border-gray-300 rounded-md dark:bg-black'><PiKeyReturnThin className='inline w-5 h-5' /> to search</span>
        }
        {active && focus && isBoolean &&
          <span className='absolute top-20 left-4 bg-white  p-1 w-5/8 border border-gray-300 rounded-md'><PiKeyReturnThin className='inline w-5 h-5' /> to search</span>
        }
        {!value && !isBoolean  && 
          <FunnelIcon key={name+ 'icon'} className='-ml-6 w-3 h-3' /> 
        }
        
      </>
     ) : (
        <>
          <span onClick={()=>setActive(true)}>{label} 
          <FunnelIcon key={name+ 'icon'} className='ml-2 w-3 h-3 inline'/></span>
        </>
    )}
    {!active && handleSort && (
      <span onClick={()=>handleSort(name, nextSort)} className={`cursor-pointer ml-1 ${sortDirection === '' ? 'opacity-20 hover:opacity-100' : ''} ${isSorted  ? 'text-primary' : ''}`}>
        {(sortDirection === 'asc' || sortDirection === '') ? <FaArrowUp className='inline w-4 h-4' /> : <FaArrowDown className='inline w-4 h-4' />}
      </span>
    )}
    </>
  )
}
