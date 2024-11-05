import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { WithAuth } from '../../lib/authutils';
import { currentUserCan, getProjectStatusColor } from '../../lib/utilities';
import { FormSkeleton } from '../../components/skeletons';
import {  getProject, 
          getProjectScopes, 
          updateProjectOwner, 
          markProjectAsCompleted, 
          markProjectAsOpen,
        } from '../../lib/data/api';
import { Project, Scope } from '../../lib/data/definitions';
import ReportForm from './report-form';
import Retests from './retests';
import 'react-datepicker/dist/react-datepicker.css';
import { ModalErrorMessage, StyleLabel, FormErrorMessage } from '../../lib/formstyles';
import PageTitle from '../../components/page-title';
import UserSelect from '../../components/user-select';
import VulnerabilityTable from '../../components/vulnerability-table';
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel
} from "@material-tailwind/react";
import ScopeTable from '../../components/scope-table';
import { PencilSquareIcon } from '@heroicons/react/24/outline';


interface ProjectViewProps {
  id?: string;
  tab?: string;
}

function ProjectView({ id: externalId }: ProjectViewProps): JSX.Element {
  const navigate = useNavigate();
  const params = useParams();
  const { id: routeId, tab: routeTab } = params;
  const id = externalId || routeId;
  const [selectedTab, setSelectedTab] = useState(routeTab || 'summary');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | undefined>();
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loadingError, setLoadingError] = useState(false);
  const [editingOwner, setEditingOwner] = useState(false);
  const [owner, setOwner] = useState<string[]>([]);
  const [ownerError, setOwnerError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const handleOwnerChange = (e: ChangeEvent<HTMLInputElement>) => {
    setOwner(e.target.value.split(',').map(owner => owner.trim()));
  };

  const cancelEditing = () => {
    setOwnerError('');
    setEditingOwner(false);
  };

  const saveOwner = async () => {
    setSaving(true);
    const _project: Partial<Project> = { id: Number(id), owner: owner  as string[] };
    try {
      await updateProjectOwner(_project);
      setEditingOwner(false);
      setProject(prev => prev ? { ...prev, owner } : prev);
    } catch (error) {
      setOwnerError("Error saving owner");
      setEditingOwner(true);
    } finally {
      setSaving(false);
    }
  };

  const markAsCompleted = async () => {
    setSaving(true);
    try {
      await markProjectAsCompleted(Number(id));
      setProject(prev => prev ? { ...prev, status: 'Completed' } : prev);
    } catch (error) {
      setOwnerError("Error updating project");
    } finally {
      setSaving(false);
    }
  };

  const markAsOpen = async () => {
    setSaving(true);
    try {
      const response = await markProjectAsOpen(Number(id));
      const { latest_status } = response.data;
      setProject(prev => prev ? { ...prev, status: latest_status  } : prev);
    } catch (error) {
      setOwnerError("Error updating project");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        setLoading(true);
        try {
          const projectData = await getProject(id) as Project;
          setProject(projectData);
          setOwner(projectData.owner || '');
          const scopes = await getProjectScopes(id) as Scope[];
          setScopes(scopes);
        } catch (error) {
          console.error("Error fetching project data:", error);
          setLoadingError(true);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    navigate(`/projects/${id}/${selectedTab}`);
  }, [selectedTab]);

  if (loading) return <FormSkeleton numInputs={6} className='max-w-lg' />;
  if (loadingError) return <ModalErrorMessage message={"Error loading project"} />;
  return (
    <>
      {project && (
        <Tabs value={selectedTab}>
          <div className="max-w-screen flex-1 rounded-lg bg-white dark:bg-gray-darkest dark:text-white px-6 pb-4">
            <PageTitle title='Project Details' />
            <TabsHeader className='mt-4'>
              <Tab key="summary" value="summary" onClick={() => setSelectedTab('summary')}>Summary</Tab>
              <Tab key="vulnerabilities" value="vulnerabilities" onClick={() => setSelectedTab('vulnerabilities')}>Vulnerabilities</Tab>
              <Tab key="scopes" value="scopes" onClick={() => setSelectedTab('scopes')}>Scopes</Tab>
              <Tab key="retest" value="retest" onClick={() => setSelectedTab('retest')}>Retest</Tab>
              <Tab key="reports" value="reports" onClick={() => setSelectedTab('reports')}>Reports</Tab>
            </TabsHeader>
            <TabsBody>
              <TabPanel value="summary">
                {currentUserCan('Manage Projects') && (
                  <Link className='text-primary underline' to={`/projects/${project.id}/edit`}>Edit Project</Link>
                )}
                <div className='w-2/3'>
                  <div className="w-full mb-4">
                    <label className={StyleLabel}>Name</label>
                    <div className="relative cursor-text">{project.name}</div>
                  </div>
                  <div className="mt-4 mb-6">
                    <label className={StyleLabel}>Status</label>
                    <div className={`relative cursor-text ${getProjectStatusColor(project.status)}`}>
                      {project.status}
                      {currentUserCan('Manage Projects') && project.status !== 'Completed' && (
                        <div className='text-secondary dark:text-white underline cursor-pointer text-sm' onClick={markAsCompleted}>Mark Complete</div>
                      )}
                      {currentUserCan('Manage Projects') && project.status == 'Completed' && (
                        <div className='text-secondary dark:text-white underline cursor-pointer text-sm' onClick={markAsOpen}>Reopen</div>
                      )}
                    </div>
                  </div>
                  <div className="w-full mb-4">
                    <label className={StyleLabel}>Project Owner</label>
                    <div className="relative cursor-text">
                      {editingOwner ? (
                        <div className='max-w-[200px]'>
                          <UserSelect
                            name='owner'
                            defaultValue={project.owner}
                            value={owner}
                            multiple={true}
                            changeHandler={handleOwnerChange}
                            required={true}
                          />
                          <div className='flex justify-start my-4'>
                            <button
                              className='bg-primary text-white p-1 rounded-md mr-4 disabled:opacity-50'
                              disabled={saving}
                              onClick={saveOwner}>
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            {!saving && (
                              <span className='text-secondary underline cursor-pointer' onClick={cancelEditing}>cancel</span>
                            )}
                          </div>
                          {ownerError && <FormErrorMessage message={ownerError} />}
                        </div>
                      ) : (
                        <>
                          {project.owner?.length > 0 ? project.owner.map(owner => owner.trim()).join(', ') : 'none'}
                          {(currentUserCan('Manage Projects') || currentUserCan('Assign Projects')) && (
                            <span className='underline ml-4 cursor-pointer' onClick={() => setEditingOwner(true)}><PencilSquareIcon className="inline w-5" /></span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={StyleLabel}>Type</label>
                    <div className="relative cursor-text">{project.projecttype}</div>
                  </div>
                  <div className="mt-4">
                    <label className={StyleLabel}>Company</label>
                    <div className="relative cursor-text">{project.companyname}</div>
                  </div>
                  <div className='grid grid-cols-2'>
                    <div className="mt-4">
                      <label className={StyleLabel}>Start Date</label>
                      <div className="relative cursor-text">{project.startdate}</div>
                    </div>
                    <div className="mt-4">
                      <label className={StyleLabel}>End Date</label>
                      <div className="relative cursor-text">{project.enddate}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={StyleLabel}>Testing Type</label>
                    <div className="relative cursor-text">{project.testingtype}</div>
                  </div>
                  <div className="mt-4">
                    <label className={StyleLabel}>Project Exception</label>
                    <div dangerouslySetInnerHTML={{ __html: project.projectexception || '' }}></div>
                  </div>
                  <div className="mt-4">
                    <label className={StyleLabel}>Description</label>
                    <div className="relative cursor-text">
                      <div dangerouslySetInnerHTML={{ __html: project.description || '' }}></div>
                    </div>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value="vulnerabilities">
                <VulnerabilityTable projectId={Number(id)} />
              </TabPanel>
              <TabPanel value="scopes">
                <ScopeTable projectId={Number(id)} />
              </TabPanel>
              <TabPanel value="retest">
                <Retests project={project} />
              </TabPanel>
              <TabPanel value="reports">
                <div className="mt-4 max-w-lg"> 
                  <ReportForm projectId={Number(id)} scopes={scopes} />
                </div>
              </TabPanel>
            </TabsBody>
          </div>
        </Tabs>
      )}
    </>
  );
}


export default WithAuth(ProjectView);