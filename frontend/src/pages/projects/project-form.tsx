import  { 
  useState, 
  useEffect,
  ChangeEvent, 
  FormEvent
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import {
  StyleTextfield,
  StyleLabel,
  FormErrorMessage,
  ModalErrorMessage
} from '../../lib/formstyles'
import PageTitle from '../../components/page-title';
import CKWrapper from '../../components/ckwrapper';
import CompanySelect from '../../components/company-select';
import UserSelect from '../../components/user-select';
import { WithAuth } from "../../lib/authutils";
import { currentUserCan } from '../../lib/utilities'
import Button from '../../components/button';
import { FormSkeleton } from '../../components/skeletons'
import { getProject } from '../../lib/data/api';
import { upsertProject, fetchProjectTypes, fetchReportStandards } from '../../lib/data/api';
import { Project } from '../../lib/data/definitions'
import { isAfter } from 'date-fns'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useCurrentUser } from '../../lib/customHooks';

// Custom styles for DatePicker and dark mode
// Custom CSS styles have been consolidated in index.css

interface FormErrors {
  name?: string
  description?: string
  status?: string
  projecttype?: string
  startdate?: string
  enddate?: string
  testingtype?: string
  projectexception?: string
  companyname?: string
  owner?: string  
}
 
interface ProjectFormProps {
  id?: string; // Make the ID parameter optional
}
interface ProjectType {
  id: number
  name: string
}

interface ReportStandard {
  id: number
  name: string
}

