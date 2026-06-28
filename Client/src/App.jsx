import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import PoliciesList from './pages/iam/policies/PoliciesList';
import PolicyForm from './pages/iam/policies/PolicyForm';
import GroupsList from './pages/iam/groups/GroupsList';
import GroupDetail from './pages/iam/groups/GroupDetail';
import UsersList from './pages/iam/users/UsersList';
import UserDetail from './pages/iam/users/UserDetail';
import NotFound from './pages/NotFound';
import ProtectedLayout from './components/layout/ProtectedLayout';
import PublicRoute from './routes/PublicRoute';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
        {/* Public Routes (Accessible only if NOT logged in) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Routes (Accessible only if logged in) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/iam/policies" element={<PoliciesList />} />
          <Route path="/iam/policies/new" element={<PolicyForm />} />
          <Route path="/iam/policies/:id/edit" element={<PolicyForm />} />
          <Route path="/iam/groups" element={<GroupsList />} />
          <Route path="/iam/groups/:id" element={<GroupDetail />} />
          <Route path="/iam/users" element={<UsersList />} />
          <Route path="/iam/users/:id" element={<UserDetail />} />
        </Route>

        {/* Default route redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/iam" element={<Navigate to="/iam/policies" replace />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
      <Toaster position="top-right" richColors />
    </Router>
  );
};

export default App;
