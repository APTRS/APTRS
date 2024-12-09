import React, { useContext } from 'react';
import { ThemeContext } from '../layouts/layout'; // Assuming ThemeContext is exported from Layout

const useCustomStyles = (theme: string) => {
    const isDark = theme === 'dark';

    return {
        table: {
            style: {
                borderCollapse: 'collapse',
                width: '100%',
                backgroundColor: isDark ? '#2d3748' : '#ffffff',
                color: isDark ? '#e2e8f0' : '#374151',
                borderRadius: '5px',
                
            },
        },
        rows: {
            style: {
                minHeight: '48px',
                borderBottom: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`,
                '&:nth-child(odd)': {
                    backgroundColor: isDark ? '#19212c' : '#f9fafb', // Light row color for odd rows
                },
                '&:nth-child(even)': {
                    backgroundColor: isDark ? '#1f2937' : '#ffffff', // Light row color for even rows
                },
                '&:hover': {
                    backgroundColor: isDark ? '#4a5568' : '#c8d1e3',
                },
            },
        },
        headRow: {
            style: {
                backgroundColor: isDark ? '#1f2937' : '#f1f5f9', // Lighter header background color for light mode
                
                borderBottom: `2px solid ${isDark ? '#4a5568' : '#e5e7eb'}`,
                borderRadius: '5px',
                
            },
        },
        headCells: {
            style: {
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#e2e8f0' : '#4b5563', // Darker text color for headers in light mode
                padding: '16px',
                textAlign: 'left',
                paddingLeft: '4px', // override the cell padding for head cells
        paddingRight: '4px',
        borderRadius: '5px',
            
            },
        },
        cells: {
            style: {
                fontSize: '14px',
                color: isDark ? '#e2e8f0' : '#374151', // Darker text for cells in light mode
                padding: '16px',
                textAlign: 'left',
                paddingLeft: '4px', // override the cell padding for data cells
        paddingRight: '4px',
            },
        },
        pagination: {
            style: {
                borderTop: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`,
                paddingTop: '12px',
                paddingBottom: '12px',
                backgroundColor: isDark ? '#2d3748' : '#ffffff',
                color: isDark ? '#e2e8f0' : '#374151',
            },
        },
        paginationDropdown: {
            style: {
                backgroundColor: isDark ? '#4a5568' : '#ffffff',
                color: isDark ? '#e2e8f0' : '#374151',
                border: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`,
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '14px',
                cursor: 'pointer',
                '&:focus': {
                    outline: 'none',
                    borderColor: isDark ? '#cbd5e0' : '#6b7280',
                },
                '&:hover': {
                    backgroundColor: isDark ? '#2d3748' : '#f3f4f6',
                },
                '&:active': {
                    backgroundColor: isDark ? '#2d3748' : '#e5e7eb',
                },
            },
        },
        paginationPageButton: {
            style: {
                borderRadius: '50%',
                height: '30px',
                width: '30px',
                padding: '6px',
                margin: '0 4px',
                cursor: 'pointer',
                transition: '0.4s',
                color: isDark ? '#e2e8f0' : '#374151',
                backgroundColor: isDark ? '#4a5568' : '#ffffff',
                '&:disabled': {
                    cursor: 'unset',
                    color: isDark ? '#4a5568' : '#e5e7eb',
                    backgroundColor: isDark ? '#2d3748' : '#f3f4f6',
                },
                '&:hover:not(:disabled)': {
                    backgroundColor: isDark ? '#2d3748' : '#f3f4f6',
                },
                '&:focus': {
                    outline: 'none',
                    backgroundColor: isDark ? '#2d3748' : '#e5e7eb',
                },
            },
        },
        paginationSelectedPage: {
            style: {
                backgroundColor: isDark ? '#38b2ac' : '#e2e8f0',
                color: isDark ? '#2d3748' : '#374151',
                '&:hover': {
                    backgroundColor: isDark ? '#38b2ac' : '#e2e8f0',
                },
            },
        },
        paginationPrevNext: {
            style: {
                cursor: 'pointer',
                padding: '6px 10px',
                backgroundColor: isDark ? '#4a5568' : '#ffffff',
                borderRadius: '4px',
                '&:disabled': {
                    cursor: 'unset',
                    color: isDark ? '#4a5568' : '#e5e7eb',
                },
                '&:hover:not(:disabled)': {
                    backgroundColor: isDark ? '#2d3748' : '#f3f4f6',
                },
                '&:focus': {
                    outline: 'none',
                    backgroundColor: isDark ? '#2d3748' : '#e5e7eb',
                },
            },
        },
    };
};

export default useCustomStyles;
