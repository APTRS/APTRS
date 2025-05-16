import React, { useState, useEffect, ChangeEvent, useRef, forwardRef, useImperativeHandle } from 'react';
import {  fetchProjectRetests,
          deleteProjectRetest,
          markProjectRetestComplete,
          markProjectRetestHold
        } from '../../lib/data/api';
import { Project } from '../../lib/data/definitions';
import 'react-datepicker/dist/react-datepicker.css';
import { FormErrorMessage } from '../../lib/formstyles';
import RetestForm from './retest-form';
import { toast } from 'react-hot-toast';
import{ TrashIcon, CheckCircleIcon, PauseCircleIcon } from '@heroicons/react/24/outline';

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
              placeholder="Please enter a reason for placing the retest on hold"
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

// Helper function to get status string based on retest fields
const getRetestStatus = (retest: any): string => {
  if (retest.is_completed) {
    return 'Completed';
  }
  
  if (!retest.is_active) {
    return 'On Hold';
  }
  
  // If active but not completed, calculate status based on dates
  const currentDate = new Date();
  const startDate = new Date(retest.startdate);
  const endDate = new Date(retest.enddate);
  
  if (currentDate < startDate) {
    return 'Upcoming';
  } else if (currentDate <= endDate) {
    return 'In Progress';
  } else {
    return 'Delay';
  }
};

interface RetestsProps {
  project: Project;
  onProjectStatusChange?: (updatedProject: Partial<Project>) => void;
}

// Export interface for ref type
export interface RetestsRef {
  loadRetests: () => Promise<void>;
}

