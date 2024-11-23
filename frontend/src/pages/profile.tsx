import PageTitle from "../components/page-title";
import ShowPasswordButton from '../components/show-password-button';
import {PasswordDescription, validPassword} from '../components/passwordValidator';
import { updateProfile, changePassword} from '../lib/data/api';
import { useCurrentUser } from '../lib/customHooks';
import { User as BaseUser } from '../lib/data/definitions'
import toast from 'react-hot-toast';
import Button from '../components/button';
import { formatPhoneNumber } from 'react-phone-number-input'
import {
  StyleTextfield,
  StyleTextfieldError,
  StyleLabel,
  FormErrorMessage,
} from '../lib/formstyles'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { phoneRegex, emailRegex, parseErrors, avatarUrl } from '../lib/utilities';
import { WithAuth } from "../lib/authutils";
import { 
  useState, 
  ChangeEvent, 
  FormEvent
} from 'react';
import type {Country} from 'react-phone-number-input';

interface FormErrors {
  email?: string
  full_name?: string
  position?: string
  number?: string
  newpassword?: string
  profilepic?: string
  newpassword_check?: string
  non_field_errors?: string[]
}
interface UserForm extends BaseUser {
  newpassword?: string;
  newpassword_check?: string;
  profilepic?: string | File
};
export const Profile = () => {
  const [currentUser, setCurrentUser] = useState(useCurrentUser())
  const [btnDisabled, setBtnDisabled] = useState(false)
  const [saveError, setSaveError] = useState('');
  const [editing, setEditing] = useState(false)
  
  const defaults = {
    id: currentUser!.id,
    full_name: currentUser!.full_name,
    email: currentUser!.email,
    number: currentUser!.number,
    position: currentUser!.position,
    groups: currentUser!.groups,
    profilepic: currentUser!.profilepic, //leaving this out because later I may have to set it as a file
    oldpassword: '',
    newpassword: '',
    newpassword_check: '',
  }
  const [formData, setFormData] = useState<UserForm>(defaults);
  //profile image input
  const [file, setFile] = useState<File | null>(null);
  const [fileDataURL, setFileDataURL] = useState<string | null>(
    typeof currentUser?.profilepic === 'string' ? avatarUrl(currentUser.profilepic) : null
  )
  
  
  const defaultCountry: Country = currentUser!.location?.country as Country
  const [errors, setErrors] = useState<FormErrors>({});
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = event.target;
    // Check the type of input - checkboxes don't have a value attribute
    const inputValue = type === 'checkbox' ? checked : value;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: inputValue,
    }));
  };
  const [passwordVisible, setPasswordVisible] = useState(false)
  function togglePasswordVisibility() {
    setPasswordVisible((prevState) => !prevState);
  }
  
  const handlePhoneInputChange = (value:string) => {
    setFormData({
      ...formData,
      number:value
    })    
  };
  
  const handleSubmit  = async (event: FormEvent<HTMLFormElement>) => {
    setSaveError('')
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
    if (Object.keys(newErrors).length >  0) {
      setErrors(newErrors);
      console.error('Form failed validation:', newErrors);
      setBtnDisabled(false);
      return null
    }
    if(file){
      formData.profilepic = file
    } else {
      delete formData.profilepic
    }
    let success = false
    try {
      await updateProfile(formData, file);
      setCurrentUser(useCurrentUser());
      toast.success('Profile saved.')
      success = true
    } catch (error) {
      console.error('Error submitting form:', error);
      setSaveError(String(error))
    }
    if(formData.newpassword && formData.newpassword_check){
      try {
      await changePassword(formData as UserForm);
      toast.success('Password updated')
      success = true
      } catch (error) {
        console.error('Error submitting form:', error);
        //try to parse out the error
        try {
          setErrors(parseErrors(error))
          if(parseErrors(error)?.non_field_errors.length > 0){
            setSaveError(parseErrors(error).non_field_errors[0])
          } else {
            setSaveError(String(error))
          }
        } catch (error){
          setSaveError(String(error))
        }
      }
    }
    setBtnDisabled(false);
    if(success){
      setEditing(false)
    }
    // hacky -- forcing a full reload so that the profile pic is updated
    // should use context but this is the only place it matters in the whole app
    window.location.reload();     
  }
  const toggleEditing = () => {
    setEditing(!editing)
    setErrors({})
    setFormData(defaults)
    if(!editing) {
      setPasswordVisible(false)
    }
  }
  const fileInput = (): JSX.Element => {
    return (
      <input type="file"
        name="img"
        onChange={handleImage}
        accept="image/*"
        className={`text-sm text-white
                  file:text-white
                    file:mr-5 file:py-2 file:px-6
                    file:rounded-full file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary
                    file:cursor-pointer
                    hover:file:bg-secondary`}
      />
    )
  }
  const handleImage = (e: ChangeEvent<HTMLInputElement>): void => {
    const { files } = e.target
    if (!files) return
    const image = files[0]
    if (image.size > 1_000_000) {
      toast.error('Image must be less than 1MB')
      return
    }
    setFile(image)
    const fileReader = new FileReader()
    fileReader.onload = (e) => {
      const result = e.target?.result
      if (result) {
        if (typeof result === 'string') {
          setFileDataURL(result)
        } else {
          setFileDataURL(null)
        }
      }
    }
    fileReader.readAsDataURL(image)
  }
  const removeImage = (): void => {
    setFile(null)
    setFileDataURL(null)
  }
  const handleCancel = (): void => {
    setFile(null)
    setFileDataURL(null)
    setFormData(defaults)
    setFileDataURL(
      typeof currentUser?.profilepic === 'string' 
        ? avatarUrl(currentUser.profilepic) 
        : null
    )
    setEditing(false)
  }
  return (
    <>
    <PageTitle title='Profile Page' />
    {saveError && <FormErrorMessage message={saveError} />}
    <form onSubmit={handleSubmit} id="projectForm" method="POST">
        <div className="max-w-sm mb-4">
          <label 
            htmlFor="full_name"
            className={StyleLabel}>
            Name
          </label>
          <div className="relative">
          {editing ?
            (<input
              name="full_name"
              id="full_name"
              className={StyleTextfield}
              value={formData.full_name}
              onChange={handleChange}
              type="text"
              required={true}
            />) : <>{currentUser?.full_name}</>
          }

            {errors.full_name && <FormErrorMessage message={errors.full_name} />}
          </div>
        </div>
      
        <div className="max-w-sm mb-4">
          <label 
            className={StyleLabel}
            htmlFor="email">
              Email
          </label>
          <div className="relative">
          {editing ?
            (<input
              name="email"
              id="email"
              className={StyleTextfield}
              value={formData.email}
              onChange={handleChange}
              type="text"
              required={true}
            />
            ) : <>{currentUser!.email}</>
          }
            {errors.email && <FormErrorMessage message={errors.email} />}
          </div>
        </div>
        
        <div className="max-w-sm mb-4">
          <label 
            htmlFor="position"
            className={StyleLabel}>
            Position
          </label>
          
          <div className="relative">
          {editing ?
              (<input
              name="position"
              id="position"
              className={StyleTextfield}
              value={formData.position}
              onChange={handleChange}
              type="text"
              
            />) : <>{currentUser!.position}</>
          }
          </div>
        </div>
        <div className="max-w-sm mb-4">
            <label 
              htmlFor="name"
              className={StyleLabel}>
              Phone number
            </label>
          <div className="relative">
          {editing ?
              (<PhoneInput
              value={formData.number}
              onChange={handlePhoneInputChange}
              name="number"
              defaultCountry={defaultCountry as Country}
              className={StyleTextfield}
              id="number"
              required={true}
            />) : <>{formatPhoneNumber(currentUser?.number as string)}</>
          }
            {errors.number && <FormErrorMessage message={errors.number} />}
          </div>
        </div>
        
        {editing && 
          <div className="max-w-sm mb-4">
            {fileDataURL &&
            
              <div className="flex justify-center items-center flex-col w-24">
                <div className="block"><img src={fileDataURL} alt="cover photo" className="rounded-full h-20 w-20" /></div>
                <div className="block"><button className='underline text-red-500' onClick={removeImage}>Remove</button></div>
              </div>
              
            
          }
          {!fileDataURL &&
            <div className="flex flex-col items-center justify-end">
              <p className="text-2xl text-center">Upload a profile picture</p>
              <div className='mt-10 ml-36'>
                {fileInput()}
              </div>
            </div>
          }
            
          </div>
        }
        {editing &&
          <fieldset className="max-w-sm form-control rounded-md  space-y-2 p-2 border border-slate-200" >
            <legend className='text-sm'>Change Password (optional)</legend>
            <div className="w-full mt-0">
            <label 
                htmlFor="oldpassword"
                className='mt-0 mb-2 block text-xs font-medium text-gray-900'
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  name="oldpassword"
                  id="oldpassword"
                  className={`${StyleTextfield} mb-4`}
                  onChange={handleChange}
                  type={passwordVisible ? "text" : "password"}
                  
                />
                <ShowPasswordButton passwordVisible={passwordVisible} clickHandler={togglePasswordVisibility} />
              </div>
              
              <PasswordDescription password={formData.newpassword} />
              <label 
                htmlFor="newpassword"
                className='mt-0 mb-2 block text-xs font-medium text-gray-900'
              >
                New Password
              </label>
             
              
              <div className="relative">
                <input
                  name="newpassword"
                  id="newpassword"
                  className={formData.newpassword && !validPassword(formData.newpassword) ? `${StyleTextfieldError}  mb-2` :`${StyleTextfield}  mb-2`}
                  onChange={handleChange}
                  type={passwordVisible ? "text" : "password"}
                  
                />
                <ShowPasswordButton passwordVisible={passwordVisible} clickHandler={togglePasswordVisibility} />
              </div>
              
              
              
            </div>
            <div className="w-full mt-0">
              <label 
                htmlFor="newpassword_check"
                className='mt-0 mb-2 block text-xs font-medium text-gray-900'
              >
                Repeat new password
              </label>
              <div className="relative">
                <input
                  name="newpassword_check"
                  id="newpassword_check"
                  className={formData.newpassword != formData.newpassword_check ? `${StyleTextfieldError}` :`${StyleTextfield}`}
                  onChange={handleChange}
                  type={passwordVisible ? "text" : "password"}                    
                />
                <ShowPasswordButton passwordVisible={passwordVisible} clickHandler={togglePasswordVisibility} />
                  
              </div>
              {formData.newpassword != formData.newpassword_check && <p className='text-xs mt-2 ml-1 text-red-500'>Passwords should match</p>}
            </div>
          </fieldset>
        }
        
          <div className="p-2 flex mt-4">
            <div className="w-1/2 flex justify-left">
              {!editing &&
                <Button 
                  className="bg-primary -ml-3"
                  onClick={() => toggleEditing()}
                  disabled={btnDisabled}>
                  Edit
                </Button>
              }
              {editing &&
                <>
                  <Button 
                  className="bg-primary disabled:bg-gray-200 disabled:border-gray-200 disabled:shadow-none"
                  disabled={btnDisabled}
                  type="submit">
                    Save
                  </Button>
                  <Button 
                    className="bg-red-500 ml-1"
                    onClick={handleCancel}
                    disabled={btnDisabled}>
                      Cancel
                  </Button>
                </>
              }
            </div>
          </div>
        
        
      </form>
    </>
    
  )
};

export default WithAuth(Profile);
