import { useState, useEffect } from 'react';
import { CustomerProjectType } from '../../lib/data/definitions-customer';
import VulnerabilityDataTable from '../../components/vulnerability-data-table';

interface VulnerabilitiesTabProps {
  project: CustomerProjectType | null;
  vulnerabilities: any[];
}

export default function VulnerabilitiesTab({ project, vulnerabilities }: VulnerabilitiesTabProps) {
  // Debug log to see vulnerability structure
  useEffect(() => {
    if (vulnerabilities && vulnerabilities.length > 0) {
      console.log("Vulnerability example:", vulnerabilities[0]);
    }
  }, [vulnerabilities]);

  if (!project) return null;
  
  return (
    <VulnerabilityDataTable
      vulnerabilities={vulnerabilities}
      title="Identified Vulnerabilities"
      showStats={true}
      initialSortField="severity"
      initialSortDirection="desc"
    />
  );
}
