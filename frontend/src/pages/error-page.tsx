import { useNavigate } from "react-router-dom";

interface ErrorPageProps {
  is404?: boolean;
  message?: string;
}
export function ErrorPage(props: ErrorPageProps) {
  const {is404, message} = props
  const navigate = useNavigate();
  const handleBack = () =>{
    navigate(-1);
  }
  
  return (
    <div className="bg-gray-200 w-full min-w-96 px-0 md:px-16 h-screen flex items-start justify-center md:justify-start">
    <div className="bg-white border border-gray-200 w-full md:max-w-md flex flex-col items-center justify-center px-0 md:px-8 lg:px-24 py-8 rounded-lg shadow-2xl">
        <p className="text-6xl md:text-7xl lg:text-7xl font-bold tracking-wider text-gray-300">
          {is404 ? "404" : "Oops!"}
        </p>
        <p className="text-center text-2xl w-96 md:text-3xl lg:text-5xl font-bold tracking-wider text-secondary my-4 md:my-20">
          {is404 ? "Not Found" : message ? message : " Something went wrong."}
        </p>
        {is404 &&
        <button onClick={handleBack} className="flex items-center space-x-2 text-white bg-primary px-4 py-2 mt-6 rounded" title="Go Back">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"></path>
            </svg>
            <span>Back</span>
        </button>
}
    </div>
</div>
  );
}

export default ErrorPage;