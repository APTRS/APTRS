import { useState, ChangeEvent, useRef } from 'react';
import {  insertProjectRetest } from '../../lib/data/api';
import 'react-datepicker/dist/react-datepicker.css';
import { StyleLabel, StyleTextfield, FormErrorMessage } from '../../lib/formstyles';
import UserSelect from '../../components/user-select';
import { currentUserCan } from '../../lib/utilities';

import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter
} from "@material-tailwind/react";
import { useCurrentUser } from '../../lib/customHooks';
import DatePicker  from 'react-datepicker';

interface RetestFormProps {
  projectId: number;
  onClose: () => void;
  afterSave: () => void;
  open: boolean;
}

export default function RetestForm({ projectId, onClose, afterSave, open }: RetestFormProps) {
  const currentUser = useCurrentUser();
  const startDateRef=useRef()
  const endDateRef=useRef()
  const defaultFormData = {
    project: projectId,
    startdate: '',
    enddate: '',
    owner:[''] 
  }
  const [formData, setFormData] = useState(defaultFormData);
  const [error, setError] = useState('');
  const handleDatePicker = (input: string, value:string): void => {
    // format dates as YYYY-MM-DD
    const formattedDate = value ? new Date(value).toISOString().split('T')[0] : '';
    setFormData((prevFormData: typeof formData) => ({
      ...prevFormData,
      [input]: formattedDate,
    }));
    if(input === 'startdate'){
      setMinEndDate(new Date(value));
    }

  }
  const [minEndDate, setMinEndDate] = useState(new Date());

  const [errors, setErrors] = useState({
    startDate: '',
    endDate: '',
    owner: ''
  });
  const onCancel = () => {
    setFormData(defaultFormData);
    onClose();
  };
  const handleOwnerChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Ensure event.target.value is a string before we split
    const value = event.target.value;
    
    if (typeof value === 'string') {
      setFormData({
        ...formData,
        owner: value.split(',').map(owner => owner.trim())
      });
    } else {
      // Handle the case where the value is not a string (e.g., select options)
      setFormData({
        ...formData,
        owner: Array.isArray(value) ? value : [value] // For multi-selects, ensure it’s an array avoid split , if , in single value
      });
    }
  };
  
  const saveRetest = async () => {
    
    let updatedOwner = formData.owner;
    if (!formData.owner || formData.owner.length === 0 || (formData.owner.length === 1 && formData.owner[0] === '')) {
      updatedOwner = [currentUser?.username || ''];
    }
    setFormData({ ...formData, owner: updatedOwner });
    if (!formData.startdate) {
      setErrors(prevErrors => ({ ...prevErrors, startDate: 'Start date is required' }));
      return;
    } else {
      setErrors(prevErrors => ({ ...prevErrors, startDate: '' }));
    }

    if (!formData.enddate) {
      setErrors(prevErrors => ({ ...prevErrors, endDate: 'End date is required' }));
      return;
    } else {
      setErrors(prevErrors => ({ ...prevErrors, endDate: '' }));
    }
    if (new Date(formData.enddate) < new Date(formData.startdate)) {
      setErrors(prevErrors => ({ ...prevErrors, endDate: 'End date cannot be earlier than start date' }));
      return;
    } else {
      setErrors(prevErrors => ({ ...prevErrors, endDate: '' }));
    }
    const formattedFormData = {
      ...formData,
      owner: updatedOwner
    };
    try {
      await insertProjectRetest(formattedFormData);
      afterSave();
      onClose();
    } catch (error) {
      setError("Error saving retest");
    }
  };
  
  const userNotSet = () => formData.owner.length === 0 || formData.owner.length === 1 && formData.owner[0] === '';
  return (
          <Dialog open={open} handler={onClose} size='sm'className='dark:bg-black dark:text-white'>
            <DialogHeader className='dark:bg-black dark:text-white'>New Retest</DialogHeader>
            <DialogBody>
                {currentUserCan('Manage Projects') && (
                  <>
                    <label className={StyleLabel}>
                      Retest Owner
                      {userNotSet() &&
                        <span className='block text-sm'>
                          Will be assigned to you unless you select different users.
                        </span>
                      }
                    </label>
                    <div className='max-w-md'>
                      <UserSelect
                        name='owner'
                        multiple={true}
                        value={formData.owner.join(', ')}
                        changeHandler={handleOwnerChange}
                        autoFocus
                        required={true}
                      />
                    </div>
                  </>
                )}
                <div className="flex min-w-lg mb-2">
                  {error && <FormErrorMessage message={error} />}
                  <div className="w-1/2">
                    <label className={StyleLabel}>Start Date</label>
                      
                      <DatePicker
                        id="startdate"
                        name="startdate"
                        ref={startDateRef}
                        placeholderText='Select date'
                        className={StyleTextfield}
                        dateFormat="yyyy-MM-dd"
                        selectsStart
                        autoComplete="off"
                        onChange={(date:string) => handleDatePicker('startdate', date)}
                        selected={formData.startdate ? new Date(formData.startdate) : ''}
                      />
                      {errors.startDate && <FormErrorMessage message={errors.startDate} />}
                  
                  </div>
                  <div className='ml-4 w-1/2'>
                    <label className={StyleLabel}>End Date</label>
                    <DatePicker
                      id='enddate'
                      name='enddate'
                      ref={endDateRef}
                      placeholderText='Select date'
                      dateFormat="yyyy-MM-dd"
                      selectsEnd
                      autoComplete="off"
                      onChange={(date: string) => handleDatePicker('enddate', date)}
                      selected={formData.enddate ? new Date(formData.enddate) : ''}
                      className={StyleTextfield}
                      required={true}
                      minDate={minEndDate}
                    />
                    {errors.endDate && <FormErrorMessage message={errors.endDate} />}
                </div>
                
              </div>
            </DialogBody>
            <DialogFooter>
              <button className='bg-primary rounded-md text-white mx-1 p-2'  onClick={saveRetest}>Save</button>
              <button className='bg-secondary rounded-md text-white mx-1 p-2'  onClick={onCancel}>Cancel</button>
            </DialogFooter>
          </Dialog>
  )
}



