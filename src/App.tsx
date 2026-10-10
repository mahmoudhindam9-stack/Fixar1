import React, { useState, Suspense, lazy } from 'react';
import { useStore } from './store';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageSkeleton } from './components/SkeletonLoader';
import { NetworkStatus } from './components/NetworkStatus';

import { PublicRequestPage } from './pages/PublicRequestPage';

// Route-based code splitting with React.lazy for optimal bundle size & initial load speed
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const WorkOrders = lazy(() => import('./pages/WorkOrders').then(m => ({ default: m.WorkOrders })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const HR = lazy(() => import('./pages/HR').then(m => ({ default: m.HR })));
const Finance = lazy(() => import('./pages/Finance').then(m => ({ default: m.Finance })));
const PreventiveMaintenance = lazy(() => import('./pages/PreventiveMaintenance').then(m => ({ default: m.PreventiveMaintenance })));
const TechnicianDashboard = lazy(() => import('./pages/TechnicianDashboard').then(m => ({ default: m.TechnicianDashboard })));

export default function App() {
  const isPublicRequest = window.location.search.includes('public_request=true');

  if (isPublicRequest) {
    return <PublicRequestPage />;
  }

  const { currentUser, logout } = useStore();

  // Handle "Remember Me" session logic
  React.useEffect(() => {
    if (currentUser) {
      const isRemembered = localStorage.getItem("remember_me") === "true";
      const isTempSession = sessionStorage.getItem("tempSession") === "true";
      if (!isRemembered && !isTempSession) {
        logout();
      }
    }
  }, []);
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Auto-route based on roles strictly
  React.useEffect(() => {
    if (currentUser) {
      const roleUpper = currentUser.role?.toUpperCase() || '';
      const isTech = roleUpper === 'TECHNICIAN' || 
                     roleUpper.includes('TECH') || 
                     roleUpper.includes('فني') ||
                     !!currentUser.specialty;

      if (isTech && currentTab !== 'technician_dashboard') {
        setCurrentTab('technician_dashboard');
      }
    }
  }, [currentUser, currentTab]);

  if (!currentUser) {
    return (
      <ErrorBoundary>
        <NetworkStatus />
        <Login />
      </ErrorBoundary>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'work_orders': return <WorkOrders />;
      case 'preventive_maintenance': return <PreventiveMaintenance />;
      case 'technician_dashboard': return <TechnicianDashboard />;
      case 'settings': return <Settings />;
      case 'inventory': return <Inventory />;
      case 'hr': return <HR />;
      case 'finance': return <Finance />;
      default: return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <NetworkStatus />
      <Layout currentTab={currentTab} setTab={setCurrentTab}>
        <Suspense fallback={<PageSkeleton />}>
          {renderContent()}
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}