function ProjectForm({ id: externalId }: ProjectFormProps): JSX.Element {
  const params = useParams()
  const { id: routeId } = params;
  const id = externalId || routeId; // Use externalId if provided, otherwise use routeId
  const [btnDisabled, setBtnDisabled] = useState(false)
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const currentUser = useCurrentUser()
  const [editing, setEditing] = useState(false)
  const [saveError, setSaveError] = useState('');
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [standards, setStandards] = useState<ReportStandard[]>([]);
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const [formData, setFormData] = useState<Project>({
    name: '',
    description: '',
    status: '',
    projecttype: '',
    startdate: '',
    enddate: '',
    testingtype: '',
    projectexception: '',
    companyname: '',
    owner: [currentUser?.username as string],
    standard: [], // Added standard field
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const navigate = useNavigate()
  if(!currentUserCan('Manage Projects')){
    navigate('/access-denied')
  }
  useEffect(() => {
    const loadData = async () => {    
      if (id) {
        setLoading(true);
        try {
          const projectData = await getProject(id) as Project;
          setFormData(projectData);
          setSelectedStandards(projectData.standard || []); // Populate selectedStandards with the standard field from API response
        } catch (error) {
          console.error("Error fetching project data:", error);
          setLoadingError(true);
          // Handle error fetching data
        } finally {
          setLoading(false);
        }
      }
      const data = await fetchProjectTypes();
      const sortedData = data.sort((a: ProjectType, b: ProjectType) => a.name.localeCompare(b.name));
      setProjectTypes(sortedData);      
    };
    loadData();
  }, [id]);

  useEffect(() => {
    const loadStandards = async () => {
      try {
        const result = await fetchReportStandards();
        setStandards(result);
      } catch (err) {
        console.error('Error fetching standards:', err);
      }
    };
    loadStandards();
  }, []);

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
  }, []);  // Shared Select component styles that respond to theme changes
  const getSelectStyles = () => ({
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: theme === 'dark' 
        ? 'rgba(55, 65, 81, 0.75)' 
        : 'rgba(255, 255, 255, 0.85)',
      borderColor: theme === 'dark'
        ? state.isFocused ? 'rgba(99, 102, 241, 0.8)' : 'rgba(75, 85, 99, 0.6)'
        : state.isFocused ? 'rgba(59, 130, 246, 0.5)' : 'rgb(209, 213, 219)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '0.375rem',
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
    menu: (base: any) => ({
      ...base,
      backgroundColor: theme === 'dark'
        ? 'rgba(55, 65, 81, 0.9)'
        : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(4px)',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused 
        ? theme === 'dark'
          ? 'rgba(75, 85, 99, 0.8)' 
          : 'rgba(243, 244, 246, 0.8)'
        : 'transparent',
      color: theme === 'dark' ? 'white' : 'black',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: theme === 'dark' ? 'white' : 'black',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: theme === 'dark'
        ? 'rgba(75, 85, 99, 0.8)'
        : 'rgba(243, 244, 246, 0.8)',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: theme === 'dark' ? 'white' : 'black',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: theme === 'dark' ? 'white' : 'black',
      '&:hover': {
        backgroundColor: theme === 'dark' 
          ? 'rgba(239, 68, 68, 0.8)' 
          : 'rgba(252, 165, 165, 0.8)',
        color: theme === 'dark' ? 'white' : 'black',
      },
    }),
  });

  const handleStandardChange = (selectedOptions: any) => {
    const selectedValues = selectedOptions.map((option: any) => option.value);
    setFormData((prevFormData) => ({
      ...prevFormData,
      standard: selectedValues,
    }));
  };

  const handleCKchange = (name:string, value:string):void => {
    setEditing(true)
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  }
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleCompanyChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.value; // This will be a string
  
    // Update form data with the single string value
    setFormData((prevFormData) => ({
      ...prevFormData,
      ['companyname']: value[0],
    }));
    console.log(formData.companyname);
  
    // Set or clear the error for companyname
    setErrors((prevErrors) => ({
      ...prevErrors,
      companyname: value !== '' ? '' : 'Company Name is required'
    }));
  };

  const handleOwnerChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  
  const handleDatePicker = (input: string, value:string): void => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [input]: value,
    }));
  }
    const handleCancel = (event:any) =>  {
    event.preventDefault()
    if(editing){
      if(!confirm('Quit without saving?')){
        return;
      }
    } 
    navigate(-1)
  };  
  
  const handleSubmit = async(event: FormEvent<HTMLFormElement>) => {
    setBtnDisabled(true);
    event.preventDefault();
    const newErrors: FormErrors = {};
    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Name should be at least three characters';
    }
    if (!formData.projecttype || formData.projecttype === '') {
      newErrors.projecttype = 'Project Type is required';
    }
    //convert dates if necessary
    const formatDate = (value:any) => {
      return new Date(value).toLocaleDateString('en-CA'); // 'en-CA' is the locale for Canada, which uses the 'yyyy-MM-dd' format:any
    }
    if(formData.startdate){
      formData.startdate = formatDate(formData.startdate)
    }
    if(formData.enddate){
      formData.enddate = formatDate(formData.enddate)
    }
    if(formData.startdate && formData.enddate && isAfter(new Date(formData.startdate), new Date(formData.enddate))){
      newErrors.enddate = 'End date must be after start date'
    }
    if (!formData.description || formData.description === '') {
      newErrors.description = 'Please enter a description';
    }
    if (!formData.owner || formData.owner.length === 0 || formData.owner[0] === '') {
      newErrors.owner = 'Project Owner is required';
    }    if (!formData.companyname || formData.companyname === '') {
      newErrors.companyname = 'Company is required';
    }
    if (!formData.projecttype || formData.projecttype === '') {
      newErrors.projecttype = 'Project Type is required';
    }
    
    
    if (Object.keys(newErrors).length >  0) {
      setErrors(newErrors);
      console.error('Form failed validation:', newErrors);
    } else {
      try {
        const result = await upsertProject(formData as Project);
        navigate('/projects')
      } catch (error) {
        console.error('Error submitting form:', error);
        setSaveError(String(error))
      }
    }
    setBtnDisabled(false);
  }
  if(loading) return <FormSkeleton numInputs={5}/>
  if (loadingError) return <ModalErrorMessage message={"Error loading project"} />
  return (
    <div className="flex-1 rounded-lg bg-white/85 dark:bg-gray-800/75 backdrop-blur-md shadow-lg border border-gray-200/60 dark:border-gray-700/60 px-6 pb-4 pt-8">
        {saveError && <FormErrorMessage message={saveError} />}
        <form action="" onSubmit={handleSubmit} id="projectForm" method="POST" className="space-y-6">
          <PageTitle title={id ? "Edit Project" : "Create Project"} />
          
          {/* Project Basic Information Section */}          <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
                {/* Row 1: Name and Type */}
                <div className='flex flex-col sm:flex-row gap-4'>
                  <div className="w-full sm:w-1/2">
                    <label
                      className={`${StyleLabel} inline-block mb-2`}
                      htmlFor="name"
                    >
                      Name <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="relative">                    
                      <input
                        name="name"
                        id="name"
                        value = {formData.name || ''}
                        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-3 text-sm outline-2 placeholder:text-gray-500 bg-white/85 text-black dark:bg-gray-800/75 dark:text-white dark:placeholder:text-gray-400 dark:border-gray-700/60 transition-all focus:border-primary dark:focus:border-primary focus:outline-none"
                        onChange={handleChange}
                        type="text"
                        placeholder="Enter project name"
                        required
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>} 
                    </div>
                  </div>  
                  <div className="w-full sm:w-1/2">
                    <label
                      className={`${StyleLabel} inline-block mb-2`}
                      htmlFor="projecttype"
                    >
                      Type <span className="text-red-500">*</span>
                    </label>                  
                    <div className="relative">                    
                      <Select
                        name="projecttype"
                        id="projecttype"
                        value={formData.projecttype ? { value: formData.projecttype, label: formData.projecttype } : null}
                        onChange={(selected) => {
                          const event = {
                            target: {
                              name: 'projecttype',
                              value: selected ? selected.value : ''
                            }
                          } as React.ChangeEvent<HTMLInputElement>;
                          handleChange(event);
                          
                          // Clear the error when a valid value is selected
                          if (selected) {
                            setErrors(prev => ({...prev, projecttype: undefined}));
                          }
                        }}
                        options={projectTypes.map((type) => ({ value: type.name, label: type.name }))}
                        placeholder="Select a project type"
                        className="my-react-select-container"
                        classNamePrefix="my-react-select"
                        styles={getSelectStyles()}
                        required
                      />
                      {errors.projecttype && <p className="mt-1 text-sm text-red-500">{errors.projecttype}</p>} 
                    </div>
                  </div>
                </div>

                {/* Row 2: Testing Type and Status */}
                <div className='flex flex-col sm:flex-row gap-4'>
                  <div className="w-full sm:w-1/2">
                    <label
                      className={`${StyleLabel} inline-block mb-2`}
                      htmlFor="testingtype"
                    >
                      Testing Type
                    </label>
                    <div className="relative">                    
                      <input                      
                        name="testingtype"
                        id="testingtype"
                        value = {formData.testingtype || ''}
                        placeholder='Black Box, White Box, etc.'
                        onChange={handleChange}
                        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-3 text-sm outline-2 placeholder:text-gray-500 bg-white/85 text-black dark:bg-gray-800/75 dark:text-white dark:placeholder:text-gray-400 dark:border-gray-700/60 transition-all focus:border-primary dark:focus:border-primary focus:outline-none"
                        type="text"
                      />
                      {errors.testingtype && <p className="mt-1 text-sm text-red-500">{errors.testingtype}</p>} 
                    </div>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label
                      className={`${StyleLabel} inline-block mb-2`}
                      htmlFor="status"
                    >
                      Status 
                    </label>
                    <div className="relative">                    
                      <input
                        name="status"
                        id="status"
                        value = {formData.status || ''}
                        placeholder='Auto-calculated from date'
                        onChange={handleChange}
                        className="peer block w-full rounded-md border border-gray-300 py-[9px] pl-3 text-sm outline-2 placeholder:text-gray-500 bg-gray-100/50 text-gray-500 dark:bg-gray-700/75 dark:text-gray-400 dark:border-gray-700/60 cursor-not-allowed"
                        type="text"
                        disabled                      
                      />
                      {formData.status && <span className='text-xs italic ml-2 text-gray-500 dark:text-gray-400'>Auto-calculated from date</span>}
                    </div>
                  </div>
                </div>
                
                {/* Row 3: Start Date and End Date */}
                <div className='flex flex-col sm:flex-row gap-4'>
                  <div className="w-full sm:w-1/2">
                    <label
                      className={`${StyleLabel} inline-block mb-2`}
                      htmlFor="startdate"
                    >
                      Start Date <span className="text-red-500">*</span>
                    </label>                  
                    <DatePicker
                      id="startdate"
                      name="startdate"
                      autoComplete="off"
                      className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-3 text-sm outline-2 placeholder:text-gray-500 bg-white/85 text-black dark:bg-gray-800/75 dark:text-white dark:placeholder:text-gray-400 dark:border-gray-700/60 transition-all focus:border-primary dark:focus:border-primary focus:outline-none"
                      placeholderText='Select date'
                      dateFormat="yyyy-MM-dd"
                      onChange={(date:string) => handleDatePicker('startdate', date)}
                      selected={formData.startdate ? new Date(formData.startdate) : ''}
                      required
                    />
                    {errors.startdate && <p className="mt-1 text-sm text-red-500">{errors.startdate}</p>} 
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label
                      className={`${StyleLabel} inline-block mb-2`}
                      htmlFor="enddate"
                    >
                      End Date <span className="text-red-500">*</span>
                    </label>                  
                    <DatePicker   
                      id="enddate"
                      name="enddate"
                      autoComplete="off"
                      className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-3 text-sm outline-2 placeholder:text-gray-500 bg-white/85 text-black dark:bg-gray-800/75 dark:text-white dark:placeholder:text-gray-400 dark:border-gray-700/60 transition-all focus:border-primary dark:focus:border-primary focus:outline-none"
                      minDate={formData.startdate ? new Date(formData.startdate) : null}
                      placeholderText='Select date'
                      dateFormat="yyyy-MM-dd"
                      onChange={(date:string) => handleDatePicker('enddate', date)}
                      selected={formData.enddate ? new Date(formData.enddate) : ''}
                      required
                    />
                    {errors.enddate && <p className="mt-1 text-sm text-red-500">{errors.enddate}</p>} 
                  </div>
                </div>
                
                {/* Row 4: Company and Project Owner */}
                <div className='flex flex-col sm:flex-row gap-4'>
                  <div className="w-full sm:w-1/2">
                    <label
                      className={`${StyleLabel} inline-block mb-2`}
                      htmlFor="companyname"
                    >
                      Company <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      {/* only show company select for new objects */}
                      {!formData.id  &&
                        <CompanySelect 
                          name="companyname"
                          id="companyname"
                          defaultValue={''}
                          value={formData.companyname || ''} 
                          changeHandler={handleCompanyChange}
                          multiple={false}
                          error={errors.companyname ? true : false}
                        />
                      }
                      {formData.id &&
                        <div className='p-2 bg-gray-100/50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-700/60'>
                          {formData.companyname}
                        </div>
                      }
                      {errors.companyname && <p className="mt-1 text-sm text-red-500">{errors.companyname}</p>} 
                    </div>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label
                      className={`${StyleLabel} inline-block mb-2`}
                      htmlFor="owner"
                    >
                      Project Owner <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      {(currentUserCan('Manage Projects') && currentUserCan('Assign Projects')) ? (
                        <UserSelect
                          name='owner'
                          defaultValue={formData.owner}
                          value={formData.owner || ''} 
                          changeHandler={handleOwnerChange} 
                          multiple={true}
                          error={errors.owner ? true : false}
                        />
                      ) : (
                        <div className='p-2 bg-gray-100/50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-700/60'>
                          {formData.owner}
                        </div>
                      )}
                      {errors.owner && <p className="mt-1 text-sm text-red-500">{errors.owner}</p>} 
                    </div>
                  </div>
                </div>
                
                {/* Row 5: Standards */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Standards
                  </label>
                  <Select
                    isMulti
                    options={standards.map(standard => ({ value: standard.name, label: standard.name }))}
                    value={selectedStandards.map(standard => ({ value: standard, label: standard }))}
                    onChange={(selectedOptions) => {
                      const selectedValues = selectedOptions.map(option => option.value);
                      setSelectedStandards(selectedValues);
                      handleStandardChange(selectedOptions);
                    }}
                    className="my-react-select-container"
                    classNamePrefix="my-react-select"
                    styles={getSelectStyles()}
                    placeholder="Select applicable standards"
                  />
                </div>
            </div>
          </div>
          
          {/* Project Details Section */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">Project Details</h2>
            
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div>
                <label
                  className={`${StyleLabel} inline-block mb-2`}
                  htmlFor="description"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CKWrapper
                    id="description"
                    data = {formData.description}
                    onChange={handleCKchange}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>} 
                </div>
              </div>
              <div>
                <label
                  className={`${StyleLabel} inline-block mb-2`}
                  htmlFor="projectexception"
                >
                  Project Exception
                </label>
                <div className='opacity-95'>
                  <div className="relative">
                    <CKWrapper
                      id="projectexception"
                      data = {formData.projectexception}
                      onChange={handleCKchange}
                    />
                    {errors.projectexception && <p className="mt-1 text-sm text-red-500">{errors.projectexception}</p>} 
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-start gap-3 pt-2">
            <Button 
              type="submit" 
              className="px-6 py-2 bg-primary hover:bg-primary/90 transition-all"
              disabled = {btnDisabled}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-save" viewBox="0 0 16 16">
                  <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/>
                </svg>
                Save
              </span>
            </Button>
            <Button 
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 transition-all"
              onClick={handleCancel}
              disabled={btnDisabled}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                </svg>
                Cancel
              </span>
            </Button>
          </div>
        </form>
      </div>
  );
}

export default WithAuth(ProjectForm);
