import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import PostDetailPage from './pages/PostDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import DigestPage from './pages/DigestPage';
import ContactPage from './pages/ContactPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';

// Styles
import './styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <ScrollToTop />
                
                {/* Global Loading Spinner */}
                <React.Suspense fallback={<LoadingSpinner />}>
                  
                  {/* Navigation */}
                  <Navbar />
                  
                  {/* Main Content */}
                  <main className="flex-1">
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/verify-email" element={<VerifyEmailPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/categories/:slug" element={<CategoryDetailPage />} />
                      <Route path="/post/:id" element={<PostDetailPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      
                      {/* Protected Routes */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/profile" 
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/digest" 
                        element={
                          <ProtectedRoute>
                            <DigestPage />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Admin Routes */}
                      <Route 
                        path="/admin/*" 
                        element={
                          <ProtectedRoute requireAdmin={true}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Redirect old routes */}
                      <Route path="/home" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/feed" element={<Navigate to="/dashboard" replace />} />
                      
                      {/* 404 Page */}
                      <Route path="/404" element={<NotFoundPage />} />
                      <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                  </main>
                  
                  {/* Footer */}
                  <Footer />
                  
                </React.Suspense>
                
                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#fff',
                      color: '#2B2B2B',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '14px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#EF4444',
                        secondary: '#fff',
                      },
                    },
                    loading: {
                      iconTheme: {
                        primary: '#00A4EF',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
                
              </div>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;