import {  Company, 
          Project, 
          User,
          LoginUser, 
          IPAddressInfo,
          Vulnerability,
          VulnerabilityInstance,
          FilteredSet,
          Group } from './definitions'
import axios, { AxiosResponse, AxiosError } from 'axios'
interface AuthHeaders {
  headers: Record<string, string>;
}
function redirectIfUnauthorized(response: AxiosResponse): boolean | void {
  if(response?.status === 401){
    logout()
    return true
  } 
  return false
}

axios.defaults.withCredentials = true;

let response: AxiosResponse | AxiosError | undefined;
async function getOrRedirect(url: string, params?: any): Promise<any> {
  try {
    response = await axios.get(url, params);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        if(!redirectIfUnauthorized(error.response)){
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
  return response as AxiosResponse;
}
async function postOrRedirect(url: string, params?: any, headers?: any): Promise<AxiosResponse> {
  let response: AxiosResponse | AxiosError;
  try {
    response = await axios.post(url, params, headers);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        if(!redirectIfUnauthorized(error.response)){
          throw error;
        }
        response = error;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
  return response as AxiosResponse;
}
async function deleteOrRedirect(url: string, params?: any): Promise<AxiosResponse> {
  let response: AxiosResponse | AxiosError;
  try {
    response = await axios.delete(url, params );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        redirectIfUnauthorized(error.response);
        response = error;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
  return response as AxiosResponse;
}
export function apiUrl(endpoint:string = ''): string {
  return import.meta.env.VITE_APP_API_URL + endpoint;
}
export function uploadUrl(): string {
  return apiUrl('project/ckeditor/imageupload/')
}
export function simpleUploadConfig() {
  return {
    uploadUrl: uploadUrl(),
    withCredentials: true,
    ...authHeaders()
  }
}
export async function uploadFile(file: File) {
  const url = uploadUrl()
  const formData = new FormData()
  formData.append('upload', file)
  const config: AuthHeaders = authHeaders()
  config.headers['content-type'] = 'multipart/form-data'
  const response = await postOrRedirect(url, formData, config)
  return response.data
}
export function authHeaders(): { headers: Record<string, string> } {
  const token = getAuthUser()?.access;
  const header = { headers: {'Authorization': `Bearer ${token}`} }
  return header;
}

export function setAuthUser(user: LoginUser): void {
  const jsonUser = JSON.stringify(user);
  localStorage.setItem('user', jsonUser);
  localStorage.setItem('lastRefresh', new Date().toISOString())
}

export function getAuthUser(): LoginUser | null {
  return _userObject()
}
//private function to get the user object from local storage
function _userObject(): LoginUser | null {
  const jsonUser = localStorage.getItem('user');
  if(jsonUser !== null) {
    return JSON.parse(jsonUser) as LoginUser;
  }
  return null;
}

export function shouldRefreshToken(): boolean {
  const lastRefresh = localStorage.getItem('lastRefresh')
  if(!lastRefresh) return true;
  const last = new Date(lastRefresh)
  const now = new Date()
  const diff = now.getTime() - last.getTime()
  return diff > 1000 * 60 * 28
}

export async function login(email: string, password:string) {
  const url = apiUrl('auth/login/');
  // login failure throws a 401 unauthorized exception
  // catch it here and return boolean; otherwise throw error
  let result
  try {
    const params = { email, password }
    // const response = await axios.post(url, params, headers);
    const response = await postOrRedirect(url, params);
    result = response.data;
  } catch (error: any | unknown){
    if (axios.isAxiosError(error)) {
      if(error.response?.status == 401) {
        return false;
      } 
    }
    throw error;
  }
  if(!result?.access){
    return false;
  } else {
    const user = result as LoginUser;
    user.email = email;
    //now get the user's location
    const location = await getUserLocation()
    if(location){
      user.location = location as IPAddressInfo
    }
    setAuthUser(user)
    //now get the profile info
    const profile = await getMyProfile()
    const mergedUser: User = {
      ...user,
      ...profile
    }
    setAuthUser(mergedUser)
    
    return result;
  }
}
export async function refreshAuth() {
    const user = _userObject();
    if(!user){
      return null
    }
    try {
    const body = {refresh: user.refresh}
    const url = apiUrl('auth/token/refresh/');
    const response = await postOrRedirect(url, body, authHeaders());
    user.refresh = response.data.refresh
    user.access = response.data.access
    setAuthUser(user)
    return user;
  } catch (error) {
    logout()
    return null
  }
}
export async function logout() {
  const user = _userObject();
    if(!user){
      return null
    }
    const body = {refresh_token: user.refresh}
    const url = apiUrl('auth/logout/');
    await postOrRedirect(url, body, authHeaders());

    localStorage.removeItem('user');
    localStorage.removeItem('lastRefresh');
    } 

export async function fetchCustomers() {
  const url = apiUrl('customer/all-customer');
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function fetchFilteredCustomers(params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl(`customer/all-customer/filter`);
  const response = await getOrRedirect(url,  { params: params, ...authHeaders() });
  return response.data;
}

export async function getUserLocation(){ 
  try {
    const response = await getOrRedirect("https://ipapi.co/json/")
    return response.data
  } catch (error) {
    console.error('error getting user location', error)
    return null
  }  
}
export async function getCustomer(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`customer/customer/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function upsertCustomer(formData: Company): Promise<any> {
  let url = apiUrl(`customer/customer/add`);
  
  if (Object.keys(formData).includes('id')) {
    url = apiUrl(`customer/customer/edit/${formData['id']}/`);
  }
  const response = await postOrRedirect(url, formData, authHeaders())
  return response.data;    
}
export async function deleteCustomers(ids: any[]): Promise<any> {
  const url = apiUrl('customer/customer/delete');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}
export async function fetchProjects() {
  const url = apiUrl('project/get-projects/');
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}

export async function MyDashbaord() {
  const url = apiUrl('project/dashboard/data/');
  const response = await getOrRedirect(url, authHeaders());
  return response.data; // Return the dashboard data directly
}

// Correctly spelled version for future use
export async function MyDashboard() {
  return MyDashbaord(); // Reuse the existing function to maintain backward compatibility
}

export async function fetchFilteredProjects(params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl('project/projects/filter/');
  
  // Log the parameters being sent to the API
  console.log('API Request - fetchFilteredProjects original params:', params);
  
  // Create a new object to avoid modifying the original params
  const paramsToSend: Record<string, any> = {};
  
  // Simplified approach - format dates consistently as YYYY-MM-DD
  Object.keys(params).forEach(key => {
    const value = params[key];
    
    // Skip empty values
    if (value === '' || value === null || value === undefined) {
      return;
    }
    
    // Handle date parameters specially
    if (key === 'startdate' || key === 'enddate_before') {
      try {
        let dateStr = '';
        
        // Handle different input formats
        if (typeof value === 'string') {
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            // Already in YYYY-MM-DD format
            dateStr = value;
          } else if (value.includes('T')) {
            // ISO format - extract date part
            dateStr = value.split('T')[0];
          } else {
            // Other string formats - try to parse
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              dateStr = date.toISOString().split('T')[0];
            }
          }
        } else if (value instanceof Date) {
          // Date object - convert to YYYY-MM-DD
          dateStr = value.toISOString().split('T')[0];
        }
        
        if (dateStr) {
          paramsToSend[key] = dateStr;
          console.log(`API: ${key} set to ${dateStr}`);
        }
      } catch (error) {
        console.error(`Error formatting ${key}:`, error);
      }
    } else {
      // For non-date fields, just copy as-is
      paramsToSend[key] = value;
    }
  });
  
  // Log specific date parameters for debugging
  if ('startdate' in paramsToSend) {
    console.log('API sending startdate:', paramsToSend.startdate);
  } else {
    console.warn('startdate not in params to send');
  }
  
  if ('enddate_before' in paramsToSend) {
    console.log('API sending enddate_before:', paramsToSend.enddate_before);
  } else {
    console.warn('enddate_before not in params to send');
  }
  
  console.log('Cleaned API params:', paramsToSend);
  
  // Add a query string debugging log to verify the exact URL being called
  const queryParams = new URLSearchParams();
  Object.entries(paramsToSend).forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });
  console.log('API Request URL will include:', queryParams.toString());
  
  // Send the request with our properly formatted parameters
  const response = await getOrRedirect(url, { params: paramsToSend, ...authHeaders() });
  console.log('API Response - projects filter:', response.data);
  return response.data as FilteredSet;
}


export async function searchProjects(name:string) { 
  const url = apiUrl(`project/projects/filter?name=${name}`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
interface ProjectReportParams {
  projectId: number
  Format: string
  Type: string
}
interface APIParams {
  Format: string
  Type: string
}
export async function getProjectReport(props: ProjectReportParams) {
  //convet standard from array to string
  const { projectId, ...params } = props;
  const toSubmit: APIParams = {
    ...params,
  };
  const url = apiUrl(`project/report/${projectId}/`);
  const config = {
    responseType: 'blob' as const,
    ...authHeaders(),
    params: toSubmit,
  };
  const response = await getOrRedirect(url, config)
  return response
}
export async function fetchReportStandards() {
  const url = apiUrl('config/standards/')
  const response = await getOrRedirect(url, authHeaders());
  return response.data
}

export async function insertReportStandard(name: string) {
  const url = apiUrl('config/standards/create/')
  const response = await postOrRedirect(url, {name}, authHeaders())
  return response.data
}

export async function getReportStandard(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`config/standards/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}

export async function updateReportStandard(id: number , name: any): Promise<any> {
  const url = apiUrl(`config/standards/edit/${id}/`);
  const response = await postOrRedirect(url, name, authHeaders())
  return response.data;
}

// Note: Backend API endpoint needs to be implemented
export async function deleteReportStandard(id: number): Promise<any> {
  // TODO: Implement backend API endpoint for deleting report standards
  const url = apiUrl(`config/standards/delete/${id}/`);
  const response = await deleteOrRedirect(url, authHeaders())
  return response.data;
}

export async function insertProjectType(name: string) {
  const url = apiUrl('config/project-type/create/')
  const response = await postOrRedirect(url, {name}, authHeaders())
  return response.data
}

export async function getProjectType(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`config/project-type/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}

export async function updateProjectType(id: number , name: any): Promise<any> {
  const url = apiUrl(`config/project-type/edit/${id}/`);
  const response = await postOrRedirect(url, name, authHeaders())
  return response.data;
}

// Note: Backend API endpoint needs to be implemented
export async function deleteProjectType(id: number): Promise<any> {
  // TODO: Implement backend API endpoint for deleting project types
  const url = apiUrl(`config/project-type/delete/${id}/`);
  const response = await deleteOrRedirect(url, authHeaders())
  return response.data;
}

export async function getProject(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`project/get-project/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function getProjectScopes(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`project/scope/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function markProjectAsCompleted(id: number): Promise<any> {
  const url = apiUrl(`project/status/completed/${id}/`);
  try {
    const response = await getOrRedirect(url, authHeaders());
    return { success: true, data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      // If validation fails, return the validation errors
      return { 
        success: false, 
        error: error.response.data.message,
        validation_errors: error.response.data.validation_errors,
        details: error.response.data.details
      };
    }
    throw error;
  }
}

export async function markProjectAsHold(id: number, reason_for_hold?: string): Promise<any> {
  const url = apiUrl(`project/status/hold/${id}/`);
  const data = { reason_for_hold };
  const response = await postOrRedirect(url, data, authHeaders());
  return response.data;
}

export async function markProjectAsOpen(id: number): Promise<any> {
  const url = apiUrl(`project/status/reopen/${id}/`);
  const response = await getOrRedirect(url, authHeaders())
  return response;
}
export async function insertProjectScopes(projectId: number , scope: any): Promise<any> {
  const url = apiUrl(`project/scope/add/${projectId}/`);
  const response = await postOrRedirect(url, scope, authHeaders())
  return response.data;
}
export async function updateProjectScope(id: number , scope: any): Promise<any> {
  const url = apiUrl(`project/scope/edit/${id}/`);
  const response = await postOrRedirect(url, scope, authHeaders())
  return response.data;
}
export async function fetchProjectRetests(id: number | undefined) {
  if(!id) return null;
  const url = apiUrl(`project/Retest/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  // this endpoint returns a 404 if no retests are found, so we need to return an empty array
  return response?.data || [];
}
export async function insertProjectRetest(data: any): Promise<any> {
  const url = apiUrl(`project/Retest/add`);
  const response = await postOrRedirect(url, data, authHeaders())
  return response.data;
}
export async function deleteProjectRetest(id: number | number[]): Promise<any> {
  const url = apiUrl(`project/Retest/delete/${id}/`);
  const response = await deleteOrRedirect(url, {data: id, ...authHeaders()})
  return response.data;
}
export async function markProjectRetestComplete(id: number): Promise<any> {
  const url = apiUrl(`project/retest/status/completed/${id}/`);
  try {
    const response = await getOrRedirect(url, authHeaders());
    return { success: true, data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      // If validation fails, return the validation errors
      return { 
        success: false, 
        error: error.response.data.message,
        validation_errors: error.response.data.validation_errors,
        details: error.response.data.details
      };
    }
    throw error;
  }
}

export async function markProjectRetestHold(id: number, reason_for_hold?: string): Promise<any> {
  const url = apiUrl(`project/retest/status/hold/${id}/`);
  const data = { reason_for_hold };
  try {
    const response = await postOrRedirect(url, data, authHeaders());
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      // If validation fails, return the validation errors
      return { 
        success: false, 
        error: error.response.data.message,
        validation_errors: error.response.data.validation_errors
      };
    }
    throw error;
  }
}

export async function deleteProjectScope(id: number | number[] ): Promise<any> {
  const url = apiUrl('project/scope/delete/');
  let toDelete = Array.isArray(id) ? id : [id]
  const response = await deleteOrRedirect(url, {data: toDelete, ...authHeaders()})
  return response.data;
}

export async function deleteProjects(ids: any[]): Promise<any> {
  const url = apiUrl('project/delete-project/');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}
export async function fetchProjectTypes() {
  const url = apiUrl('config/project-type/')
  const response = await getOrRedirect(url, authHeaders());
  return response.data
}
export async function fetchProjectFindings(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`project/findings/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function getProjectVulnerability(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`project/vulnerability/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}

export async function RenderProjectVulnerability(id: string | undefined) {
  if(!id) return null;
    try {
    // The vulnerability view endpoint returns HTML, not JSON data
    const url = apiUrl(`project/vulnerability/view/${id}/`);
    
    console.log("Requesting HTML from:", url);
    
    // Use different options specifically for HTML content
    const options = {
      ...authHeaders(),
      responseType: 'text' as const,  // This ensures axios returns the response as text
      headers: {
        ...authHeaders().headers,
        'Accept': 'text/html, application/xhtml+xml, */*'  // More specific Accept header types
      }
    };

    // Make a direct axios call instead of using getOrRedirect for HTML response
    const response = await axios.get<string>(url, options);
    
    console.log("Vulnerability view API response received. Status:", response.status);
    
    // Return the HTML content
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error fetching vulnerability HTML template:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
    } else {
      console.error("Failed to fetch vulnerability HTML template:", error);
    }
    return null; 
  }
}

export async function fetchVulnerabilityInstances(id: string | number | undefined): Promise<VulnerabilityInstance[]>  {
  const url = apiUrl(`project/vulnerability/instances/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
// /api/project/vulnerability/instances/filter/<Vulneability-id>/?URL=&Parameter=&status=&limit=20&offset=0&order_by=asc&sort=id API 
export async function fetchFilteredVulnerabilityInstances(id: string | number | undefined, params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl(`project/vulnerability/instances/filter/${id}/`);
  const response = await getOrRedirect(url, { params: params, ...authHeaders() });
  return response.data;
}
export async function updateVulnerabilityStatus(id: number, status: string) {
  const url = apiUrl(`project/vulnerability/status/vulnerability/${id}/?status=${status}`);
  const response = await getOrRedirect(url, authHeaders())
  return response.data;
}
export async function bulkUpdateVulnerabilityStatus(ids: number[], status: string) {
  const url = apiUrl(`project/vulnerability/status/instances/?status=${status}`);
  const response = await postOrRedirect(url, ids, authHeaders())
  return response.data;
}

export async function deleteVulnerabilityInstances(ids: any[]): Promise<any> {
  const url = apiUrl('project/vulnerability/delete/instances/');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}

export async function deleteProjectVulnerabilities(ids: number[]): Promise<any> {
  const url = apiUrl('project/vulnerability/delete/vulnerability/');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}
export async function upsertProject(formData: Project | Partial<Project>): Promise<any> {
  let url = apiUrl(`project/add-project/`);
  if (Object.keys(formData).includes('id')) {
    url = apiUrl(`project/edit-project/${formData['id']}/`);
  }

  const response = await postOrRedirect(url, formData, authHeaders());
  return response.data;
}
export async function updateProjectOwner(formData: Partial<Project>): Promise<any> {
  const url = apiUrl('project/edit-owner/')
  const response = await postOrRedirect(url, formData, authHeaders());
  return response.data;
}

export async function insertProjectVulnerability(formData: any): Promise<any> {
  const url = apiUrl(`project/vulnerability/add/vulnerability/`)
  const data = formData
  if(formData.instances){
    data.instance = formData.instances
    delete data.instances
  }
  const response = await postOrRedirect(url, data, authHeaders());
  return response.data;
}
export async function updateProjectVulnerability(formData: any): Promise<any> {
  const url = apiUrl(`project/vulnerability/edit/${formData.id}/`)
  const data = formData
  if(formData.instances){
    data.instance = formData.instances
    delete data.instances
  }
  const response = await postOrRedirect(url, data, authHeaders());
  return response.data;
}
export async function uploadProjectVulnerabilities(projectId: number, file: File): Promise<any> {
  const url = apiUrl(`project/vulnerability/Nessus/csv/${projectId}/`)
  const config: AuthHeaders = authHeaders()
  config.headers['content-type'] = 'multipart/form-data'
  const data = {file: file} 
  const response = await postOrRedirect(url, data, config)
  return response.data
}
export async function updateProjectVulnerabilityInstance(data: any): Promise<any> {
  const url = apiUrl(`project/vulnerability/edit/instances/${data.id}/`)
  const response = await postOrRedirect(url, data, authHeaders());
  return response.data;
}
//pvid is the id of a ProjectVulnerability
export async function insertProjectVulnerabilityInstance(pvid: any, data: any[]): Promise<any> {
  const url = apiUrl(`project/vulnerability/add/instances/${pvid}/`)
  const response = await postOrRedirect(url, data, authHeaders());
  return response.data;
}
export async function updateProjectInstanceStatus(data: any): Promise<any> {
  const toSubmit = [
    data.id
  ]
  const url = apiUrl(`project/vulnerability/status/instances/?status=${data.status}`)
  const response = await postOrRedirect(url, toSubmit, authHeaders());
  return response.data;
}

export async function publishVulnerabilities(ids: number[], publish: boolean): Promise<any> {
  const url = apiUrl('project/vulnerability/findings/publish/');
  const data = { ids, publish };
  const response = await postOrRedirect(url, data, authHeaders());
  return response.data;
}

export async function fetchCompanies() {
  const url = apiUrl('customer/all-company');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function fetchFilteredCompanies(params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl(`customer/all-company/filter`);
  const response = await getOrRedirect(url,  { params: params, ...authHeaders() });
  return response.data;
}

export async function getCompany(id: string | undefined) {
  if (!id) return null;
  const url = apiUrl(`customer/company/${id}/`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function upsertCompany(formData: Company): Promise<any> {
  let url = apiUrl(`customer/company/add`);
  if (Object.keys(formData).includes('id')) {
    url = apiUrl(`customer/company/edit/${formData['id']}/`);
  }
  const headers = authHeaders()
  headers.headers['content-type'] = 'multipart/form-data'
  const response = await postOrRedirect(url, formData, headers);
  return response.data;
}

export async function deleteCompanies(ids: any[]): Promise<any> {
  const url = apiUrl('customer/company/delete');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}

export async function fetchVulnerabilities() {
  const url = apiUrl('vulndb/all-vulndb');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function fetchFilteredVulnerabilities(params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl(`vulndb/all-vulndb/filter`);
  const response = await getOrRedirect(url,  { params: params, ...authHeaders() });
  return response.data;
}
export async function searchVulnerabilities(term:string) {
  const url = apiUrl(`vulndb/filter/?search=${term}`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function getVulnerability(id: string | undefined) {
  if (!id) return null;
  const url = apiUrl(`vulndb/${id}/`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function getVulnerabilityByName(name: string | undefined) {
  if (!name) return null;
  const url = apiUrl(`vulndb/database/?title=${name}`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function upsertVulnerability(formData: Vulnerability): Promise<any> {
  let url = apiUrl(`vulndb/add-vulndb`);
  if (Object.keys(formData).includes('id')) {
    url = apiUrl(`vulndb/edit-vulndb/${formData['id']}/`);
  }
  const response = await postOrRedirect(url, formData, authHeaders());
  return response.data;
}
export async function deleteVulnerabilities(ids: any[]): Promise<any> {
  const url = apiUrl('vulndb/delete-vulndb');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}
export async function fetchGroups() {
  const url = apiUrl('auth/groups/list/');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function deleteGroups(ids: any[]): Promise<any> {
  const url = apiUrl('auth/groups/delete');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}

export async function getGroup(id: string | undefined) {
  if (!id) return null;
  const url = apiUrl(`auth/groups/${id}`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function upsertGroup(formData: Group): Promise<any> {
  let url = apiUrl(`auth/groups/create/`);
  if (Object.keys(formData).includes('id')) {
    url = apiUrl(`auth/groups/update/${formData['id']}/`);
  }
  const response = await postOrRedirect(url, formData, authHeaders());
  return response.data;
}
export async function fetchUsers() {
  const url = apiUrl('auth/users');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function fetchFilteredUsers(params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl('auth/users/filter/');
  if(params?.sort && params?.sort === ''){
    delete params.order_by
    delete params.sort
  }
  const response = await getOrRedirect(url, { params: params, ...authHeaders() });
  return response.data;
}
export async function deleteUsers(ids: any[]): Promise<any> {
  const url = apiUrl('auth/deleteuser');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}

export async function getUser(id: string | undefined) {
  if (!id) return null;
  const url = apiUrl(`auth/user/${id}`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function getMyProfile() {
  const url = apiUrl(`auth/myprofile`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function upsertUser(formData: User): Promise<any> {
  let temp = formData;
  delete temp.profilepic;
  // delete temp.id;
  if(formData.id && !formData.password){
    delete temp.password
  }
  let url = apiUrl(`auth/adduser`);
  if (formData.id) {
    url = apiUrl(`auth/edituser/${formData['id']}`);
  }
  const response = await postOrRedirect(url, temp, authHeaders());
  return response.data;
}
export async function updateProfile(formData: User, profilepic:File|null = null): Promise<any> {
  const temp = formData as any;
  delete temp.id;
  delete temp.profilepic
  const config: AuthHeaders = authHeaders()
if(profilepic) {
    config.headers['content-type'] = 'multipart/form-data'
    temp.profilepic = profilepic
  }
  const url = apiUrl(`auth/editprofile`);
  const response = await postOrRedirect(url, temp, config);
  if(response.status == 200){
    //update the underyling auth user
    const current = getAuthUser()
    const profile = response.data
    const refreshed = {
      ...current,
      ...profile
    }
    setAuthUser(refreshed)
  }
  return response.data;
}
export async function changePassword(formData: User): Promise<any> {
  const url = apiUrl(`auth/changepassword`);
  const response = await postOrRedirect(url, formData, authHeaders());
  return response.data;
  
}
export async function fetchPermissionGroups() {
  const url = apiUrl('auth/groups/list/');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function fetchPermissions() {
  const url = apiUrl('auth/list/permission/');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function fetchCWE() {
  const url = apiUrl('vulndb/cwe/');
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}

export async function fetchDashboardProjects() {
  const url = apiUrl('customer/company/projects/status');
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}

export async function fetchLastTenVulnerability() {
  const url = apiUrl('customer/company/projects/last/findings');
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}


export async function getVulnerabilityDashboardStats() {
  const url = apiUrl('customer/company/projects/vulnerability/trends');
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}

export async function getOrganizationVulnerabilityStats() {
  const url = apiUrl('customer/company/projects/vulnerability/stats');
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}

// Customer invitation functions
export const resendInvitation = async (userId: number): Promise<any> => {
  const url = apiUrl(`customer/token/invitation/resend/${userId}/`);
  const response = await postOrRedirect(url, {}, authHeaders());
  return response.data;
};

export const validateInvitationToken = async (token: string): Promise<any> => {
  const url = apiUrl(`auth/token/validate/${token}/`);
  const response = await getOrRedirect(url);
  return response.data;
};

export const acceptInvitation = async (token: string, password: string): Promise<any> => {
  const url = apiUrl(`auth/token/process/${token}/`);
  const response = await postOrRedirect(url, { password });
  return response.data;
};

export const requestPasswordReset = async (email: string): Promise<any> => {
  const url = apiUrl(`auth/token/reset/request/`);
  const response = await postOrRedirect(url, { email });
  return response.data;
};



export const CustomerProjectDetails = async (): Promise<any> => {
  const url = apiUrl(`customer/company/projects/details`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
};


export async function getCustomerProjectVulnerability(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`project/customer/vulnerability/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}


interface CompletedProjectsParams {
  limit?: number;
  offset?: number;
  name?: string;
  projecttype?: string;
  testingtype?: string;
  startdate?: string;
  enddate_before?: string;
  sort?: string;
  order_by?: 'asc' | 'desc';
}

export const completedProjects = async (params: CompletedProjectsParams = {}): Promise<any> => {
  const url = apiUrl(`customer/company/projects/completed`);
  const response = await getOrRedirect(url, { 
    params,
    ...authHeaders() 
  });
  return response.data;
};