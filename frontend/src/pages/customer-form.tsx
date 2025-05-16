import React, { 
  useState, 
  useEffect,
  ChangeEvent, 
  FormEvent,
  RefObject
} from 'react';

// Add custom styles for PhoneInput in dark mode
const phoneInputStyles = `
  .dark .PhoneInputInput {
    background-color: rgba(55, 65, 81, 0.75) !important;
    color: white !important;
    border-color: rgba(75, 85, 99, 0.6) !important;
  }
  .dark .PhoneInputCountrySelectArrow {
    color: white;
  }
  .dark .PhoneInputCountrySelect {
    color: white;
  }
`;
import { useNavigate } from 'react-router-dom';
import {
  StyleTextfield,
  StyleTextfieldError,
  StyleLabel,
  FormErrorMessage,
  ModalErrorMessage
} from '../lib/formstyles'
import Button from '../components/button';
import { WithAuth } from "../lib/authutils";
import { parseErrors } from '../lib/utilities';
import { FormSkeleton } from '../components/skeletons'
import { getCustomer, fetchCompanies } from '../lib/data/api';
import { upsertCustomer} from '../lib/data/api';
import { Customer } from '../lib/data/definitions'
import toast from 'react-hot-toast';
import { useCurrentUser } from '../lib/customHooks';
import { currentUserCan } from '../lib/utilities';
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { CountryCode, E164Number } from 'libphonenumber-js/core';
import Select from 'react-select';
import { useContext } from 'react';
import { ThemeContext } from '../layouts/layout';

interface FormErrors {
  full_name?: string
  email?: string
  number?: string
  position?: string
  company?: string
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
  const theme = useContext(ThemeContext); // Get current theme
  const defaultCountry = currentUser?.location?.country  as CountryCode | undefined
  const [saveError, setSaveError] = useState('');
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Customer>({
    full_name: '',
    email: '',
    number: '',
    position: '',
    company: '',
    is_active: true
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [companies, setCompanies] = useState<{ name: string }[]>([]);

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

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await fetchCompanies();
        setCompanies(companiesData.map((company: { name: string }) => ({ name: company.name })));
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    loadCompanies();
  }, []);

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

  const handleCompanyChange = (selectedOption: { value: string; label: string } | null) => {
    const value = selectedOption ? selectedOption.value : '';

    setFormData((prevFormData) => ({
      ...prevFormData,
      company: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      company: value !== '' ? '' : 'Company Name is required',
    }));
  };

  //needed a customer handler for phone number
  const handlePhoneInputChange = (value?: E164Number | undefined): void => {
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
    if (Object.keys(newErrors).length >  0) {
      setErrors(newErrors);
      console.error('Form failed validation:', newErrors);
    } else {
      try {
        await upsertCustomer(formData as Customer);
        toast.success('Customer saved. An invitation email has been sent to the customer.');
        if(setRefresh){
          setRefresh(true)
        }
        closeModal(true)
      } catch (error) {
        setErrors(parseErrors(error))
      }    }
    setBtnDisabled(false);
  };
  
  function canSubmit():boolean {
    return !btnDisabled;
  }
  if(loading) return <FormSkeleton numInputs={5}/>;
  if (loadingError) return <ModalErrorMessage message={"Error loading customer"} />;
    // Custom styles for the PhoneInput in dark mode
  const phoneInputDarkModeStyle = `
    .dark .PhoneInputInput {
      background-color: rgba(55, 65, 81, 0.75) !important;
      color: white !important;
      border-color: rgba(75, 85, 99, 0.6) !important;
    }
    .dark .PhoneInputCountrySelectArrow {
      color: white !important;
    }
  `;

