import React, { 
  useState, 
  useEffect,
  ChangeEvent, 
  FormEvent,
  RefObject
} from 'react';

import {
  StyleTextfield,
  StyleTextfieldError,
  StyleLabel,
  FormErrorMessage,
  ModalErrorMessage
} from '../lib/formstyles'
import PageTitle from '../components/page-title';
import { PasswordDescription } from '../components/passwordValidator'
import { WithAuth } from "../lib/authutils";
import Button from '../components/button';
import ShowPasswordButton from '../components/show-password-button';
import { FormSkeleton } from '../components/skeletons'
import { getUser, fetchPermissionGroups } from '../lib/data/api';
import { upsertUser } from '../lib/data/api';
import { useCurrentUser } from '../lib/customHooks';
import { User } from '../lib/data/definitions'
import toast from 'react-hot-toast';
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { phoneRegex, emailRegex, usernameRegex, parseErrors } from '../lib/utilities';
import { currentUserCan } from '../lib/utilities'
import { useNavigate } from 'react-router-dom';
import { CountryCode, E164Number } from 'libphonenumber-js/core';
import Select, { MultiValue } from 'react-select';

interface FormErrors {
  username?: string
  email?: string
  full_name?: string
  position?: string
  number?: string
  groups?: string
  password?: string
  password_check?: string
}