// Convert to forwardRef component
const Retests = forwardRef<RetestsRef, RetestsProps>(({ project, onProjectStatusChange }, ref) => {
  const [retests, setRetests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRetestModal, setShowRetestModal] = useState(false);  const [reasonForHold, setReasonForHold] = useState('');
  const [popup, setPopup] = useState<{ isOpen: boolean; title?: string; message?: string; onConfirm?: (reason?: string) => void; onClose?: () => void; actionType?: string; initialReason?: string }>({ isOpen: false });
  // Add state for validation errors
  const [validationErrors, setValidationErrors] = useState<{ isOpen: boolean; errors: string[]; details?: any }>({ 
    isOpen: false, 
    errors: [] 
  });
  
  // Expose the loadRetests function to parent component via ref
  const loadRetests = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectRetests(project.id);
      setRetests(data);
    } catch (error) {
      setError("No Retests found");
    } finally {
      setLoading(false);
    }
  };

  // Make the loadRetests function available via ref
  useImperativeHandle(ref, () => ({
    loadRetests
  }));
  
  // Handler for after a new retest is added
  const afterRetestSave = async () => {
    // Reload retests to get the newly created one
    await loadRetests();
    
    // If a new active retest is added, it should change the project status
    if (onProjectStatusChange && retests.length > 0) {
      // Find the most recently created retest (at the end of the array)
      // Since API adds new retests at the end of the array
      const mostRecentRetest = retests[retests.length - 1];
      
      // Calculate the expected project status based on the most recent retest's dates
      let expectedStatus = 'In Progress';
      
      // Update status based on the new retest (which will be active and not completed)
      if (mostRecentRetest && mostRecentRetest.is_active && !mostRecentRetest.is_completed) {
        const currentDate = new Date();
        const startDate = new Date(mostRecentRetest.startdate);
        const endDate = new Date(mostRecentRetest.enddate);
        
        if (currentDate < startDate) {
          expectedStatus = 'Upcoming';
        } else if (currentDate <= endDate) {
          expectedStatus = 'In Progress';
        } else {
          expectedStatus = 'Delay';
        }
      }
      
      // Update the parent component with the calculated status
      onProjectStatusChange({ status: expectedStatus });
    }
  };

  const confirmAction = (action: string, callback: (reason?: string) => void) => {
    setPopup({
      isOpen: true,
      title: `Confirm ${action}`,
      message: `Are you sure you want to mark this retest as ${action}? A notification email will be sent to the customer about this action.`,
      actionType: action,
      initialReason: action === 'On Hold' ? reasonForHold : '',
      onConfirm: (reason) => {
        callback(reason);
        setPopup({ isOpen: false });
      },
      onClose: () => setPopup({ isOpen: false })
    });
  };
  const markRetestComplete = async (id: number) => {
    confirmAction('Completed', async () => {
      try {
        const result = await markProjectRetestComplete(id);
        
        if (result.success) {
          setRetests(prev => prev.map(retest => retest.id === id ? { ...retest, is_active: false, is_completed: true } : retest));
          toast.success("Retest marked as completed");
          
          // Update parent component with new project status if available
          if (result.data?.project_status && onProjectStatusChange) {
            onProjectStatusChange({ status: result.data.project_status });
          }
        } else {
          // Handle validation errors
          setValidationErrors({
            isOpen: true, 
            errors: result.validation_errors || ["Retest cannot be marked as complete."],
            details: result.details
          });
          console.error("Retest validation errors:", result.validation_errors);
          toast.error("Could not complete retest due to validation errors");
        }
      } catch (error) {
        console.error("Error marking retest as completed:", error);
        setError("Error marking retest as completed");
        toast.error("Error marking retest as completed");
      }
    });
  };  const markRetestHold = async (id: number) => {
    confirmAction('On Hold', async (reason) => {
      try {
        const response = await markProjectRetestHold(id, reason || '');
        
        if (response.success === false) {
          // Handle validation errors
          setValidationErrors({
            isOpen: true, 
            errors: response.validation_errors || ["Retest cannot be marked as on hold."]
          });
          toast.error("Could not place retest on hold due to validation errors");
          return;
        }
        
        setRetests(prev => prev.map(retest => retest.id === id ? { ...retest, is_active: false, is_completed: false } : retest));
        // Reset reason after successful update
        setReasonForHold('');
        toast.success("Retest marked as on hold");
        
        // Update parent component with new project status if available
        if (response?.project_status && onProjectStatusChange) {
          onProjectStatusChange({ status: response.project_status, reason_for_hold: reason });
        }
      } catch (error) {
        console.error("Error marking retest as on hold:", error);
        setError("Error marking retest as on hold");
        toast.error("Error marking retest as on hold");
      }
    });
  };
  const deleteRetest = async (id: number) => {
    if(!confirm('Are you sure you want to delete this retest?')) return;
    try {
      await deleteProjectRetest(id);
      setRetests(prev => prev.filter(retest => retest.id !== id));
      toast.success("Retest deleted successfully");
    } catch (error) {
      console.error("Error deleting retest:", error);
      setError("Error deleting retest");
      toast.error("Error deleting retest");
    }
  };
  
  const canAddRetest = () => {
    if(project.status !== 'Completed'){
      return false;
    };
    if(retests.length >= 1){
      // Check if all existing retests are completed
      if (retests.some(retest => !retest.is_completed)) {
        return false;
      }
    };
    return true;
  };
  
  const shouldShowMarkComplete = (retest: any): boolean => {
    // Don't show for completed or upcoming retests
    if (retest.is_completed) return false;
    
    const currentDate = new Date();
    const startDate = new Date(retest.startdate);
    
    // Don't show for upcoming retests
    if (currentDate < startDate) return false;
    
    return true;
  };
  
  const shouldShowMarkHold = (retest: any): boolean => {
    // Only show for active, non-completed retests
    return retest.is_active && !retest.is_completed;
  };
  
  useEffect(() => {
    loadRetests();
  }, []);
    if (loading) return <div>Loading...</div>;
  return (
    <>
      {/* Validation Error Dialog */}
      <ValidationErrorDialog 
        isOpen={validationErrors.isOpen} 
        onClose={() => setValidationErrors({ isOpen: false, errors: [] })} 
        title="Unable to Mark Retest as Complete" 
        errors={validationErrors.errors}
        details={validationErrors.details}
      />
      
      <div className="">
      {project.status !== 'Completed' && (
          <p className='mt-4 dark:text-white'>You may only add retests to completed projects and if all previous retests are completed.</p>
        )}
        {canAddRetest() && (
          <button 
            className="bg-primary text-white p-2 rounded-md mt-4"
            onClick={() => setShowRetestModal(true)}
          >
            Add New Retest
          </button>
        )}
        <div className="min-w-full bg-white dark:bg-gray-800">
          {error && <FormErrorMessage message={error} />}
          <div className="flex py-2 px-4 border-b">
            <div className="w-1/5 dark:text-white">&nbsp;</div>
            <div className="w-1/5 dark:text-white">Start Date</div>
            <div className="w-1/5 dark:text-white">End Date</div>
            <div className="w-1/5 dark:text-white">Status</div>
            <div className="w-1/5 dark:text-white">Owner</div>
          </div>
          {retests?.length === 0 && <div className="py-2 px-4 border-b">No retests found</div>}
          {retests?.map((retest) => (
            <div key={retest.id} className="flex py-2 px-4 border-b">
              <div className="w-1/5 mr-2">
                {/* Action buttons based on retest state */}
                {shouldShowMarkComplete(retest) && (
                  <CheckCircleIcon 
                    onClick={() => markRetestComplete(retest.id)} 
                    className="inline w-5 cursor-pointer dark:text-white"
                    title="Mark Complete"
                  />
                )}
                {retest.is_completed && (
                  <CheckCircleIcon className="inline w-5 text-green-500" title="Completed"/>
                )}
                {shouldShowMarkHold(retest) && (
                  <PauseCircleIcon 
                    onClick={() => markRetestHold(retest.id)} 
                    className="inline w-5 ml-1 cursor-pointer dark:text-white"
                    title="Mark On Hold" 
                  />
                )}
                <TrashIcon 
                  onClick={() => deleteRetest(retest.id)} 
                  className="inline w-5 ml-1 cursor-pointer dark:text-white"
                  title="Delete Retest"
                />
              </div>
              <div className="w-1/5 dark:text-white">{retest.startdate}</div>
              <div className="w-1/5 dark:text-white">{retest.enddate}</div>
              <div className="w-1/5 dark:text-white">{getRetestStatus(retest)}</div>
              <div className="w-1/5 dark:text-white">{retest.owner.join(', ')}</div>
            </div>
          ))}
        </div>
        {project.id && (
          <RetestForm 
            projectId={project.id}
            onClose={() => setShowRetestModal(false)}   
            open={showRetestModal}    
            afterSave={afterRetestSave} 
          />        )}
      </div>
      
      {/* Confirmation Popup */}
      <SmallPopup 
        isOpen={popup.isOpen} 
        title={popup.title || ''} 
        message={popup.message || ''} 
        actionType={popup.actionType}
        initialReason={popup.initialReason}
        onConfirm={popup.onConfirm || (() => {})} 
        onClose={popup.onClose || (() => {})} 
      />
    </>
  );
});

export default Retests;

