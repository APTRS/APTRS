import { useState, useEffect, ChangeEvent } from 'react';
import {  fetchReportStandards, 
          getProjectReport
        } from '../../lib/data/api';
import { Scope } from '../../lib/data/definitions';
import 'react-datepicker/dist/react-datepicker.css';
import { StyleTextfield, FormErrorMessage, StyleCheckbox } from '../../lib/formstyles';
import { toast } from 'react-hot-toast';


interface ReportFormProps {
  projectId: number;
  scopeCount: number;
}
export default function ReportForm(props: ReportFormProps) {
  const {projectId} = props
  const [scopeCount, setScopeCount] = useState(props.scopeCount)
  const [error, setError] = useState('');
  const [standards, setStandards] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    projectId,
    Format: '',
    Type: '',
    Standard: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { Standard } = formData;
    if (Standard.includes(event.target.value)) {
      setFormData({ ...formData, Standard: Standard.filter(item => item !== event.target.value) });
    } else {
      setFormData({ ...formData, Standard: [...Standard, event.target.value] });
    }
  };
  

  const isValid = () => {
    return formData.Format && formData.Type && formData.Standard.length > 0;
  };

  const loadStandards = async () => {
    const data = await fetchReportStandards();
    setStandards(data);
  };

  useEffect(() => {
    setScopeCount(props.scopeCount)
  }, [props]);

  useEffect(() => {
    loadStandards();
  }, []);
  
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
        <option value="">Select...</option>
        <option value="pdf">PDF</option>
        <option value="docx">Microsoft Word</option>
        <option value="excel">Microsoft Excel</option>
      </select>
      <label htmlFor='Type'className='dark:text-white'>Type</label>
      <select name='Type' id='Type' className={StyleTextfield} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="Audit">Audit</option>
        <option value="Re-Audit">Re-Audit</option>
      </select>
      <div className='mt-4'>
        {standards.map((standard: any) => (
          <div key={standard.id}>
            <input
              type="checkbox"
              id={`Standard_${standard.id}`}
              name="Standard[]"
              value={standard.name}
              className={StyleCheckbox + 'dark:text-white'}
              onChange={handleCheckboxChange}
            />
            <label className='ml-2 dark:text-white' htmlFor={`Standard_${standard.id}`}>
              {standard.name}
            </label>
          </div>
        ))}
      </div>
      <button className='bg-primary text-white p-2 rounded-md block mt-6 disabled:opacity-50' disabled={loading || !isValid()} onClick={fetchReport}>Fetch Report</button>
    </>
  );
}

