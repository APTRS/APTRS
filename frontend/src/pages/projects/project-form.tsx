import  { 
  useState, 
  useEffect,
  ChangeEvent, 
  FormEvent
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { upsertProject, fetchProjectTypes} from '../../lib/data/api';
import { Project } from '../../lib/data/definitions'
import { isAfter } from 'date-fns'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useCurrentUser } from '../../lib/customHooks';

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
        } catch (error) {
          console.error("Error fetching project data:", error);
          setLoadingError(true);
          // Handle error fetching data
        } finally {
          setLoading(false);
        }
      }
      const data = await fetchProjectTypes()
      const sortedData = data.sort((a: ProjectType, b: ProjectType) => a.name.localeCompare(b.name));
      setProjectTypes(sortedData)      
    }
    loadData();
  }, [id]);
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
    //const owners = event.target.value.split(',').map(owner => owner.trim());
    
    // Update form data
   // setFormData({ ...formData, owner: owners });
    
    // Set or clear error based on the owners array
    setErrors((prevErrors) => ({
      ...prevErrors,
      owner: value.length > 0 && value[0] !== '' ? '' : 'Project Owner is required'
    }));
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
  }
  const handleSubmit = async(event: FormEvent<HTMLFormElement>) => {
    setBtnDisabled(true);
    event.preventDefault();
    const newErrors: FormErrors = {};
    if (formData.name && formData.name.length < 3) {
      newErrors.name = 'Name should be at least three characters';
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
    }
    if (!formData.companyname || formData.companyname === '') {
      newErrors.companyname = 'Company is required';
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
          <div className="flex-1 rounded-lg  px-6 pb-4 pt-8">
          {saveError && <FormErrorMessage message={saveError} />}
          <form action="" onSubmit={handleSubmit} id="projectForm" method="POST">
          <PageTitle title={id ? "Edit Project" : "Create Project"} />
      
          <div className='grid grid-cols-2 gap-4'>
            <div className="w-full mb-4">
              <div className='flex'>
                <div className="w-1/2 pr-2">
                  <label
                    className={StyleLabel}
                    htmlFor="name"
                  >
                    Name
                  </label>
                  
                  <div className="relative">
                    <input
                      name="name"
                      id="name"
                      value = {formData.name || ''}
                      className={StyleTextfield}
                      onChange={handleChange}
                      type="text"
                      required
                    />
                    {errors.name && <p>{errors.name}</p>} 
                  </div>
              </div>  
              <div className="w-1/2">
                  <label
                    className={StyleLabel}
                    htmlFor="projecttype"
                  >
                    Type
                  </label>
                  <div className="relative">
                    <select name="projecttype"
                        value={formData.projecttype} 
                        onChange={handleChange}
                        className={StyleTextfield}
                        required
                      >
                      <option value=''>Select...</option>
                      {projectTypes.map((type) =>
                          <option key={`type-${type.id}`} value={type.name}>{type.name}</option>
                      )}
                    </select>
                    {errors.projecttype && <p>{errors.projecttype}</p>} 
                  </div>
                </div>
              </div>
              <div className='flex mt-4'>
                <div className="w-1/2 pr-2">
                  <label
                    className={StyleLabel}
                    htmlFor="testingtype"
                  >
                    Testing Type
                  </label>
                  <div className="relative">
                    <input
                      name="testingtype"
                      id="testingtype"
                      value = {formData.testingtype || ''}
                      placeholder='Black Box, White Box etc'
                      onChange={handleChange}
                      className={StyleTextfield}
                      type="text"
                      required
                    />
                    {errors.testingtype && <FormErrorMessage message={errors.testingtype} />} 
                  </div>
                </div>
                <div className="w-1/2">
                  <label
                    className={StyleLabel}
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
                      className={StyleTextfield}
                      type="text"
                      disabled                      
                    />
                    {formData.status && <span className='text-xs italic ml-2'>Auto-calculated from date</span>}
                    
                    
                  </div>
                </div>
              </div>
              
            </div>
            <div className="w-full pl-8">
              <div className='flex mb-4'>
                <div className="w-1/2">
                  <label
                    className={StyleLabel}
                    htmlFor="startdate"
                  >
                    Start Date
                  </label>
                  <DatePicker
                    id="startdate"
                    name="startdate"
                    autoComplete="off"
                    className={StyleTextfield}
                    placeholderText='Select date'
                    dateFormat="yyyy-MM-dd"
                    onChange={(date:string) => handleDatePicker('startdate', date)}
                    selected={formData.startdate ? new Date(formData.startdate) : ''}
                    required
                  />
                  {errors.startdate && <FormErrorMessage message={errors.startdate} />} 
                  
                </div>
                <div className="w-1/2 ml-2 ">
                  <label
                    className={StyleLabel}
                    htmlFor="enddate"
                  >
                    End Date
                  </label>
                  <DatePicker   
                      id="enddate"
                      name="enddate"
                      autoComplete="off"
                      className={StyleTextfield}
                      minDate={formData.startdate ? new Date(formData.startdate) : null}
                      placeholderText='Select date'
                      dateFormat="yyyy-MM-dd"
                      onChange={(date:string) => handleDatePicker('enddate', date)}
                      selected={formData.enddate ? new Date(formData.enddate) : ''}
                      required
                  />
                  {errors.enddate && <FormErrorMessage message={errors.enddate} />} 
                </div>
              </div>
              <div className='flex'>
                <div className="w-1/2">
                  <label
                    className={StyleLabel}
                    htmlFor="companyname"
                  >
                    Company
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
                      <div className='mt-5'>{formData.companyname}</div>
                    }
                    
                    {errors.companyname && <FormErrorMessage message={errors.companyname} />} 
                  </div>
                </div>
                <div className="w-1/2 pl-2">
                  <label
                    className={StyleLabel}
                    htmlFor="owner"
                  >
                    Project Owner
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
                    ) :
                      <div className='mt-5'>{formData.owner}</div>
                    }
                    {errors.owner && <FormErrorMessage message={errors.owner} />} 
                  </div>
                </div>
              </div>
              
             
            </div>
            
          </div>
          <div className='grid grid-cols-2'>
              <div className="min-h-[200px] w-full">
                <label
                  className={StyleLabel}
                  htmlFor="description"
                >
                  Description
                </label>
                <div className="relative">
                  <CKWrapper
                    id="description"
                    data = {formData.description}
                    onChange={handleCKchange}
                  />
                    
                  {errors.description && <FormErrorMessage message={errors.description} />} 
                </div>
              </div>
              <div className="min-h-[200px] w-full ml-10 pr-10">
                <label
                  className={StyleLabel}
                  htmlFor="projectexception"
                >
                  Project Exception
                </label>
                {/* opacity is a hack to allow date picker above it to display correctly. for some reason it goes behind the ck object when opacity is set to 100 */}
                <div className='opacity-95'>
                  <div className="relative">
                    <CKWrapper
                      id="projectexception"
                      data = {formData.projectexception}
                      onChange={handleCKchange}
                    />
                    
                    {errors.projectexception && <FormErrorMessage message={errors.projectexception} />} 
                  </div>
                </div>
              </div>
              
              
            </div>
          
          <div className="p-2 flex">
            <div className="w-1/2 flex justify-left mt-2">
              <Button 
                type="submit" 
                className="w-sm bg-primary"
                disabled = {btnDisabled}
              >
                  Save
              </Button>
              <Button 
                className="bg-red-500 ml-2"
                onClick = {handleCancel}
                disabled={btnDisabled}>
                  Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
  );
}

export default WithAuth(ProjectForm);
