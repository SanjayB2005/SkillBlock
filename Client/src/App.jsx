import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './Components/layout/Navbar';
import Footer from './Components/layout/Footer';
import Hero from './Components/common/Hero';
import ClientDashboard from './Components/client/dashboard/ClientDashboard';
import FreelancerDashboard from './Components/freelancer/dashboard/FreelancerDashboard';
import Profile from './Components/common/Profile';
import WalletSignup from './Components/auth/WalletSignup';
import Assignments from './Components/freelancer/assignments/Assignments'; // Add this import
import NotFound from './Components/common/NotFound';

// Route guard for authenticated routes
const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem('token');
  return token ? element : <Navigate to="/" />;
};

// Role-based route guard
const RoleRoute = ({ element, allowedRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token) {
    return <Navigate to="/" />;
  }
  
  if (userRole !== allowedRole) {
    const correctPath = userRole === 'freelancer' ? '/freelancer-dashboard' : '/client-dashboard';
    return <Navigate to={correctPath} />;
  }
  
  return element;
};

// Dashboard redirect based on role
const DashboardRedirect = () => {
  const userRole = localStorage.getItem('userRole');
  return userRole === 'freelancer' 
    ? <Navigate to="/freelancer-dashboard" replace /> 
    : <Navigate to="/client-dashboard" replace />;
};  

// Role listener component to handle real-time role changes
const RoleListener = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Function to handle role changes in localStorage
    const handleRoleChange = (e) => {
      if (e.key === 'userRole') {
        const newRole = e.newValue;
        const currentPath = window.location.pathname;
        
        // If user is on a dashboard page, redirect based on new role
        if (currentPath.includes('-dashboard')) {
          const correctPath = newRole === 'freelancer' 
            ? '/freelancer-dashboard' 
            : '/client-dashboard';
            
          navigate(correctPath, { replace: true });
        }
      }
    };
    
    // Add event listener for storage changes
    window.addEventListener('storage', handleRoleChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleRoleChange);
    };
  }, [navigate]);
  
  return null; // This component doesn't render anything
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Navbar />
        <RoleListener />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Hero />} />
            
            {/* Role-specific dashboard routes */}
            <Route path="/client-dashboard" element={
              <RoleRoute element={<ClientDashboard />} allowedRole="client" />
            } />
            <Route path="/freelancer-dashboard" element={
              <RoleRoute element={<FreelancerDashboard />} allowedRole="freelancer" />
            } />
            
            {/* Freelancer-specific routes */}
            <Route path="/assignments" element={
              <RoleRoute element={<Assignments />} allowedRole="freelancer" />
            } />
            
            {/* Generic dashboard route that redirects based on role */}
            <Route path="/dashboard" element={
              <PrivateRoute element={<DashboardRedirect />} />
            } />
            
            <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
            <Route path="/wallet-signup" element={<WalletSignup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;