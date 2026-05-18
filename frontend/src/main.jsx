import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';

import './index.css';

import { AuditProvider } from './modules/AuditLogs/context/AuditContext';
import { NotificationProvider } from './modules/Notifications/context/NotificationContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuditProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AuditProvider>
  </React.StrictMode>
);