  return (
    <div className="w-full flex-1 rounded-lg bg-white/85 dark:bg-gray-800/75 backdrop-blur-md">
      <style>{phoneInputDarkModeStyle}</style>
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
            <div className="relative">                <input
                name="full_name"
                id="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`${StyleTextfield} dark:bg-gray-800/75 dark:text-white dark:border-gray-700/60`}
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
            <div className="relative">                <input
                name="email"
                id="email"
                value={formData.email}
                className={`${StyleTextfield} dark:bg-gray-800/75 dark:text-white dark:border-gray-700/60`}
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
            <div className="relative pr-2">              <PhoneInput
                value={formData.number}
                onChange={handlePhoneInputChange}
                name="number"
                defaultCountry={defaultCountry}
                className={`${StyleTextfield} dark:bg-gray-800/75 dark:text-white dark:border-gray-700/60`}
                id="number"
              />
              {errors.number && <FormErrorMessage message={errors.number} />}
            </div>
          </div>
          <div className="mb-2">
            <label className={StyleLabel} htmlFor="company">
              Company
            </label>
            <div className="relative">              <Select
                className="my-react-select-container"
                classNamePrefix="my-react-select"
                name="companyname"
                id="companyname"
                value={formData.company ? { value: formData.company, label: formData.company } : null}
                onChange={handleCompanyChange}
                options={companies.map((company) => ({ value: company.name, label: company.name }))}
                isClearable                styles={{                  control: (base, state) => ({
                    ...base,
                    backgroundColor: theme === 'dark' 
                      ? 'rgba(55, 65, 81, 0.75)' 
                      : 'rgba(255, 255, 255, 0.85)',
                    borderColor: theme === 'dark'
                      ? state.isFocused ? 'rgba(99, 102, 241, 0.8)' : 'rgba(75, 85, 99, 0.6)'
                      : state.isFocused ? 'rgba(59, 130, 246, 0.5)' : 'rgb(229, 231, 235)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: '0.375rem', // rounded-md
                    boxShadow: state.isFocused 
                      ? theme === 'dark' 
                        ? '0 0 0 1px rgba(99, 102, 241, 0.4)'
                        : '0 0 0 1px rgba(59, 130, 246, 0.3)'
                      : 'none',
                    color: theme === 'dark' ? 'white' : 'black',
                    '&:hover': {
                      borderColor: theme === 'dark'
                        ? 'rgba(99, 102, 241, 0.8)'
                        : 'rgba(59, 130, 246, 0.5)'
                    }
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: theme === 'dark'
                      ? 'rgba(55, 65, 81, 0.9)'
                      : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused 
                      ? theme === 'dark' 
                        ? 'rgba(75, 85, 99, 0.8)' 
                        : 'rgba(243, 244, 246, 0.8)'
                      : 'transparent',
                    color: theme === 'dark' ? 'white' : 'black',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: theme === 'dark' ? 'white' : 'black',
                  }),
                  input: (base) => ({
                    ...base,
                    color: theme === 'dark' ? 'white' : 'black',
                  })
                }}
              />
              {errors.company && <FormErrorMessage message={errors.company} />}
            </div>
          </div>
          
          <div className="mb-2">
            <label className={StyleLabel} htmlFor="position">
              Position
            </label>
            <div className="relative">                <input 
                name="position"
                id="position"
                value={formData.position}
                onChange={handleChange}
                className={`${StyleTextfield} dark:bg-gray-800/75 dark:text-white dark:border-gray-700/60`}
                type="text"
                required
              />
              {errors.position && <FormErrorMessage message={errors.position} />}
            </div>
          </div>
          <div className="mb-2 flex items-center">
            <label htmlFor="is_active" className="label cursor-pointer text-left ml-4  mt-8">              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                className="rounded-xl toggle toggle-accent mr-2 dark:bg-gray-700/75"
                onChange={handleChange}
                checked={formData.is_active ? true : false}
              />
              Active
            </label>
          </div>
        </div>
        <div className="w-full flex justify-center">          <Button 
            className="cursor-pointer bg-primary disabled:bg-gray-light disabled:border-gray-light disabled:shadow-none dark:text-white hover:bg-primary-dark"
            disabled={!canSubmit()}
            type="submit">
              Save
          </Button>
          <Button 
            type="button"
            className="bg-red-500 ml-1 hover:bg-red-600 dark:text-white"
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
