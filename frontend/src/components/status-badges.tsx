import React from 'react';
import { severityColors, statusColors } from '../lib/data/definitions-customer';
import { getVulnerabilityStatusColor, getProjectStatusColor } from '../lib/utilities';

interface BadgeProps {
  label: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Generic badge component that can be used for various types of badges
 */
export const Badge: React.FC<BadgeProps> = ({ 
  label, 
  className = '', 
  size = 'sm' 
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium border-2 ${sizeClasses[size]} ${className}`}
    >
      {label}
    </span>
  );
};

/**
 * Badge specifically for vulnerability severity levels
 */
export const SeverityBadge: React.FC<{ 
  severity: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ severity, size = 'sm' }) => {
  // Normalize severity value
  const normalizedSeverity = severity === 'None' ? 'Informational' : severity;
  const colorClass = severityColors[normalizedSeverity] || severityColors['Informational'];

  return (
    <Badge
      label={normalizedSeverity}
      className={colorClass}
      size={size}
    />
  );
};

/**
 * Badge specifically for vulnerability status
 */
export const VulnerabilityStatusBadge: React.FC<{ 
  status: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, size = 'sm' }) => {
  const colorClass = getVulnerabilityStatusColor(status) || statusColors['Open'];

  return (
    <Badge
      label={status}
      className={colorClass}
      size={size}
    />
  );
};

/**
 * Badge specifically for project status
 */
export const ProjectStatusBadge: React.FC<{ 
  status: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, size = 'sm' }) => {
  const colorClass = getProjectStatusColor(status);

  return (
    <Badge
      label={status}
      className={colorClass}
      size={size}
    />
  );
};

export default {
  Badge,
  SeverityBadge,
  VulnerabilityStatusBadge,
  ProjectStatusBadge
};
