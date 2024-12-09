import { useState, useEffect, ChangeEvent, useRef } from 'react';
import {  fetchProjectRetests,
          deleteProjectRetest,
          markProjectRetestComplete
        } from '../../lib/data/api';
import { Project } from '../../lib/data/definitions';
import 'react-datepicker/dist/react-datepicker.css';
import { FormErrorMessage } from '../../lib/formstyles';
import RetestForm from './retest-form';
import { toast } from 'react-hot-toast';
import{ TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';



export default function Retests({ project }: { project: Project }) {
  const [retests, setRetests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRetestModal, setShowRetestModal] = useState(false);
  const loadRetests = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectRetests(project.id);
      setRetests(data);
    } catch (error) {
      setError("Error fetching retests");
    } finally {
      setLoading(false);
    }
  };

  const markRetestComplete = async (id: number) => {
    try {
      await markProjectRetestComplete(id);
      setRetests(prev => prev.map(retest => retest.id === id ? { ...retest, status: 'Completed' } : retest));
    } catch (error) {
      setError("Error marking retest as complete");
      toast.error("Error marking retest as complete");
    }
  };

  const deleteRetest = async (id: number) => {
    if(!confirm('Are you sure you want to delete this retest?')) return;
    try {
      await deleteProjectRetest(id);
      setRetests(prev => prev.filter(retest => retest.id !== id));
    } catch (error) {
      setError("Error deleting retest");
      toast.error("Error deleting retest");
    }
  };
  const canAddRetest = () => {
    if(project.status !== 'Completed'){
      return false;
    };
    if(retests.length >= 1){
      if (retests.some(retest => retest.status !== 'Completed')) {
        return false;
      }
    };
    return true;
  };
  useEffect(() => {
    loadRetests();
  }, []);
  if (loading) return <div>Loading...</div>;
  return (
    <>
      <div className="max-w-lg ">
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
        <div className="min-w-full bg-white dark:bg-black">
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
                {retest.status !== 'Completed' ? (
                  <>
                    <CheckCircleIcon onClick={() => markRetestComplete(retest.id)} className="inline w-5 cursor-pointer  dark:text-white "/>
                  </>
                ) : (
                  <CheckCircleIcon className="inline w-5 text-green-500"/>
                )}
                <TrashIcon onClick={() => deleteRetest(retest.id)} className="inline w-5 ml-1 cursor-pointer  dark:text-white" />
              </div>
              <div className="w-1/5 dark:text-white">{retest.startdate}</div>
              <div className="w-1/5 dark:text-white">{retest.enddate}</div>
              <div className="w-1/5 dark:text-white">{retest.status}</div>
              <div className="w-1/5 dark:text-white">{retest.owner.join(', ')}</div>
            </div>
          ))}
        </div>
        {project.id && (
          <RetestForm 
            projectId={project.id}
            onClose={() => setShowRetestModal(false)}   
            open={showRetestModal}    
            afterSave={loadRetests} 
          />
        )}
      </div>
    </>
  );
}

