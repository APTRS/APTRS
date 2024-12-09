import { useState, useEffect } from "react"
import { ReportStandard, ProjectType } from "../lib/data/definitions"
import * as api from "../lib/data/api"
import { currentUserCan } from '../lib/utilities'
import { AccessDenied } from "./access-denied"
import { PageTitle } from "../components/page-title"
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react";
import { StyleTextfield, FormErrorMessage } from "../lib/formstyles"
import { toast } from "react-hot-toast"
import { Spinner } from "@material-tailwind/react"
export default function Config() {
    if (!currentUserCan('Manage Configurations')) {
        return <AccessDenied />
    }

  return (
      <div>
          <PageTitle title='Configuration' />
          <ReportStandards />
          <ProjectTypes  />
      </div>
  )
}

function ReportStandards() {
  const [reportStandards, setReportStandards] = useState<ReportStandard[]>([])
  const [showAddReportStandard, setShowAddReportStandard] = useState(false)
  const [name, setName] = useState('')
  const handleCancel = () => {
    setName('')
    setShowAddReportStandard(false)
  }
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
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
  return (
      <div className="mt-4 mb-2 min-h-[200px]">
          <h2 className='text-xl'>Report Standards {loading && <Spinner className="inline ml-1 -mt-1 h-4 w-4 text-center"/>}</h2>
          {loading ? <></> :
          <>
            <ul className='cursor-text'>
              {reportStandards.map(standard => (
                  <li key={standard.id}>{standard.name}</li>
              ))}
            </ul>
            <button className="text-primary underline text-sm ml-6" onClick={() => setShowAddReportStandard(true)}>Add New</button>
          </>
        }
          <Dialog open={showAddReportStandard} handler={setShowAddReportStandard} className="dark:bg-black dark:text-white">
              <DialogHeader className="dark:text-white">Add Report Standard</DialogHeader>
              <DialogBody>
                  <form>
                    <input type="text" placeholder="Name" className={StyleTextfield} value={name} onChange={(e) => setName(e.target.value)} />
                    {errors.name && <FormErrorMessage message={errors.name} />}
                </form>
              </DialogBody>
              <DialogFooter>
                  <button className="bg-secondary p-2 text-white rounded-md disabled:opacity-50" onClick={handleCancel}>Cancel</button>
                  <button type="submit" onClick={handleSave} className="bg-primary p-2 ml-2 text-white rounded-md disabled:opacity-50">Save</button>
              </DialogFooter>
          </Dialog>
          
        </div>
    )
}

function ProjectTypes() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([])
  const [showAddProjectType, setShowAddProjectType] = useState(false)
  const [loading, setLoading] = useState(true)
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
  const [name, setName] = useState('')
  const handleCancel = () => {
    setName('')
    setShowAddProjectType(false)
  }
  const [errors, setErrors] = useState<Record<string, string>>({})
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
  return (
      <div className="mt-4 mb-2">
        <h2 className='text-xl'>Project Types {loading && <Spinner className="inline ml-1 -mt-1 h-4 w-4 text-center"/>}</h2>
            {loading ? <></> :
            <>
            <ul className='cursor-text'>
                {projectTypes.map(type => (
                    <li key={type.id}>{type.name}</li>
                ))}
            </ul>
            <button className="text-primary underline text-sm ml-6" onClick={() => setShowAddProjectType(true)}>Add New</button>
            <Dialog open={showAddProjectType} handler={setShowAddProjectType} className="dark:bg-black dark:text-white">
            <DialogHeader className="dark:text-white">Add Project Type</DialogHeader>
              <DialogBody>
                <form>
                    <input type="text" placeholder="Name" className={StyleTextfield} value={name} onChange={(e) => setName(e.target.value)} />
                    {errors.name && <FormErrorMessage message={errors.name} />}
                </form>
              </DialogBody>
              <DialogFooter>
                <button className="bg-secondary p-2 text-white rounded-md disabled:opacity-50" onClick={handleCancel}>Cancel</button>
                <button type="submit" onClick={handleSave} className="bg-primary p-2 ml-2 text-white rounded-md disabled:opacity-50">Save</button>
              </DialogFooter>
            </Dialog>
            </>
          }
          </div>
    )
}
