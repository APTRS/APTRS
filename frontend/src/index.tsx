import React from 'react';
import ReactDOM from 'react-dom/client';
import './output.css';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from "@material-tailwind/react";
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
/**
 * Turns URL path into router basename by removing everything after the last slash
 * @param {string} path URL path, probably window.location.pathname
 * @returns {string} final basename
 */
const getBasename = (path: string): string => path.substr(0, path.lastIndexOf('/'));
root.render(
  <React.StrictMode>
      <ThemeProvider>
        <BrowserRouter basename={getBasename(window.location.pathname)}>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    
  </React.StrictMode>
);


