import React, { useEffect, useState } from "react";
import { fetchCWE } from "../lib/data/api";
import FilterInput from '../components/filterInput';
import { SingleInputSkeleton } from './skeletons';
import { sortByPropertyName } from '../lib/utilities';

interface CWESelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  value: any;
  changeHandler: React.ChangeEventHandler | ((e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void);
  error?: boolean;
  required?: boolean;
  autoFocus?: boolean;
}

interface CWE {
  name: string;
  description: string;
}

export default function CWESelect(props: React.PropsWithChildren<CWESelectProps>) {
  const [cwes, setCWEs] = useState<{ name: string }[] | undefined>();

  useEffect(() => {
    const loadCwes = async () => {
      try {
        // Fetch CWE data
        const response = await fetchCWE();
        // Directly use response as it is an array
        if (Array.isArray(response)) {
          const sortedCwes = sortByPropertyName(response, 'name');
          setCWEs(sortedCwes);
        } else {
          console.error("CWE data is not an array:", response);
        }
      } catch (error) {
        console.error("Error fetching CWE list:", error);
      }
    };

    loadCwes();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    props.changeHandler && props.changeHandler(event);
  };

  // Render skeleton loader if data is still being fetched
  if (typeof cwes === "undefined") {
    return props.multiple ? (
      <>
        <SingleInputSkeleton />
        <SingleInputSkeleton />
      </>
    ) : (
      <SingleInputSkeleton />
    );
  }

  return (
    <div>
      <FilterInput
        name={props.name}
        defaultValue={props.value}
        autoFocus={props.autoFocus}
        multiple={props.multiple}
        prompt="Type to see CWEs"
        searchArray={cwes.map((cwe) => ({
          label: cwe.name, // Display CWE name in dropdown
          value: cwe.name, // Use CWE name as the value
        }))}
        onSelect={handleChange}
      />
    </div>
  );
}
