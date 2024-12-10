import React, { useContext } from 'react';
import { ThemeContext } from '../layouts/layout'; // Assuming ThemeContext is exported from Layout

const useCustomStyles = (theme: string) => {
    const isDark = theme === 'dark';

    return {
        table: {
            style: {
              backgroundColor: theme === 'dark' ? 'rgb(0, 0, 0)' : 'white',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              borderRadius: '15px'
            },
          },
          tableWrapper: {
            style: {
              display: 'table',
              backgroundColor: theme === 'dark' ? 'rgb(0, 0, 0)' : 'white',
            },
          },
          header: {
            style: {
              backgroundColor: theme === 'dark' ? 'rgb(0, 0, 0)' : 'white',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              paddingLeft: '16px',
              paddingRight: '16px',
              borderRadius: '15px'
            },
          },
          headRow: {
            style: {
              backgroundColor: theme === 'dark' ? 'rgb(14 18 26)' : '#f9fafb',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              borderBottomWidth: '1px',
              borderBottomColor: theme === 'dark' ? 'rgb(31, 41, 55)' : '#e5e7eb',
              minHeight: '56px',
              borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px',
            },
            denseStyle: {
              minHeight: '32px',
            },
          },
          headCells: {
            style: {
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              fontSize: '14px',
              fontWeight: 600,
              paddingLeft: '16px',
              paddingRight: '16px',
            },
          },
          cells: {
            style: {
              paddingLeft: '16px',
              paddingRight: '16px',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
            },
          },
          rows: {
            style: {
              backgroundColor: theme === 'dark' ? 'rgb(14 18 26)' : 'white',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              fontSize: '14px',
              fontWeight: 400,
              minHeight: '48px',
              '&:not(:last-of-type)': {
                borderBottomStyle: 'solid',
                borderBottomWidth: '1px',
                borderBottomColor: theme === 'dark' ? 'rgb(31, 41, 55)' : '#e5e7eb',
              },
              '&:last-of-type':{
                borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
              },
              '&:hover': {
                backgroundColor: theme === 'dark' ? 'rgb(55,65,81)' : '#f3f4f6',
                cursor: 'pointer',
              },
            },
            stripedStyle: {
              backgroundColor: theme === 'dark' ? 'rgb(14 18 26)' : '#f9fafb',
            },
            selectedHighlightStyle: {
              backgroundColor: theme === 'dark' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.1)',
            },
          },
          pagination: {
            style: {
              backgroundColor: theme === 'dark' ? 'rgb(0, 0, 0)' : 'white',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              borderTopWidth: '1px',
              borderTopColor: theme === 'dark' ? 'rgb(31, 41, 55)' : '#e5e7eb',
            },
            pageButtonsStyle: {
              borderRadius: '8px',
              height: '32px',
              width: '32px',
              padding: '4px 8px',
              margin: '0px 4px',
              cursor: 'pointer',
              transition: '0.2s all',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              fill: theme === 'dark' ? '#e5e7eb' : '#111827',
              backgroundColor: 'transparent',
              '&:disabled': {
                cursor: 'not-allowed',
                color: theme === 'dark' ? 'rgb(107, 114, 128)' : '#9ca3af',
                fill: theme === 'dark' ? 'rgb(107, 114, 128)' : '#9ca3af',
              },
              '&:hover:not(:disabled)': {
                backgroundColor: theme === 'dark' ? 'rgb(17, 24, 39)' : '#f3f4f6',
              },
              '&:focus': {
                outline: 'none',
                backgroundColor: theme === 'dark' ? 'rgb(17, 24, 39)' : '#f3f4f6',
              },
            },
          },
          noData: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              backgroundColor: theme === 'dark' ? 'rgb(0, 0, 0)' : 'white',
              padding: '24px',
            },
          },
    };
};

export default useCustomStyles;
