import { useNavigate } from "react-router-dom";

export function AccessDenied() {
  const navigate = useNavigate();
  const handleBack = () =>{
    navigate(-1);
  }
  
  return (
    <div className="bg-gray-200 w-full px-16 md:px-0 h-screen flex items-start justify-center  max-w-lg">
    <div className="bg-white border border-gray-200 flex flex-col items-center justify-center px-4 md:px-8 lg:px-24 py-8 rounded-lg shadow-2xl">
        <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-wider text-gray-300">Access Denied</p>
        <p className="text-xl md:text-xl lg:text-xl font-bold tracking-wider text-gray-500 mt-4">You do not have permisson to do that.</p>
        <button onClick={handleBack} className="flex items-center space-x-2 text-white bg-primary px-4 py-2 mt-6 rounded" title="Go Back">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"></path>
            </svg>
            <span>Back</span>
        </button>
    </div>
</div>
  );
}

export default AccessDenied