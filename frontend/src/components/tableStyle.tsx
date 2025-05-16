import React, { useContext } from 'react';
import { ThemeContext } from '../layouts/layout'; // Assuming ThemeContext is exported from Layout

const useCustomStyles = (theme: string) => {
    const isDark = theme === 'dark';

    return {        
        table: {
            style: {
              backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              borderRadius: '15px',
              backdropFilter: 'blur(8px)',
              border: theme === 'dark' ? '1px solid rgba(75, 85, 99, 0.4)' : '1px solid rgba(229, 231, 235, 0.7)',
              boxShadow: theme === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              margin: '1rem 0'
            },
          },          tableWrapper: {
            style: {
              display: 'block', 
              backgroundColor: 'transparent',
              maxHeight: '65vh', // Slightly reduced to ensure no overlap with header
              overflowY: 'auto', // Enable vertical scrolling
              position: 'relative', // Establish a stacking context
              zIndex: 1, // Lower than date picker z-index
            },
          },
          header: {
            style: {
              backgroundColor: 'transparent',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              paddingLeft: '16px',
              paddingRight: '16px',
              borderRadius: '15px'
            },
          },          
          headRow: {
            style: {
              backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.7)' : 'rgba(249, 250, 251, 0.7)',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              borderBottomWidth: '1px',
              borderBottomColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.7)',
              minHeight: '56px',
              height: '60px',
              borderTopLeftRadius: '10px',
              borderTopRightRadius: '10px',
            },
            denseStyle: {
              minHeight: '40px',
              height: '40px',
            },
          },          
          headCells: {
            style: {
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              fontSize: '14px',
              fontWeight: 600,
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
          },          
          cells: {
            style: {
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '12px',
              paddingBottom: '12px',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
            },
          },          
          rows: {
            style: {
              backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.5)' : 'rgba(255, 255, 255, 0.6)',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              fontSize: '14px',
              fontWeight: 400,
              minHeight: '52px',
              height: '52px',
              transition: 'background-color 0.2s ease',
              '&:not(:last-of-type)': {
                borderBottomStyle: 'solid',
                borderBottomWidth: '1px',
                borderBottomColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.7)',
              },
              '&:last-of-type':{
                borderBottomLeftRadius: '10px',
                borderBottomRightRadius: '10px',
              },              
              '&:hover': {
                backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.7)' : 'rgba(243, 244, 246, 0.8)',
                cursor: 'pointer',
                boxShadow: theme === 'dark' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              },
            },
            stripedStyle: {
              backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.6)' : 'rgba(249, 250, 251, 0.6)',
            },
            selectedHighlightStyle: {
              backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
              borderLeft: theme === 'dark' ? '3px solid rgba(59, 130, 246, 0.7)' : '3px solid rgba(59, 130, 246, 0.5)',
            },
          },          
          pagination: {
            style: {
              backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              borderTopWidth: '1px',
              borderTopColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.7)' : 'rgba(229, 231, 235, 0.7)',
              backdropFilter: 'blur(4px)',
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px',
              height: '56px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            },            
            pageButtonsStyle: {
              borderRadius: '8px',
              height: '32px',
              width: '32px',
              padding: '4px 8px',
              margin: '0px 4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              fill: theme === 'dark' ? '#e5e7eb' : '#111827',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              '&:disabled': {
                cursor: 'not-allowed',
                color: theme === 'dark' ? 'rgba(107, 114, 128, 0.6)' : 'rgba(156, 163, 175, 0.6)',
                fill: theme === 'dark' ? 'rgba(107, 114, 128, 0.6)' : 'rgba(156, 163, 175, 0.6)',
              },
              '&:hover:not(:disabled)': {
                backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              },
              '&:focus': {
                outline: 'none',
                boxShadow: theme === 'dark' ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : '0 0 0 2px rgba(59, 130, 246, 0.3)',
                backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)',
              },
              '&:active': {
                transform: 'scale(0.97)',
              },
            },
            selectWrapper: {
              style: {
                color: theme === 'dark' ? '#e5e7eb' : '#111827',
              }
            },
            select: {
              style: {
                color: theme === 'dark' ? '#e5e7eb' : '#111827',
                backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                border: theme === 'dark' ? '1px solid rgba(75, 85, 99, 0.4)' : '1px solid rgba(229, 231, 235, 0.7)',
                borderRadius: '6px',
                padding: '2px 8px',
              }
            },
            roPerPageText: {
              style: {
                color: theme === 'dark' ? '#e5e7eb' : '#111827',
              }
            }
          },
          noData: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.5)' : 'rgba(255, 255, 255, 0.6)',
              padding: '32px',
              borderRadius: '10px',
              height: '120px',
              fontSize: '15px',
              fontStyle: 'italic',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            },
          },
    };
};

export default useCustomStyles;
