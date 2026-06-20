import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Security from './pages/Security';
import VerifyEmail from './pages/VerifyEmail';

// Protected pages
import Dashboard from './pages/Dashboard';
import Skills from './pages/Skills';
import Revisions from './pages/Revisions';
import RiskScanner from './pages/RiskScanner';
import FailureIntelligence from './pages/FailureIntelligence';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Landing & Authentication portals */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/security" element={<Security />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Dashboard workspace guard */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/revisions" element={<Revisions />} />
          <Route path="/risk-scanner" element={<RiskScanner />} />
          <Route path="/failure-intelligence" element={<FailureIntelligence />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
