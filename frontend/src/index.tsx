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
const baseUrl = import.meta.env.BASE_URL
root.render(
  <React.StrictMode>
      <ThemeProvider>
        <BrowserRouter basename={baseUrl}>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    
  </React.StrictMode>
);


