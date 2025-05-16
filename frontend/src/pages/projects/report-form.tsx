import { useState, useEffect, ChangeEvent } from 'react';
import { getProjectReport } from '../../lib/data/api';
import { Scope } from '../../lib/data/definitions';
import 'react-datepicker/dist/react-datepicker.css';
import { StyleTextfield, FormErrorMessage } from '../../lib/formstyles';
import { toast } from 'react-hot-toast';

interface ReportFormProps {
  projectId: number;
  scopeCount: number;
}
export default function ReportForm(props: ReportFormProps) {
  const { projectId } = props;
  const [scopeCount, setScopeCount] = useState(props.scopeCount);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    projectId,
    Format: '',
    Type: ''
  });
  const [loading, setLoading] = useState(false);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const isValid = () => {
    return formData.Format && formData.Type;
  };

  useEffect(() => {
    setScopeCount(props.scopeCount);
  }, [props]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await getProjectReport(formData);
      const contentType_JSON = response.headers['content-type'];
      if (contentType_JSON == "application/json") {
        const text = await response.data.text();
        const responseData = JSON.parse(text);
        if (responseData.Status == "Failed") {
          setError(responseData.Message);
          setLoading(false);
          return;
        }
      }
      setLoading(true);
      setError("");
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'report';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].split(';')[0].replace(/"/g, '');
      }
      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      if (formData.Format === 'pdf') {
        const pdfURL = URL.createObjectURL(blob);
        const newWindow = window.open(pdfURL);
        if (newWindow) {
          newWindow.onload = () => {
            const a = newWindow.document.createElement('a');
            a.href = pdfURL;
            a.download = filename;
            newWindow.document.body.appendChild(a);
            a.click();
            newWindow.document.body.removeChild(a);
          };
        }
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success('Report downloaded');
    } catch (error) {
      setError("Error fetching report");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  if (scopeCount === 0) {
    return (
      <>
        <FormErrorMessage message="No scopes defined" />
        <p>Please add at least one scope to this project to generate a report.</p>
      </>
    );
  }

  return (
    <>
      {error && <FormErrorMessage message={error} />}
      <label htmlFor='Format' className='dark:text-white'>Format</label>
      <select name='Format' id='Format' className={StyleTextfield} onChange={handleChange}>
        <option className="dark:bg-gray-800 dark:text-white" value="">Select...</option>
        <option className="dark:bg-gray-800 dark:text-white" value="pdf">PDF</option>
        <option className="dark:bg-gray-800 dark:text-white" value="docx">Microsoft Word</option>
        <option className="dark:bg-gray-800 dark:text-white" value="excel">Microsoft Excel</option>
      </select>
      <label htmlFor='Type' className='dark:text-white'>Type</label>
      <select name='Type' id='Type' className={StyleTextfield} onChange={handleChange}>
        <option className="dark:bg-gray-800 dark:text-white" value="">Select...</option>
        <option className="dark:bg-gray-800 dark:text-white" value="Audit">Audit</option>
        <option className="dark:bg-gray-800 dark:text-white" value="Re-Audit">Re-Audit</option>
      </select>
      <button className='bg-primary text-white p-2 rounded-md block mt-6 disabled:opacity-50' disabled={loading || !isValid()} onClick={fetchReport}>Fetch Report</button>
    </>
  );
}

