import { useState, useRef, useEffect } from "react";
import {StyleTextfield} from '../lib/formstyles'
// CSS moved to index.css

interface FilterInputProps {
  searchArray: {label: string, value: string}[] | undefined;
  defaultValue: string[] | string | undefined;
  name: string;
  autoFocus?: boolean;
  multiple?: boolean; // Added multiple prop
  prompt?: string;
  onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FilterInput(props: FilterInputProps) {
  const {searchArray, onSelect, defaultValue, name, autoFocus, multiple = false} = props; // Default multiple to false
  const [filteredArray, setFilteredArray] = useState<{label: string, value: string}[]>([]);
  const [search, setSearch] = useState(multiple ? '' : defaultValue || '');
  const [selectedValues, setSelectedValues] = useState<string[] | string>(defaultValue || []);
  const [kbIndex, setKbIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  //commit tracks if the input has been committed to the onSelect function, which signals the end of a search
  const [commit, setCommit] = useState(true);
  useEffect(() => {
    if (Array.isArray(defaultValue)) {
      setSelectedValues(defaultValue);
      setSearch('');
    } 
  }, []);
  useEffect(() => {
    if (!commit ) {
      setSearch(defaultValue as string);
    }
  }, [props])
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
  
    if (inputValue === '') {
     
  
      // Ensure selectedValues is a string before calling handleRemove
      if (!multiple && selectedValues && selectedValues) {
        handleRemove(selectedValues[0]);
      }
      setKbIndex(-1);
    }
  
    setCommit(false);
    setSearch(inputValue);
  
    const filtered = searchArray?.filter(item =>
      item.label?.toLowerCase().includes(inputValue.toLowerCase()) ||
      item.value?.toLowerCase().includes(inputValue.toLowerCase())
    ) || [];
    setFilteredArray(filtered);
  };

  const handleSelect = (value: string) => {
    if (multiple) {
      if (!selectedValues.includes(value)) {
        const newSelectedValues = [...selectedValues, value];
        setSelectedValues(newSelectedValues);
        propagateChange(newSelectedValues);
      }
      setSearch('');
    } else {
      setSelectedValues([value]);
      setSearch(value);
      propagateChange([value]);
      
    }
    setCommit(true);
    setFilteredArray([]);
    setKbIndex(-1);
  }

  const handleRemove = (value: string) => {
    const newSelectedValues = Array.isArray(selectedValues) ? selectedValues.filter(v => v !== value) : [];
    setSelectedValues(newSelectedValues);
    propagateChange(newSelectedValues);
  }

  const propagateChange = (values: string[]) => {
    const obj = formatValue(values);
    onSelect(obj);
    inputRef.current?.focus();
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchArray) {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          if (filteredArray.length > 0) {
            handleSelect(filteredArray[kbIndex].value);
            setFilteredArray([]);
            setKbIndex(-1);
          }
        }
        if(e.key === "Escape" || e.key === "Tab") {
          setFilteredArray([]);
          setKbIndex(-1);
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          const increment = e.key === "ArrowDown" ? 1 : -1;
          const newKbIndex = Math.max(0, Math.min((kbIndex === -1 ? 0 : kbIndex) + increment, filteredArray.length - 1));
          setKbIndex(newKbIndex);
          document.getElementById(`item-${name}-${newKbIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    return;
  }

  const formatValue = (value: string[]) => {
    const obj = { target: { name: name, value: value } };
    return obj as unknown as React.ChangeEvent<HTMLInputElement>;
  }
  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md filter-container">
        {multiple && Array.isArray(selectedValues) && selectedValues.map((value, index) => (
          <div key={index} className="flex items-center filter-item rounded-md px-3 py-1">
            <span>{value}</span>
            <button onClick={() => handleRemove(value)} className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-400">×</button>
          </div>
        ))}<input
          type="text"
          ref={inputRef}
          placeholder={props.prompt || 'Type to see options'}
          value={search}
          onFocus={() => setKbIndex(-1)}
          className="flex-grow py-1 px-2 outline-none bg-transparent text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
        />
      </div>      {search.length > 0 && filteredArray.length > 0 &&
        <div className="absolute top-full mt-1 z-[1000] w-full filter-dropdown border rounded-md max-h-[200px] overflow-y-auto shadow-lg">
          {filteredArray?.filter(item => !selectedValues.includes(item.value)).map((item, index) => (
            <FilterItem 
              key={index}
              item={item} 
              index={index} 
              kbIndex={kbIndex} 
              name={name} 
              onClick={handleSelect}/>
          ))}
        </div>
      }
    </div>
  )
}

function FilterItem(props: {item: {label: string, value: string}, index: number, kbIndex: number, name: string, onClick: (value: string) => void}) {
  const {item, index, kbIndex, name, onClick} = props;
  const display = item.value !== item.label ? `${item.value} - ${item.label}` : item.value;  return (
    <div 
    onClick={() => onClick(item.value)} 
    id={`item-${name}-${index}`} 
    className={`p-2 cursor-pointer ${kbIndex === index 
      ? 'bg-blue-500/80 text-white dark:bg-indigo-600/80' 
      : 'text-gray-900 dark:text-white hover:bg-blue-500/70 hover:text-white dark:hover:bg-indigo-600/80'}`} 
    key={index}
  >
    {display}
  </div>
  )
}