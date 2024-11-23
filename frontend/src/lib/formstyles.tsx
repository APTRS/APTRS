import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface FormErrorMessageProps {
  message: string;
}

export const FormErrorMessage: React.FC<FormErrorMessageProps> = ({ message }) => {
  return (
    <>
      <p className='text-sm text-red-500'>
        <ExclamationCircleIcon className='my-1 inline h-5 w-5 mr-1 text-red-500' />
        {message}
      </p>
    </>
  );
};

export const ModalErrorMessage: React.FC<FormErrorMessageProps> = ({ message }) => {
  return (
    <>
      <p className='text-lg text-red-500'>
        <ExclamationCircleIcon className='inline w-5 mr-1 text-red-500' />
        {message}
      </p>
    </>
  );
};



export const StyleTextfield ='peer block w-full rounded-md border border-gray-200 py-[9px] pl-2 text-sm outline-2 placeholder:text-gray-500 dark:text-black';
export const StyleTextfieldError ='peer block w-full rounded-md border border-2 border-red-500 py-[9px] pl-2 text-sm outline-2 placeholder:text-gray-500 focus:outline-none dark:text-black';
export const StyleCheckbox ="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2";

export const StyleLabel = 'mb-3 block text-base font-medium font-bold dark:text-gray-light'







