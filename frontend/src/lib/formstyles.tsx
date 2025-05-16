import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface FormErrorMessageProps {
  message: string;
}

export const FormErrorMessage: React.FC<FormErrorMessageProps> = ({ message }) => {
  return (
    <>
      <p className='mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center transition-colors duration-200'>
        <ExclamationCircleIcon className='h-4 w-4 mr-1.5 flex-shrink-0' />
        <span>{message}</span>
      </p>
    </>
  );
};

export const ModalErrorMessage: React.FC<FormErrorMessageProps> = ({ message }) => {
  return (
    <>
      <div className='p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm dark:bg-red-900/20 dark:border-red-800/40 mb-4 transition-colors duration-200'>
        <p className='flex items-center text-red-700 dark:text-red-400 text-lg'>
          <ExclamationCircleIcon className='h-5 w-5 mr-2 flex-shrink-0' />
          <span className="font-medium">{message}</span>
        </p>
      </div>
    </>
  );
};



export const StyleTextfield = 'peer block w-full rounded-md border border-gray-200 py-2.5 px-3 text-sm outline-2 placeholder:text-gray-500 bg-white/85 text-gray-800 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200 dark:bg-gray-800/75 dark:text-white dark:placeholder:text-gray-400 dark:border-gray-700/60 dark:focus:border-primary dark:focus:ring-primary/30';

export const StyleTextfieldError ='peer block w-full rounded-md border-2 border-red-500 py-2.5 px-3 text-sm outline-2 placeholder:text-gray-500 focus:border-red-500 focus:ring focus:ring-red-300/20 text-gray-800 dark:text-white dark:bg-gray-800/75 dark:border-red-500 dark:focus:ring-red-400/20 transition-all duration-200';

export const StyleCheckbox ="h-4 w-4 cursor-pointer rounded border-gray-300 bg-gray-100 text-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-200 dark:bg-gray-800 dark:border-gray-600 dark:focus:ring-primary/30 dark:text-primary";

export const StyleLabel = 'block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200 dark:text-white';