interface UserFormProps {
  id?: string;
  forwardedRef?: RefObject<HTMLDialogElement> //handle to the modal this is loaded in
  setRefresh?: React.Dispatch<React.SetStateAction<boolean>> //state function to tell parent to reload data
  onClose: () => void;
}
function UserForm({ id: userId, forwardedRef, setRefresh, onClose }: UserFormProps): JSX.Element {
  
  const [id, setId] = useState(userId)
  const [btnDisabled, setBtnDisabled] = useState(false)
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editing, setEditing] = useState(false)
  const currentUser = useCurrentUser()
  
  const navigate = useNavigate()
  if(!currentUserCan('Manage Users')){
    navigate('/access-denied')
  }
  //extend User type to support password fields
  type UserForm = User & {
    password?: string;
    password_check?: string;
  };
  const [formData, setFormData] = useState<UserForm>({
    id: id ? Number(id) : undefined,
    username: '',
    full_name: '',
    email: '',
    is_staff: true,
    is_active: false,
    is_superuser: false,
    number: '',
    company: currentUser?.company,
    position: '',
    password: '',
    password_check: '',
    groups: [],
  });

  //used in phone number input
  const defaultCountry = currentUser?.location?.country as CountryCode | undefined
  const [errors, setErrors] = useState<FormErrors>({});
  const [permissionGroups, setPermissionGroups] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const loadPermissionGroups = async () => {
      try {
        const data = await fetchPermissionGroups();
        setPermissionGroups(data.map((group: { name: string }) => ({ value: group.name, label: group.name })));
      } catch (error) {
        console.error('Error fetching permission groups:', error);
      }
    };

    loadPermissionGroups();
  }, []);

  function passwordMismatch():boolean {
    if(!formData.password && !formData.password_check){
      return false
    }
    if(formData.password != formData.password_check){
      return true
    }
    return false
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if(e.key == 'Escape') {
        e.preventDefault()
        if(editing){
          if(!confirm('Quit without saving?')){
            return null;
          }
        } 
        closeModal()
      //if it's an input element, set editing to true
      } else if(e.target?.toString().includes('HTMLInput')) {
        if(!editing){
          setEditing(true)
        }
      }
    }
    //set flag to true if an input eleent
    function handleInputChange(){
      if(!editing){
        setEditing(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("change", handleInputChange);

    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("change", handleInputChange);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        setLoading(true);
        try {
          const userData = await getUser(id) as User;
          setFormData(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setLoadingError(true);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [id]);
  //needed a customer handler for phone number
  const handlePhoneInputChange = (value?: E164Number | undefined): void => {
    setFormData({
      ...formData,
      number:value
    })    
  };
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, checked, options } = event.target as HTMLInputElement & HTMLSelectElement;
    setEditing(true)
    // Check the type of input - checkboxes and selects don't have a value attribute
    let inputValue: any;
    if ((event.target as HTMLInputElement).type  === 'checkbox') {
      inputValue = checked;
    } else if ((event.target as HTMLInputElement).type === 'select-multiple') {
      inputValue = Array.from(options).filter(option => option.selected).map(option => option.value);
    } else {
      inputValue = value;
    }
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: inputValue,
    }));
    
  };
  const handlePermissionGroupChange = (newValue: MultiValue<{ value: string; label: string }>, actionMeta: any) => {
    const selectedValues = newValue.map(option => option.value);
    setFormData((prevFormData) => ({
      ...prevFormData,
      groups: selectedValues,
    }));
  };
  const [passwordVisible, setPasswordVisible] = useState(false)
  const closeModal = (force:boolean = false) =>  {
    if(editing && !force){
      if(!confirm('Quit without saving?')){
        return null;
      }
    }
    setId('')
    if(forwardedRef?.current ) {
      forwardedRef.current.close()
    }
    onClose()
  }
  const handleSubmit = async(event: FormEvent<HTMLFormElement>) => {
    setBtnDisabled(true);
    setErrors({})
    event.preventDefault();
    
    // FORM VALIDATION
    const newErrors: FormErrors = {};
    if (!emailRegex.test(String(formData?.email))) {
      newErrors.email = 'Enter a valid email address';
    }
    // const phoneRegex = /^(\+[1-9]\d{0,2}-)?\d{1,14}$/;
    if(formData?.number){
      if (!phoneRegex.test(String(formData?.number))) {
        newErrors.number = 'Enter a valid phone number';
      }
    }
    if (!usernameRegex.test(String(formData?.username))) {
      newErrors.username = 'Username must be alphanumeric'
    }
    if(passwordMismatch()){
      newErrors.password_check = 'Passwords do not match'
    }
    if(!id && !formData.password){
      newErrors.password = 'Password is required'
    }
    if(!Array.isArray(formData.groups) || formData.groups?.length < 1){
      newErrors.groups = 'Select at least on group'
    }
    if (Object.keys(newErrors).length >  0) {
      setErrors(newErrors);
      console.error('Form failed validation:', newErrors);
    } else {
      try {
        await upsertUser(formData as User);
        toast.success('User saved.')
        setEditing(false)
        if(setRefresh){
          setRefresh(true)
        }
        closeModal(true)
        // Handle success (e.g., show success message, redirect, etc.)
      } catch (error) {
        console.error('Error submitting form:', error);
        setErrors(parseErrors(error))
        setSaveError(String(error))
        // Handle error (e.g., show error message)
      } 
    }
    setBtnDisabled(false);
    
  }
  
  if(loading) return <FormSkeleton numInputs={6}/>
  if (loadingError) return <ModalErrorMessage message={"Error loading user"} />
  return (
    <div className="max-w-lg flex-1 rounded-xl bg-white shadow-md dark:bg-gray-800 dark:shadow-gray-900 dark:text-white transition-colors duration-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <PageTitle title={id ? "Edit User" : "Create User"} />
        {saveError && <FormErrorMessage message={saveError} />}
      </div>
      
      <form onSubmit={handleSubmit} id="projectForm" method="POST" className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-5"> 
          <div>
            <div className="w-full mb-7">
              <label 
                htmlFor="full_name"
                className={`${StyleLabel} text-sm font-medium`}>
                Full name
              </label>
              <div className="relative">
                <input
                  name="full_name"
                  id="full_name"
                  className={`${StyleTextfield} focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200`}
                  value={formData.full_name}
                  onChange={handleChange}
                  type="text"
                  required={true}
                  placeholder="Enter full name"
                />
                {errors.full_name && <FormErrorMessage message={errors.full_name} />}
              </div>
            </div>
        
            <div className="w-full mb-5">
              <label 
                className={`${StyleLabel} text-sm font-medium`}
                htmlFor="email">
                  Email
              </label>
              <div className="relative">
                <input
                  name="email"
                  id="email"
                  className={`${StyleTextfield} focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200`}
                  value={formData.email}
                  onChange={handleChange}
                  type="text"
                  required={true}
                  placeholder="user@example.com"
                />
                {errors.email && <FormErrorMessage message={errors.email} />}
              </div>
            </div>
            
            <div className="w-full mb-5">
              <label 
                className={`${StyleLabel} text-sm font-medium`}
                htmlFor="username">
                  Username
              </label>
              <div className="relative">
                <input
                  name="username"
                  id="username"
                  className={`${StyleTextfield} focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200`}
                  value={formData.username}
                  onChange={handleChange}
                  type="text"
                  maxLength={20}
                  required={true}
                  placeholder="Username"
                />
                {errors.username && <FormErrorMessage message={errors.username} />}
              </div>
            </div>
          </div>
          
          <div>
            <div className="w-full mb-5">
              <label 
                htmlFor="number"
                className={`${StyleLabel} text-sm font-medium`}>
                Phone number
              </label>
              <div className="relative">
                <PhoneInput
                  value={formData.number}
                  onChange={handlePhoneInputChange}
                  name="number"
                  defaultCountry={defaultCountry}
                  className={`${StyleTextfield} focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200 pr-2`}
                  id="number"
                  required={true}
                />
                {errors.number && <FormErrorMessage message={errors.number} />}
              </div>
            </div>
            
            <div className="w-full mb-5">
              <label 
                htmlFor="position"
                className={`${StyleLabel} text-sm font-medium`}>
                Position
              </label>
              <div className="relative">
                <input
                  name="position"
                  id="position"
                  className={`${StyleTextfield} focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200`}
                  value={formData.position}
                  onChange={handleChange}
                  type="text"
                  placeholder="Job title"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-5 mt-3">
          <fieldset className="form-control rounded-lg flex flex-col w-full md:w-1/2 space-y-4 p-5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <legend className="px-2 text-sm font-medium text-gray-700 dark:text-gray-300">User Status</legend>
            <div className="flex items-center">
              <label 
                htmlFor="is_active"
                className="flex items-center cursor-pointer text-left"
              >
                <input type="checkbox" 
                  name="is_active" 
                  id="is_active"
                  className="rounded-xl toggle toggle-accent mr-3 bg-primary"
                  onChange={handleChange}
                  checked={formData.is_active ? true : false} 
                  disabled={currentUser?.username == formData.username}
                />
                {currentUser?.username === formData.username ?
                  <div className="tooltip tooltip-right" data-tip="You cannot disable for your own account"> 
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span> 
                  </div> :
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span> 
                }
              </label>  
            </div>
            
            <div className="flex items-center">
              <label 
                htmlFor="is_superuser"
                className="flex items-center cursor-pointer"
              >
                <input type="checkbox" 
                  name="is_superuser"
                  id="is_superuser"
                  className="rounded-xl toggle toggle-accent mr-3 bg-primary"
                  onChange={handleChange}
                  checked={formData.is_superuser ? true : false} 
                  disabled={currentUser?.username == formData.username || currentUser?.isAdmin == false}
                />
                {currentUser?.username === formData.username ?
                  <div className="tooltip tooltip-right" data-tip="You cannot disable for your own account"> 
                    <span className="text-sm text-gray-700 dark:text-gray-300">Administrator</span> 
                  </div> :
                  <span className="text-sm text-gray-700 dark:text-gray-300">Administrator</span> 
                }
              </label>
            </div>
            
            <div className="relative pt-1">
              <label 
                htmlFor="groups"
                className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Permission Groups
              </label>
              <Select
                name="groups"
                id="groups"
                isMulti
                value={(formData.groups ?? []).map((group) => ({ value: group, label: group }))}
                onChange={handlePermissionGroupChange}
                options={permissionGroups}
                isClearable
                className="my-react-select-container"
                classNamePrefix="my-react-select"
              />
              {errors.groups && <FormErrorMessage message={errors.groups} />}
            </div>
          </fieldset>
          
          <div className="w-full md:w-1/2">
            <fieldset className="form-control rounded-lg h-full space-y-4 p-5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <legend className="px-2 text-sm font-medium text-gray-700 dark:text-gray-300">Password {formData.id ? '(optional)' : ''}</legend>
              <PasswordDescription password={formData.password} />
              
              <div className="w-full">
                <label 
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  Password 
                </label>
                <div className="relative">
                  <input
                    name="password"
                    id="password"
                    className={passwordMismatch() ? 
                      `${StyleTextfieldError} dark:bg-gray-800 dark:text-white dark:border-red-500` : 
                      `${StyleTextfield} focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200`
                    }
                    onChange={handleChange}
                    type={passwordVisible ? "text" : "password"}
                    required={id ? false : true}
                    placeholder={id ? "Leave blank to keep current" : "Enter password"}
                  />
                  <ShowPasswordButton passwordVisible={passwordVisible} clickHandler={()=> setPasswordVisible(!passwordVisible)} />
                </div>
                {errors.password && <FormErrorMessage message={errors.password} />}
              </div>
              
              <div className="w-full">
                <label 
                  htmlFor="password_check"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  Repeat password
                </label>
                <div className="relative">
                  <input
                    name="password_check"
                    id="password_check"
                    className={passwordMismatch() ? 
                      `${StyleTextfieldError} dark:bg-gray-800 dark:text-white dark:border-red-500` : 
                      `${StyleTextfield} focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200`
                    }
                    onChange={handleChange}
                    type={passwordVisible ? "text" : "password"}
                    required={id ? false : true}
                    placeholder={id ? "Leave blank to keep current" : "Confirm password"}
                  />
                  <ShowPasswordButton passwordVisible={passwordVisible} clickHandler={()=> setPasswordVisible(!passwordVisible)} />
                </div>
                {(formData.password || formData.password_check) && (formData.password != formData.password_check) && 
                  <p className="text-xs mt-2 text-red-500">Passwords should match</p>
                }
              </div>
            </fieldset>
          </div>
        </div>
        
        <div className="flex justify-start mt-6 gap-3">
          <button 
            className="bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white px-5 py-2 rounded-md disabled:cursor-not-allowed shadow-sm hover:shadow transition-all duration-200"
            disabled={btnDisabled}
            type="submit">
              Save
          </button>
          <Button 
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md shadow-sm hover:shadow transition-all duration-200 ml-1"
            disabled={btnDisabled}
            onClick={() => closeModal()}>
              Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}


export default WithAuth(UserForm);
