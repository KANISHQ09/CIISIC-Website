import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { RootLayout } from './layouts/RootLayout';
import { Home } from './pages/Home';
import { Institutions } from './pages/Institutions';
import { IndustryLogin } from './pages/IndustryLogin';
import { IndustryRegister } from './pages/IndustryRegister';
import { IndustryDashboard } from './pages/IndustryDashboard';
import { SubmitProblem } from './pages/SubmitProblem';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { SubmissionDetails } from './pages/SubmissionDetails';
import { ProblemStatements } from './pages/ProblemStatements';
import { Services } from './pages/Services';
import { InstitutionLogin } from './pages/InstitutionLogin';
import { InstitutionRegister } from './pages/InstitutionRegister';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { SubmitSolution } from './pages/SubmitSolution';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

// Role-based Protected Route for Industry Partners
const IndustryRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/industry/login" replace />;
  }

  if (currentUser.role !== 'industry') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

// Role-based Protected Route for CII Administrators
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/industry/dashboard" replace />;
  }

  return <>{children}</>;
};

// Role-based Protected Route for Academic Institutions
const InstitutionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/institution/login" replace />;
  }

  if (currentUser.role !== 'institution' && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Login / registration pages: anyone already signed in (whatever their role, whichever
// portal's page they opened) is sent to their own dashboard instead.
// `role` only documents which portal the page belongs to.
const GuestRoute: React.FC<{ children: React.ReactNode; role: 'industry' | 'admin' | 'institution' }> = ({ children }) => {
  const { currentUser } = useApp();

  if (currentUser) {
    const dashboard =
      currentUser.role === 'admin'
        ? '/admin/dashboard'
        : currentUser.role === 'institution'
        ? '/institution/dashboard'
        : '/industry/dashboard';
    return <Navigate to={dashboard} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <RootLayout>
          <Routes>
            {/* Public Hub Website */}
            <Route path="/" element={<Home />} />
            
            {/* Dedicated Partner Institutions Directory */}
            <Route path="/institutions" element={<Institutions />} />

            {/* Services Page */}
            <Route path="/services" element={<Services />} />

            {/* Public Problem Statements Repository */}
            <Route path="/problem-statements" element={<ProblemStatements />} />
            <Route path="/problems" element={<Navigate to="/problem-statements" replace />} />

            {/* Industry Portal Routes */}
            <Route 
              path="/industry/login" 
              element={
                <GuestRoute role="industry">
                  <IndustryLogin />
                </GuestRoute>
              } 
            />
            <Route 
              path="/industry/register" 
              element={
                <GuestRoute role="industry">
                  <IndustryRegister />
                </GuestRoute>
              } 
            />
            <Route 
              path="/industry/dashboard" 
              element={
                <IndustryRoute>
                  <IndustryDashboard />
                </IndustryRoute>
              } 
            />
            {/* Problem submission: open to everyone, no login needed (CII verifies before publishing) */}
            <Route path="/submit-problem" element={<SubmitProblem />} />
            <Route path="/industry/submit" element={<Navigate to="/submit-problem" replace />} />

            {/* CII Administration Portal Routes */}
            <Route 
              path="/admin/login" 
              element={
                <GuestRoute role="admin">
                  <AdminLogin />
                </GuestRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />

            {/* Academic Institution Portal Routes */}
            <Route 
              path="/institution/login" 
              element={
                <GuestRoute role="institution">
                  <InstitutionLogin />
                </GuestRoute>
              } 
            />
            <Route 
              path="/institution/register" 
              element={
                <GuestRoute role="institution">
                  <InstitutionRegister />
                </GuestRoute>
              } 
            />
            <Route 
              path="/institution/dashboard" 
              element={
                <InstitutionRoute>
                  <InstitutionDashboard />
                </InstitutionRoute>
              } 
            />
            <Route 
              path="/institution/submit-solution/:challengeId" 
              element={
                <InstitutionRoute>
                  <SubmitSolution />
                </InstitutionRoute>
              } 
            />

            {/* Password reset (any account type) */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Student portal has been retired — send old links home */}
            <Route path="/student/*" element={<Navigate to="/" replace />} />

            {/* Publicly Viewable Problem Details */}
            <Route 
              path="/details/:id" 
              element={<SubmissionDetails />} 
            />

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RootLayout>
      </BrowserRouter>
    </AppProvider>
  );
}
