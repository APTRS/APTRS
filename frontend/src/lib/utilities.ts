import { getAuthUser } from './data/api'

type ObjectWithProperty = {
  [key: string]: string | number | boolean; // Define the types of properties you expect
};
export function sortByPropertyName<T extends ObjectWithProperty>(arr: T[], variableName: keyof T): T[] {
  return arr.sort((a, b) => {
    const propertyA = String(a[variableName]).toUpperCase(); // Accessing the specified property dynamically
    const propertyB = String(b[variableName]).toUpperCase();

    if (propertyA < propertyB) {
      return -1; // propertyA comes before propertyB
    }
    if (propertyA > propertyB) {
      return 1; // propertyA comes after propertyB
    }
    return 0; // properties are equal
  });
}

export function getInitials(name: string): string {
  if (!name || name.trim() === '') {
    return '?'; // Return '?' for an empty string
  }
  const nameParts = name.split(' ').filter(part => part !== ''); // Split the name into parts and remove empty parts
  const initials = nameParts.map(part => part.charAt(0)).join(''); // Get the first character of each part

  return initials.toUpperCase(); // Convert initials to uppercase and return
}

export function avatarUrl(profilepic: string | null = ''): string {
  if(!profilepic){
    return ''
  }
  if(!profilepic.includes('http')){
    const base = window.location.origin;  // Get the current origin
    return base + profilepic; 
  }
  return profilepic
}

export const phoneRegex = /\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$/
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const usernameRegex = /^[a-zA-Z0-9]+$/
export const passwordRegex = /^(?=.*[A-Z])(?=.*[@#$%!^&*]).{10,}$/;


// Manage Users 
// Manage Projects
// Assign Projects
// Manage Vulnerability Data
// Manage Customer
// Manage Company
// Manage Configurations
export const currentUserCan = (group: string): boolean => {
  const user = getAuthUser()
  if(!user){
    return false
  }
  if (user.isAdmin){
    return true
  }
  return user.permissions?.includes(group) || false
}
export const getProjectStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    'Upcoming': 'text-blue-600',
    'In Progress': 'text-yellow-600',
    'Delay': 'text-red-600',
    'Completed': 'text-green-600'
  }
  return colorMap[status] || 'text-primary'
}

export const getVulnerabilityStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    'Vulnerable': 'text-red-600',
    'Confirm Fixed': 'text-green-600',
    'Accepted Risk': 'text-yellow-600'
  }
  return colorMap[status] || 'text-primary'
}



export const parseErrors = (error: any): any => {
  try {
    if(typeof error === 'string') {
      return error
    }
    if (error?.request?.response) {
      const errors: { [key: string]: string[] }  = JSON.parse(error?.request?.response);
      let transformed:any = {}
      Object.entries(errors).map((item, index) => {
        transformed[item[0]] = item[1][0]
      })
      return transformed;
    }
  } catch {
    return 'Fatal API Error'
  }
  return error
}




