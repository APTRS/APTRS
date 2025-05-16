// Customer-specific type definitions
import { Project } from './definitions';

/**
 * Extended Project interface for Customer view with additional properties
 */
export interface CustomerProjectType extends Project {
  engineers: { id: number; name: string; role: string }[];
  hasRetests: boolean;
  retests: { id: number; name: string; date: string; status: string }[];
  originalEnddate?: string;
  delayReason?: string;
  holdReason?: string;
  projectType?: 'project' | 'retest';
}

/**
 * Type for project tab states in customer views
 */
export type ProjectTabType = 'ongoing' | 'delayed' | 'onhold' | 'upcoming';

/**
 * Helper function to generate CSS class for severity badges
 * @param severity The severity level string
 * @returns Tailwind CSS classes for styling the severity badge
 */
export const getSeverityClass = (severity: string): string => {
  // Map severity to appropriate Tailwind CSS classes
  switch (severity) {
    case 'Critical':
      return 'text-red-800 border-red-300 dark:text-red-300';
    case 'High':
      return 'text-orange-800 border-orange-300 dark:text-orange-300';
    case 'Medium':
      return 'text-yellow-800 border-yellow-300 dark:text-yellow-300';
    case 'Low':
      return 'text-blue-800 border-blue-300 dark:text-blue-300';
    case 'Informational':
    case 'Info':
    case 'None':
      return ' text-gray-800 border-gray-300 dark:text-gray-300';
    default:
      return 'text-gray-800 border-gray-300 dark:text-gray-300';
  }
};

/**
 * Severity color classes for visual indicators including background colors
 */
export const severityColors: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300",
  High: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-300",
  Info: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300",
  Informational: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300",
  None: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300"
};

/**
 * Status color classes for visual indicators
 */
export const statusColors: Record<string, string> = {
  Open: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-300",
  Fixed: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300",
  "Vulnerable": "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300",
  "Confirm Fixed": "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300",
  "Accepted Risk": "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300"
};