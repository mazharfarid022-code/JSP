import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import WorkerDashboard from './pages/worker/WorkerDashboard';

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role: 'admin' | 'worker' }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (role === 'worker' && (!currentUser || isAdmin)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/*" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/worker/*" element={<PrivateRoute role="worker"><WorkerDashboard /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  );
}
