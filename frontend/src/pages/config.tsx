import { useState, useEffect } from "react"
import { ReportStandard, ProjectType } from "../lib/data/definitions"
import * as api from "../lib/data/api"
import { currentUserCan } from '../lib/utilities'
import { AccessDenied } from "./access-denied"
import { PageTitle } from "../components/page-title"
import { StyleTextfield, FormErrorMessage } from "../lib/formstyles"
import { toast } from "react-hot-toast"
import { Spinner, Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react"

// Ensure proper type casting for Material Tailwind components
const SpinnerComponent = Spinner as unknown as React.FC<React.HTMLAttributes<HTMLDivElement>>;
const DialogComponent = Dialog as unknown as React.FC<{ open: boolean; handler: React.Dispatch<React.SetStateAction<boolean>>; className: string; children: React.ReactNode }>; 
const DialogHeaderComponent = DialogHeader as unknown as React.FC<{ className: string; children: React.ReactNode; placeholder?: string; onPointerEnterCapture?: () => void; onPointerLeaveCapture?: () => void }>;
const DialogBodyComponent = DialogBody as unknown as React.FC<{ className?: string; children: React.ReactNode; placeholder?: string; onPointerEnterCapture?: () => void; onPointerLeaveCapture?: () => void }>;
const DialogFooterComponent = DialogFooter as unknown as React.FC<{ className?: string; children: React.ReactNode; placeholder?: string; onPointerEnterCapture?: () => void; onPointerLeaveCapture?: () => void }>;

export default function Config() {
    if (!currentUserCan('Manage Configurations')) {
        return <AccessDenied />
    }

  return (
      <div className="container mx-auto px-4 py-6">
          <PageTitle title='Configuration' />
          <div className="grid grid-cols-1 gap-6">
            <ReportStandards />
            <ProjectTypes />
          </div>
      </div>
  )
}

function ReportStandards() {
  const [reportStandards, setReportStandards] = useState<ReportStandard[]>([])
  const [showAddReportStandard, setShowAddReportStandard] = useState(false)
  const [showEditReportStandard, setShowEditReportStandard] = useState(false)
  const [showDeleteReportStandard, setShowDeleteReportStandard] = useState(false)
  const [name, setName] = useState('')
  const [selectedStandard, setSelectedStandard] = useState<ReportStandard | null>(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleCancel = () => {
    setName('')
    setShowAddReportStandard(false)
    setShowEditReportStandard(false)
    setShowDeleteReportStandard(false)
    setSelectedStandard(null)
  }
  
  const handleAddClick = () => {
    setName('')
    setErrors({})
    setShowAddReportStandard(true)
  }

  const handleEditClick = (standard: ReportStandard) => {
    setSelectedStandard(standard)
    setName(standard.name)
    setErrors({})
    setShowEditReportStandard(true)
  }

  const handleDeleteClick = (standard: ReportStandard) => {
    setSelectedStandard(standard)
    setShowDeleteReportStandard(true)
  }
  
  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if(name.trim().length === 0) {
      setErrors({name: 'Name is required'})
      return
    }
    e.preventDefault()
    try {
      const result = await api.insertReportStandard(name.trim())
      setReportStandards(prev => [...prev, result])
      setShowAddReportStandard(false)
      toast.success('Report standard added')
      setName('')
      loadReportStandards()
    } catch(err) {
      toast.error(err as string)
    }
  }

  const handleEdit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if(name.trim().length === 0) {
      setErrors({name: 'Name is required'})
      return
    }
    e.preventDefault()
    if (!selectedStandard) return
    
    try {
      await api.updateReportStandard(selectedStandard.id, {name: name.trim()})
      setShowEditReportStandard(false)
      toast.success('Report standard updated')
      setName('')
      setSelectedStandard(null)
      loadReportStandards()
    } catch(err) {
      toast.error(err as string)
    }
  }

  const handleDelete = async () => {
    if (!selectedStandard) return
    
    try {
      await api.deleteReportStandard(selectedStandard.id)
      setShowDeleteReportStandard(false)
      toast.success('Report standard deleted')
      setSelectedStandard(null)
      loadReportStandards()
    } catch(err) {
      toast.error('error deleting report standard') 
    }
  }
  
  const loadReportStandards = async () => {
    setLoading(true)
    try {
      const result = await api.fetchReportStandards()
      setReportStandards(result)
    } catch(err) {
      toast.error(err as string)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadReportStandards()
  }, [])
  
  return (      <div className="mt-6 mb-8 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 min-h-[200px]">
          <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
            <h2 className='text-xl font-semibold'>
              Report Standards {loading && <SpinnerComponent className="inline ml-1 -mt-1 h-4 w-4 text-center" />}
            </h2>
            {!loading && (
              <button 
                className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center text-sm transition-colors duration-200 ease-in-out"
                onClick={handleAddClick}
              >
                <span className="material-icons text-sm mr-1">add</span>
                Add New Standard
              </button>
            )}
          </div>
          {loading ? <div className="flex justify-center py-10"><SpinnerComponent className="h-8 w-8" /></div> :
          <>            <div className="border rounded-lg overflow-hidden shadow-sm dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Standard Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {reportStandards.map(standard => (
                    <tr key={standard.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {standard.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-blue-500 hover:text-blue-700 p-1 mr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                          onClick={() => handleEditClick(standard)}
                          title="Edit"
                        >
                          <span className="material-icons text-sm">edit</span>
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full"
                          onClick={() => handleDeleteClick(standard)}
                          title="Delete"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>            </div>
          </>
        }          {/* Add Report Standard Dialog */}
          <DialogComponent open={showAddReportStandard} handler={setShowAddReportStandard} className="dark:bg-gray-800 dark:text-white">
              <DialogHeaderComponent className="bg-gray-100 dark:bg-gray-700 dark:text-white border-b border-gray-200 dark:border-gray-600 font-semibold">
                Add Report Standard
              </DialogHeaderComponent>
              <DialogBodyComponent className="pt-6">
                <form>
                  <label htmlFor="standardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Standard Name
                  </label>
                  <input 
                    id="standardName"
                    type="text" 
                    placeholder="Enter standard name" 
                    className={`${StyleTextfield} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                  {errors.name && <FormErrorMessage message={errors.name} />}
                </form>
              </DialogBodyComponent>
              <DialogFooterComponent className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <button 
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-gray-800 dark:text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  onClick={handleSave} 
                  className="bg-primary hover:bg-blue-600 px-4 py-2 ml-3 text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save
                </button>
              </DialogFooterComponent>
          </DialogComponent>          {/* Edit Report Standard Dialog */}
          <DialogComponent open={showEditReportStandard} handler={setShowEditReportStandard} className="dark:bg-gray-800 dark:text-white">
              <DialogHeaderComponent className="bg-gray-100 dark:bg-gray-700 dark:text-white border-b border-gray-200 dark:border-gray-600 font-semibold">
                Edit Report Standard
              </DialogHeaderComponent>
              <DialogBodyComponent className="pt-6">
                <form>
                  <label htmlFor="editStandardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Standard Name
                  </label>
                  <input 
                    id="editStandardName"
                    type="text" 
                    placeholder="Enter standard name" 
                    className={`${StyleTextfield} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                  {errors.name && <FormErrorMessage message={errors.name} />}
                </form>
              </DialogBodyComponent>
              <DialogFooterComponent className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <button 
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-gray-800 dark:text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  onClick={handleEdit} 
                  className="bg-primary hover:bg-blue-600 px-4 py-2 ml-3 text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save
                </button>
              </DialogFooterComponent>
          </DialogComponent>          {/* Delete Report Standard Dialog */}
          <DialogComponent open={showDeleteReportStandard} handler={setShowDeleteReportStandard} className="dark:bg-gray-800 dark:text-white">
              <DialogHeaderComponent className="bg-gray-100 dark:bg-gray-700 dark:text-white border-b border-gray-200 dark:border-gray-600 font-semibold">
                <div className="flex items-center text-red-600">
                  <span className="material-icons mr-2">warning</span>
                  Delete Report Standard
                </div>
              </DialogHeaderComponent>
              <DialogBodyComponent className="pt-6">
                <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md mb-4">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Are you sure you want to delete the report standard "<strong>{selectedStandard?.name}</strong>"?
                  </p>
                  <p className="text-red-600 dark:text-red-400 mt-2 text-xs font-medium">
                    This action cannot be undone.
                  </p>
                </div>
              
              </DialogBodyComponent>
              <DialogFooterComponent className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <button 
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-gray-800 dark:text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete} 
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 ml-3 text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </DialogFooterComponent>
          </DialogComponent>
          
        </div>
    )
}

function ProjectTypes() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([])
  const [showAddProjectType, setShowAddProjectType] = useState(false)
  const [showEditProjectType, setShowEditProjectType] = useState(false)
  const [showDeleteProjectType, setShowDeleteProjectType] = useState(false)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleCancel = () => {
    setName('')
    setShowAddProjectType(false)
    setShowEditProjectType(false)
    setShowDeleteProjectType(false)
    setSelectedType(null)
  }

  const handleAddClick = () => {
    setName('')
    setErrors({})
    setShowAddProjectType(true)
  }

  const handleEditClick = (type: ProjectType) => {
    setSelectedType(type)
    setName(type.name)
    setErrors({})
    setShowEditProjectType(true)
  }

  const handleDeleteClick = (type: ProjectType) => {
    setSelectedType(type)
    setShowDeleteProjectType(true)
  }

  const loadProjectTypes = async () => {
    setLoading(true)
    try {
      const result = await api.fetchProjectTypes()
      setProjectTypes(result)
    } catch(err) {
      toast.error(err as string)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadProjectTypes()
  }, [])
  
  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if(name.trim().length === 0) {
      setErrors({name: 'Name is required'})
      return
    }
    e.preventDefault()
    try {
      const result = await api.insertProjectType(name.trim())
      setProjectTypes(prev => [...prev, result])
      setShowAddProjectType(false)
      toast.success('Project type added')
      setName('')
      loadProjectTypes()
    } catch(err) {
      toast.error(err as string)
    }
  }
  
  const handleEdit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if(name.trim().length === 0) {
      setErrors({name: 'Name is required'})
      return
    }
    e.preventDefault()
    if (!selectedType) return
    
    try {
      await api.updateProjectType(selectedType.id, {name: name.trim()})
      setShowEditProjectType(false)
      toast.success('Project type updated')
      setName('')
      setSelectedType(null)
      loadProjectTypes()
    } catch(err) {
      toast.error(err as string)
    }
  }

  const handleDelete = async () => {
    if (!selectedType) return
    
    try {
      await api.deleteProjectType(selectedType.id)
      setShowDeleteProjectType(false)
      toast.success('Project type deleted')
      setSelectedType(null)
      loadProjectTypes()
    } catch(err) {
      toast.error('Error deleting project type')
    }
  }
  
  return (      <div className="mt-6 mb-8 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
          <h2 className='text-xl font-semibold'>
            Project Types {loading && <SpinnerComponent className="inline ml-1 -mt-1 h-4 w-4 text-center" />}
          </h2>
          {!loading && (
            <button 
              className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center text-sm transition-colors duration-200 ease-in-out"
              onClick={handleAddClick}
            >
              <span className="material-icons text-sm mr-1">add</span>
              Add New Project Type
            </button>
          )}
        </div>
            {loading ? <div className="flex justify-center py-10"><SpinnerComponent className="h-8 w-8" /></div> :
            <>            <div className="border rounded-lg overflow-hidden shadow-sm dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Project Type Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {projectTypes.map(type => (
                    <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {type.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-blue-500 hover:text-blue-700 p-1 mr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                          onClick={() => handleEditClick(type)}
                          title="Edit"
                        >
                          <span className="material-icons text-sm">edit</span>
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full"
                          onClick={() => handleDeleteClick(type)}
                          title="Delete"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>            </div>
              {/* Add Project Type Dialog */}
            <DialogComponent open={showAddProjectType} handler={setShowAddProjectType} className="dark:bg-gray-800 dark:text-white">
              <DialogHeaderComponent className="bg-gray-100 dark:bg-gray-700 dark:text-white border-b border-gray-200 dark:border-gray-600 font-semibold">
                Add Project Type
              </DialogHeaderComponent>
              <DialogBodyComponent className="pt-6">
                <form>
                  <label htmlFor="projectTypeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Type Name
                  </label>
                  <input 
                    id="projectTypeName"
                    type="text" 
                    placeholder="Enter project type name" 
                    className={`${StyleTextfield} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                  {errors.name && <FormErrorMessage message={errors.name} />}
                </form>
              </DialogBodyComponent>
              <DialogFooterComponent className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <button 
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-gray-800 dark:text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  onClick={handleSave} 
                  className="bg-primary hover:bg-blue-600 px-4 py-2 ml-3 text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save
                </button>
              </DialogFooterComponent>
            </DialogComponent>
              {/* Edit Project Type Dialog */}
            <DialogComponent open={showEditProjectType} handler={setShowEditProjectType} className="dark:bg-gray-800 dark:text-white">
              <DialogHeaderComponent className="bg-gray-100 dark:bg-gray-700 dark:text-white border-b border-gray-200 dark:border-gray-600 font-semibold">
                Edit Project Type
              </DialogHeaderComponent>
              <DialogBodyComponent className="pt-6">
                <form>
                  <label htmlFor="editProjectTypeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Type Name
                  </label>
                  <input 
                    id="editProjectTypeName"
                    type="text" 
                    placeholder="Enter project type name" 
                    className={`${StyleTextfield} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                  {errors.name && <FormErrorMessage message={errors.name} />}
                </form>
              </DialogBodyComponent>
              <DialogFooterComponent className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <button 
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-gray-800 dark:text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  onClick={handleEdit} 
                  className="bg-primary hover:bg-blue-600 px-4 py-2 ml-3 text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save
                </button>
              </DialogFooterComponent>
            </DialogComponent>
              {/* Delete Project Type Dialog */}
            <DialogComponent open={showDeleteProjectType} handler={setShowDeleteProjectType} className="dark:bg-gray-800 dark:text-white">
              <DialogHeaderComponent className="bg-gray-100 dark:bg-gray-700 dark:text-white border-b border-gray-200 dark:border-gray-600 font-semibold">
                <div className="flex items-center text-red-600">
                  <span className="material-icons mr-2">warning</span>
                  Delete Project Type
                </div>
              </DialogHeaderComponent>
              <DialogBodyComponent className="pt-6">
                <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md mb-4">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Are you sure you want to delete the project type "<strong>{selectedType?.name}</strong>"?
                  </p>
                  <p className="text-red-600 dark:text-red-400 mt-2 text-xs font-medium">
                    This action cannot be undone.
                  </p>
                </div>
                
              </DialogBodyComponent>
              <DialogFooterComponent className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <button 
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 px-4 py-2 text-gray-800 dark:text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete} 
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 ml-3 text-white rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </DialogFooterComponent>
            </DialogComponent>
            </>
          }
          </div>
    )
}
