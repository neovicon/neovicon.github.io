import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Home,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const NavLink = ({ to, children, mobile = false, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`${
        mobile
          ? 'block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md'
          : 'text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200'
      }`}
    >
      {children}
    </Link>
  );

  const UserDropdown = () => (
    <AnimatePresence>
      {isUserMenuOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border"
        >
          <Link
            to="/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsUserMenuOpen(false)}
          >
            <User className="w-4 h-4 mr-3" />
            Profile
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsUserMenuOpen(false)}
          >
            <Home className="w-4 h-4 mr-3" />
            Dashboard
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsUserMenuOpen(false)}
            >
              <Shield className="w-4 h-4 mr-3" />
              Admin
            </Link>
          )}
          <button
            onClick={toggleDarkMode}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Settings className="w-4 h-4 mr-3" />
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">Intelixir</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/categories">Categories</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/dashboard">Feed</NavLink>
                <NavLink to="/digest">Digest</NavLink>
              </>
            )}
            <NavLink to="/contact">Contact</NavLink>
          </div>



          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{user?.name}</span>
                </button>
                <UserDropdown />
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-primary p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <NavLink to="/" mobile onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </NavLink>
              <NavLink to="/categories" mobile onClick={() => setIsMobileMenuOpen(false)}>
                Categories
              </NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/dashboard" mobile onClick={() => setIsMobileMenuOpen(false)}>
                    Feed
                  </NavLink>
                  <NavLink to="/digest" mobile onClick={() => setIsMobileMenuOpen(false)}>
                    Digest
                  </NavLink>
                </>
              )}
              <NavLink to="/contact" mobile onClick={() => setIsMobileMenuOpen(false)}>
                Contact
              </NavLink>



              {isAuthenticated ? (
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="px-3 py-2">
                    <p className="text-base font-medium text-gray-800">{user?.name}</p>
                    <p className="text-sm font-medium text-gray-500">{user?.email}</p>
                  </div>
                  <NavLink to="/profile" mobile onClick={() => setIsMobileMenuOpen(false)}>
                    Profile
                  </NavLink>
                  {user?.role === 'admin' && (
                    <NavLink to="/admin" mobile onClick={() => setIsMobileMenuOpen(false)}>
                      Admin
                    </NavLink>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="pt-4 pb-3 border-t border-gray-200 space-y-1">
                  <NavLink to="/login" mobile onClick={() => setIsMobileMenuOpen(false)}>
                    Login
                  </NavLink>
                  <NavLink to="/register" mobile onClick={() => setIsMobileMenuOpen(false)}>
                    Get Started
                  </NavLink>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;


