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
          markProjectAsHold,
        } from '../../lib/data/api';
import { Project, Scope } from '../../lib/data/definitions';
import CKWrapper from '../../components/ckwrapper';
import ReportForm from './report-form';
import Retests from './retests';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';
import { ModalErrorMessage, StyleLabel, FormErrorMessage } from '../../lib/formstyles';
import PageTitle from '../../components/page-title';
import UserSelect from '../../components/user-select';
import VulnerabilityTable from '../../components/vulnerability-table';
import '../../styles/components/material-tabs.css';
import {
  Tabs,
  TabsHeader,
  Tab,
  TabsBody,
  TabPanel,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import ScopeTable from '../../components/scope-table';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

// Ensure proper type casting for Material Tailwind components
const TabsHeaderComponent = TabsHeader as unknown as React.FC<{ className: string; children: React.ReactNode; placeholder?: string; onPointerEnterCapture?: () => void; onPointerLeaveCapture?: () => void }>;
const TabComponent = Tab as unknown as React.FC<{ key: string; value: string; onClick: () => void; className: string; children: React.ReactNode; placeholder?: string; onPointerEnterCapture?: () => void; onPointerLeaveCapture?: () => void }>;
const TabsBodyComponent = TabsBody as unknown as React.FC<{ className?: string; children: React.ReactNode; placeholder?: string; onPointerEnterCapture?: () => void; onPointerLeaveCapture?: () => void }>;
const TabPanelComponent = TabPanel as unknown as React.FC<{ className?: string; value: string; children: React.ReactNode; placeholder?: string; onPointerEnterCapture?: () => void; onPointerLeaveCapture?: () => void }>;

import React from 'react';

// Validation Error Dialog component
const ValidationErrorDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  errors,
  details
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  errors: string[];
  details?: any;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 z-10">
        <div className="text-center text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
          {title}
        </div>
        
        <div className="mb-4">
          <div className="text-base font-medium mb-2 dark:text-gray-200">Validation Errors:</div>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>
        
        {details && (
          <div className="mb-4 text-sm">
            <div className="font-medium mb-2 dark:text-gray-200">Details:</div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
              {details.standards_count === 0 && (
                <div className="flex items-center text-yellow-700 dark:text-yellow-400 mb-2">
                  <span className="mr-2">⚠️</span>
                  <span>Project has no standards defined</span>
                </div>
              )}
              
              {details.scopes_count === 0 && (
                <div className="flex items-center text-yellow-700 dark:text-yellow-400 mb-2">
                  <span className="mr-2">⚠️</span>
                  <span>Project has no scopes defined</span>
                </div>
              )}
              
              {details.vulnerabilities_count === 0 && (
                <div className="flex items-center text-yellow-700 dark:text-yellow-400 mb-2">
                  <span className="mr-2">⚠️</span>
                  <span>Project has no vulnerabilities defined</span>
                </div>
              )}
              
              {details.vulnerabilities_without_instances && details.vulnerabilities_without_instances.length > 0 && (
                <div>
                  <div className="flex items-center text-yellow-700 dark:text-yellow-400 mb-2">
                    <span className="mr-2">⚠️</span>
                    <span>Vulnerabilities without instances:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 text-xs">
                    {details.vulnerabilities_without_instances.map((vuln: any) => (
                      <li key={vuln.id}>{vuln.vulnerabilityname}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Standalone SmallPopup component with internal state management for reason field
const SmallPopup = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  onConfirm, 
  actionType, 
  initialReason = ''
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  message: string; 
  onConfirm: (reason?: string) => void; 
  actionType?: string;
  initialReason?: string;
}) => {
  const [reason, setReason] = useState(initialReason);
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    onConfirm(reason);
  };
    return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 rounded shadow-md w-80 p-4 z-10">
        <div className="text-center text-base font-semibold p-0 mb-2 dark:text-gray-200">
          {title}
        </div>
        <div className="text-center text-sm text-gray-600 dark:text-gray-300 p-0 mb-3">
          {message}
        </div>
        
        {actionType === 'On Hold' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason for hold:
            </label>
            <textarea 
              className="w-full px-3 py-2 text-sm border rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={reason}
              placeholder="Please enter a reason for placing the project on hold"
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
        )}
        
        <div className="flex justify-center space-x-4 p-0">
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 text-sm bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

function ProjectView(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams();
  const { id, tab} = params;
  const [selectedTab, setSelectedTab] = useState(tab || 'summary');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | undefined>();
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loadingError, setLoadingError] = useState(false);
  const [editingOwner, setEditingOwner] = useState(false);
  const [owner, setOwner] = useState<string[]>([]);  const [ownerError, setOwnerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState<{ isOpen: boolean; title?: string; message?: string; onConfirm?: (reason?: string) => void; onClose?: () => void; actionType?: string; initialReason?: string }>({ isOpen: false });
  const [reasonForHold, setReasonForHold] = useState('');
  // Add state for validation errors
  const [validationErrors, setValidationErrors] = useState<{ isOpen: boolean; errors: string[]; details?: any }>({ 
    isOpen: false, 
    errors: [] 
  });
  // Add ref to track retest component for reloads
  const retestComponentRef = useRef<{ loadRetests: () => void } | null>(null);
  
  const handleOwnerChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (Array.isArray(e.target.value)) {
      setOwner(e.target.value.map(owner => owner.trim()));
    } else if (typeof e.target.value === 'string') {
      setOwner(e.target.value.split(',').map(owner => owner.trim()));
    }
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
      toast.success("Project owner updated successfully");
    } catch (error) {
      console.error("Error saving owner:", error);
      setOwnerError("Error saving owner");
      toast.error("Error updating project owner");
      setEditingOwner(true);
    } finally {
      setSaving(false);
    }
  };

  const confirmAction = (action: string, callback: (reason?: string) => void) => {
    setPopup({
      isOpen: true,
      title: `Confirm ${action}`,
      message: `Are you sure you want to mark this project as ${action}? A notification email will be sent to the customer about this action.`,
      actionType: action,
      initialReason: action === 'On Hold' ? reasonForHold : '',
      onConfirm: (reason) => {
        callback(reason);
        setPopup({ isOpen: false });
      },
      onClose: () => setPopup({ isOpen: false })
    });
  };
  const markAsCompleted = async () => {
    confirmAction('Completed', async () => {
      setSaving(true);
      try {
        const result = await markProjectAsCompleted(Number(id));
        
        if (result.success) {
          setProject(prev => prev ? { ...prev, status: 'Completed' } : prev);
          toast.success("Project successfully marked as completed");
          // Reload retests after project status change
          if (retestComponentRef.current) {
            retestComponentRef.current.loadRetests();
          }
        } else {
          // Handle validation errors
          setValidationErrors({
            isOpen: true, 
            errors: result.validation_errors || ["Project cannot be marked as complete."],
            details: result.details
          });
          console.error("Project validation errors:", result.validation_errors);
        }
      } catch (error) {
        console.error("Error updating project:", error);
        toast.error("Error updating project");
      } finally {
        setSaving(false);
      }
    });
  };
  const markAsOpen = async () => {
    setSaving(true);
    try {
      const response = await markProjectAsOpen(Number(id));
      const { latest_status } = response.data;
      setProject(prev => prev ? { ...prev, status: latest_status } : prev);
      toast.success("Project successfully reopened");
      // Reload retests after project status change
      if (retestComponentRef.current) {
        retestComponentRef.current.loadRetests();
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Error updating project");
    } finally {
      setSaving(false);
    }
  };
  const markAsHold = async () => {
    confirmAction('On Hold', async (reason) => {
      setSaving(true);
      try {
        await markProjectAsHold(Number(id), reason || '');
        setProject(prev => prev ? { ...prev, status: 'On Hold', reason_for_hold: reason || '' } : prev);
        toast.success("Project successfully placed on hold");
        // Reset reason after successful update
        setReasonForHold('');
        // Reload retests after project status change
        if (retestComponentRef.current) {
          retestComponentRef.current.loadRetests();
        }
      } catch (error) {
        console.error("Error updating project:", error);
        toast.error("Error updating project");
      } finally {
        setSaving(false);
      }
    });
  };

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        setLoading(true);
        try {
          const projectData = await getProject(id) as Project;
          setProject(projectData);
          setOwner(projectData.owner || '');
          const scopes = await loadScopes();
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
  const loadScopes = async () => {
    const scopes = await getProjectScopes(id) as Scope[];
    return scopes;
  }
  useEffect(() => {
    navigate(`/projects/${id}/${selectedTab}`);
  }, [selectedTab]);  if (loading) return <FormSkeleton numInputs={6} className='max-w-lg' />;
  if (loadingError) return <ModalErrorMessage message={"Error loading project"} />;
  
  return (
    <>
      {/* Validation Error Dialog */}
      <ValidationErrorDialog 
        isOpen={validationErrors.isOpen} 
        onClose={() => setValidationErrors({ isOpen: false, errors: [] })} 
        title="Unable to Mark Project as Complete" 
        errors={validationErrors.errors}
        details={validationErrors.details}
      />
      
      {/* Confirmation Popup */}
      <SmallPopup 
        isOpen={popup.isOpen}
        onClose={() => setPopup({ isOpen: false })}
        title={popup.title || ''}
        message={popup.message || ''}
        onConfirm={popup.onConfirm || (() => {})}
        actionType={popup.actionType}
        initialReason={popup.initialReason}
      />
      
      {project && (
        <Tabs value={selectedTab} className="material-tailwind-tabs">
          <div className="max-w-screen flex-1 rounded-lg bg-white dark:bg-gray-800 dark:text-white px-6 pb-8">
            <PageTitle title='Project Details' />            <TabsHeaderComponent className='mt-4 tabs-header'>
              <TabComponent 
                key="summary" 
                value="summary" 
                onClick={() => setSelectedTab('summary')} 
                className={`tab ${selectedTab === 'summary' ? 'active-tab' : ''}`}
              >
                Summary
              </TabComponent>
              <TabComponent 
                key="vulnerabilities" 
                value="vulnerabilities" 
                onClick={() => setSelectedTab('vulnerabilities')} 
                className={`tab ${selectedTab === 'vulnerabilities' ? 'active-tab' : ''}`}
              >
                Vulnerabilities
              </TabComponent>
              <TabComponent 
                key="scopes" 
                value="scopes" 
                onClick={() => setSelectedTab('scopes')} 
                className={`tab ${selectedTab === 'scopes' ? 'active-tab' : ''}`}
              >
                Scopes
              </TabComponent>
              <TabComponent 
                key="retest" 
                value="retest" 
                onClick={() => setSelectedTab('retest')} 
                className={`tab ${selectedTab === 'retest' ? 'active-tab' : ''}`}
              >
                Retest
              </TabComponent>
              <TabComponent 
                key="reports" 
                value="reports" 
                onClick={() => setSelectedTab('reports')} 
                className={`tab ${selectedTab === 'reports' ? 'active-tab' : ''}`}
              >
                Reports
              </TabComponent>
            </TabsHeaderComponent>            <TabsBodyComponent className="tab-body mt-1">              <TabPanelComponent value="summary" className="tab-panel">
                {currentUserCan('Manage Projects') && (
                  <div className="flex justify-between items-center mb-6">
                    <Link className='inline-flex items-center px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-all shadow-sm hover:shadow' to={`/projects/${project.id}/edit`}>
                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                      Edit Project
                    </Link>
                  </div>
                )}
                <div className="w-full">                  <div className="panel-card mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left column - Project name, status and action buttons */}
                      <div>
                        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-3">{project.name}</h2>
                        
                        <div className="mb-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getProjectStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        
                        {project.status === 'On Hold' && project.reason_for_hold && (
                          <div className="mb-4 text-sm border-l-4 border-yellow-500 pl-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-r-md">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Reason for hold:</span> 
                            <p className="mt-1 text-gray-600 dark:text-gray-400">{project.reason_for_hold}</p>
                          </div>
                        )}
                        
                        {currentUserCan('Manage Projects') && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.status !== 'Completed' && project.status !== 'On Hold' && (
                              <>
                                <button 
                                  className="flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors duration-200"
                                  onClick={markAsCompleted}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Mark Complete
                                </button>                                <button 
                                  className="flex items-center px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm transition-colors duration-200"
                                  onClick={markAsHold}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Mark Hold
                                </button>
                              </>
                            )}
                            {(project.status === 'Completed' || project.status === 'On Hold') && (
                              <button 
                                className="flex items-center px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition-colors duration-200"
                                onClick={markAsOpen}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                Reopen Project
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right column - Project details grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                          <div className="text-gray-900 dark:text-white">{project.companyname}</div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Type</label>
                          <div className="text-gray-900 dark:text-white">{project.projecttype}</div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Testing Type</label>
                          <div className="text-gray-900 dark:text-white">{project.testingtype}</div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Standards</label>
                          <div className="text-gray-900 dark:text-white">
                            {project.standard?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {project.standard.map((std, index) => (
                                  <span key={index} className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs">
                                    {std}
                                  </span>
                                ))}
                              </div>
                            ) : 'None'}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                          <div className="text-gray-900 dark:text-white">{project.startdate}</div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                          <div className="text-gray-900 dark:text-white">{project.enddate}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                    <div className="panel-card mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Team</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Owner</label>
                      <div className="relative cursor-text text-gray-900 dark:text-white">
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
                                className='bg-primary text-white px-3 py-1 rounded-md mr-4 disabled:opacity-50 dark:text-white text-sm'
                                disabled={saving}
                                onClick={saveOwner}>
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              {!saving && (
                                <button className='text-gray-600 dark:text-gray-400 underline text-sm' onClick={cancelEditing}>
                                  Cancel
                                </button>
                              )}
                            </div>
                            {ownerError && <FormErrorMessage message={ownerError} />}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div>
                              {project.owner?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {project.owner.map((owner, index) => (
                                    <span key={index} className="inline-flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                                      {owner.trim()}
                                    </span>
                                  ))}
                                </div>
                              ) : 'None assigned'}
                            </div>
                            {(currentUserCan('Manage Projects') && currentUserCan('Assign Projects')) && (
                              <button className="ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setEditingOwner(true)}>
                                <PencilSquareIcon className="inline w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                    <div className="panel-card">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Details</h3>
                    
                    {project.projectexception && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Exception</label>
                        <div className="prose dark:prose-invert max-w-none border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800">
                          <CKWrapper
                            id="projectexception"
                            data={project.projectexception}
                            onChange={(id, data) => {
                              console.log("Edit not allowed, read-only mode");
                            }}
                            readOnly={true}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <div className="prose dark:prose-invert max-w-none border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800">
                        <CKWrapper
                          id="description"
                          data={project.description}
                          onChange={(id, data) => {
                            console.log("Edit not allowed, read-only mode");
                          }}
                          readOnly={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>              </TabPanelComponent>              <TabPanelComponent value="vulnerabilities" className="tab-panel">
                <VulnerabilityTable 
                  projectId={Number(id)} 
                  projectStatus={project?.status} 
                  isProjectCompleted={project?.status === 'Completed'} 
                  scopeCount={scopes.length}
                />
              </TabPanelComponent>
              <TabPanelComponent value="scopes" className="tab-panel">
                <ScopeTable projectId={Number(id)} onScopesChange={setScopes} />
              </TabPanelComponent>
              <TabPanelComponent value="retest" className="tab-panel">                <Retests 
                  project={project} 
                  onProjectStatusChange={(updatedProject) => {
                    if (updatedProject.status) {
                      setProject(prev => prev ? { ...prev, status: updatedProject.status || 'Open' } : prev);
                    }
                  }}
                  ref={retestComponentRef as any}
                />
              </TabPanelComponent>
              <TabPanelComponent value="reports" className="tab-panel">
                <div className="mt-4 max-w-lg"> 
                  <ReportForm projectId={Number(id)} scopeCount={scopes.length} />
                </div>
              </TabPanelComponent>
            </TabsBodyComponent>
          </div>
        </Tabs>
      )}
      <SmallPopup 
        isOpen={popup.isOpen} 
        title={popup.title || ''} 
        message={popup.message || ''} 
        onConfirm={popup.onConfirm || (() => {})} 
        onClose={popup.onClose || (() => {})} 
        actionType={popup.actionType}
        initialReason={popup.initialReason}
      />
    </>
  );
}


export default WithAuth(ProjectView);