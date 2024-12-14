import React, { 
  useState, 
  useEffect,
  ChangeEvent, 
  FormEvent,
  RefObject
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StyleTextfield,
  StyleTextfieldError,
  StyleLabel,
  FormErrorMessage,
  ModalErrorMessage
} from '../lib/formstyles'
import Button from '../components/button';
import {PasswordDescription, validPassword} from '../components/passwordValidator';
import ShowPasswordButton from '../components/show-password-button';
import { WithAuth } from "../lib/authutils";
import { parseErrors } from '../lib/utilities';
import CompanySelect from '../components/company-select';
import { FormSkeleton } from '../components/skeletons'
import { getCustomer } from '../lib/data/api';
import { upsertCustomer} from '../lib/data/api';
import { Customer } from '../lib/data/definitions'
import toast from 'react-hot-toast';
import { useCurrentUser } from '../lib/customHooks';
import { currentUserCan } from '../lib/utilities';
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { CountryCode } from 'libphonenumber-js/core';
interface FormErrors {
  full_name?: string
  email?: string
  number?: string
  position?: string
  company?: string
  password?: string
  password_check?: string
}
interface CustomerFormProps {
  id?: string; // Make the ID parameter optional
  forwardedRef?: RefObject<HTMLDialogElement> //handle to the modal this is loaded in
  setRefresh?: React.Dispatch<React.SetStateAction<boolean>> //state function to tell parent to reload data
  onClose: () => void;
}
function CustomerForm({ id: customerId, forwardedRef, setRefresh, onClose }: CustomerFormProps): JSX.Element {
  const navigate = useNavigate()
  if(!currentUserCan('Manage Customer')){
    navigate('/access-denied')
  }
  const [id, setId] = useState(customerId)
  const [btnDisabled, setBtnDisabled] = useState(false)
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const currentUser = useCurrentUser()
  const defaultCountry = currentUser?.location?.country  as CountryCode | undefined
  const [saveError, setSaveError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Customer>({
    full_name: '',
    email: '',
    number: '',
    position: '',
    company: '',
    password: '',
    password_check: '',
    is_active: true
  });
  const [errors, setErrors] = useState<FormErrors>({});
  //listen for the escape key and input to form elements
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if(e.key === 'Escape') {
        e.preventDefault()
        closeModal()
        
      //if it's an input element, set editing to true
      } else if(e.target?.toString().includes('HTMLInput')) {
        setEditing(true)
      }
    }
    //set editing flag to true if an input eleent
    function handleInputChange(){
      setEditing(true)
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("change", handleInputChange);
    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("change", handleInputChange);
    };
  }, []);
  useEffect(() => {
    const loadCustomer = async () => {
      if (id) {
        setLoading(true);
        try {
          const customerData = await getCustomer(id) as Customer;
          setFormData(customerData); 
          setLoading(false);         
        } catch (error) {
          console.error("Error fetching customer data:", error);
          setLoadingError(true);
          setLoading(false);
        } 
      }
    };
    loadCustomer();
  }, [id]);
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

  const handleCompanyChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.value; // This will be a string
  
    // Update form data with the single string value
    setFormData((prevFormData) => ({
      ...prevFormData,
      ['company']: value[0],
    }));
    console.log(formData.company);
  
    // Set or clear the error for companyname
    setErrors((prevErrors) => ({
      ...prevErrors,
      company: value !== '' ? '' : 'Company Name is required'
    }));
  };

  //needed a customer handler for phone number
  const handlePhoneInputChange = (value:string) => {
    setEditing(true)
    setFormData({
      ...formData,
      number: value
    })    
  };
  //clean up the data to make sure the next instance is clean
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
    event.preventDefault();
    //form validation
    const newErrors: FormErrors = {};
    if (formData.full_name && formData.full_name.length < 3) {
      newErrors.full_name = 'Name should be at least three characters';
    }
    if(!id){
      if(formData.password != formData.password_check){
        newErrors.password_check = 'Passwords do not match'
      }
      if(!id && !formData.password){
        newErrors.password = 'Password is required'
      }
    }
    if (Object.keys(newErrors).length >  0) {
      setErrors(newErrors);
      console.error('Form failed validation:', newErrors);
    } else {
      try {
        await upsertCustomer(formData as Customer);
        toast.success('Customer saved.')
        if(setRefresh){
          setRefresh(true)
        }
        closeModal(true)
      } catch (error) {
        setErrors(parseErrors(error))
      }
    }
    setBtnDisabled(false);
  }
  function canSubmit():boolean {
    if(id){
      return true;
    }
    return !btnDisabled && validPassword(formData.password) && formData.password === formData.password_check
  }
  if(loading) return <FormSkeleton numInputs={5}/>
  if (loadingError) return <ModalErrorMessage message={"Error loading customer"} />
  return (
    <div className="w-full flex-1 rounded-lg bg-white dark:bg-black">
      <h1 className="mb-3 text-2xl px-4">
        {id ? "Edit" : "Create"} Customer
      </h1>
      {saveError && <FormErrorMessage message={saveError} />}
      
      <form onSubmit={handleSubmit} id="customerForm" method="POST">
        {/* Form inputs */}
        <div className="grid grid-cols-2 gap-2 px-2">
          <div className="mb-2">
            <label className={StyleLabel} htmlFor="name">
              Name
            </label>
            <div className="relative">
              <input
                name="full_name"
                id="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={StyleTextfield}
                type="text"
                required
              />
              {errors.full_name && <p>{errors.full_name}</p>}
            </div>
          </div>
          <div className="mb-2">
            <label className={StyleLabel} htmlFor="email">
              Email
            </label>
            <div className="relative">
              <input
                name="email"
                id="email"
                value={formData.email}
                className={StyleTextfield}
                onChange={handleChange}
                type="text"
                autoComplete='off'
                required
              />
              {errors.email && <p>{errors.email}</p>}
            </div>
          </div>
          <div className="mb-2">
            <label className={StyleLabel} htmlFor="number">
              Phone number
            </label>
            <div className="relative pr-2">
              <PhoneInput
                value={formData.number}
                onChange={handlePhoneInputChange}
                name="number"
                defaultCountry={defaultCountry}
                className={StyleTextfield}
                id="number"
              />
              {errors.number && <FormErrorMessage message={errors.number} />}
            </div>
          </div>
          <div className="mb-2">
            <label className={StyleLabel} htmlFor="company">
              Company
            </label>
            <div className="relative">
             <CompanySelect 
                                      name="companyname"
                                      id="companyname"
                                      defaultValue={''}
                                      value={formData.company || ''} 
                                      changeHandler={handleCompanyChange}
                                      multiple={false}
                                      error={errors.company ? true : false}
                                    />
              {errors.company && <FormErrorMessage message={errors.company} />}
            </div>
          </div>
          
          <div className="mb-2">
            <label className={StyleLabel} htmlFor="position">
              Position
            </label>
            <div className="relative">
              <input
                name="position"
                id="position"
                value={formData.position}
                onChange={handleChange}
                className={StyleTextfield}
                type="text"
                required
              />
              {errors.position && <FormErrorMessage message={errors.position} />}
            </div>
          </div>
          <div className="mb-2 flex items-center">
            <label htmlFor="is_active" className="label cursor-pointer text-left ml-4  mt-8">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                className="rounded-xl toggle toggle-accent mr-2"
                onChange={handleChange}
                checked={formData.is_active ? true : false}
              />
              Active
            </label>
          </div>
        </div>
        {!id &&
          <div className="p-0 w-full mt-4 flex justify-center">
            <fieldset className="w-[300px] form-control rounded-md   p-4 mb-6 border border-lighter" >
              <legend className='text-sm px-1'>Create Password</legend>
              <PasswordDescription password={formData.password} />
              <div className="w-full mt-0">
                <label 
                  htmlFor="password"
                  className='mt-0 mb-2 block text-xs font-medium text-gray-900'
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    id="password"
                    disabled={Boolean(formData.id)}
                    className={formData.password != formData.password_check ? `${StyleTextfieldError}` :`${StyleTextfield}`}
                    onChange={handleChange}
                    type={passwordVisible ? "text" : "password"}
                    required={true}
                    autoComplete="off"
                  />
                  <ShowPasswordButton passwordVisible={passwordVisible} clickHandler={() => setPasswordVisible(!passwordVisible)} />
                  
                </div>
                {errors.password && <FormErrorMessage message={errors.password} />}
                
                
              </div>
              <div className="w-full mt-2">
                <label 
                  htmlFor="password_check"
                  className='mt-0 mb-2 block text-xs font-medium text-gray-900'
                >
                  Repeat password
                </label>
                <div className="relative">
                  <input
                    name="password_check"
                    id="password_check"
                    className={formData.password != formData.password_check ? `${StyleTextfieldError}` :`${StyleTextfield}`}
                    onChange={handleChange}
                    disabled={Boolean(formData.id)}
                    type={passwordVisible ? "text" : "password"}
                    required={true}
                    autoComplete="off"
                  />
                  <ShowPasswordButton passwordVisible={passwordVisible} clickHandler={() => setPasswordVisible(!passwordVisible)} />
                    
                </div>
                {formData.password != formData.password_check && <p className='text-xs mt-2 ml-1 text-red-500'>Passwords should match</p>}
              </div>
            </fieldset>
          </div>
        }
        <div className="w-full flex justify-center">
          <Button 
            className="cursor-pointer bg-primary disabled:bg-gray-light disabled:border-gray-light disabled:shadow-none dark:text-white"
            disabled={!canSubmit()}
            type="submit">
              Save
          </Button>
          <Button 
            type="button"
            className="bg-red-500 ml-1"
            onClick = {() => closeModal()}
            >
              Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default WithAuth(CustomerForm);
