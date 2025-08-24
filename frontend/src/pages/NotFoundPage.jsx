import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found - Intelixir</title>
        <meta name="description" content="The page you're looking for could not be found." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 404 Animation */}
            <motion.div
              className="text-8xl font-bold text-primary mb-8"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 1, -1, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              404
            </motion.div>

            <h1 className="text-3xl font-bold text-secondary mb-4">
              Oops! Page Not Found
            </h1>

            <p className="text-gray-600 mb-8 leading-relaxed">
              The page you're looking for seems to have wandered off into the digital void. 
              Don't worry, even our AI sometimes gets lost in the vast web of information!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors duration-200"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Link>

              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-secondary font-semibold rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </button>

              <Link
                to="/categories"
                className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary hover:bg-primary hover:text-white font-semibold rounded-lg transition-colors duration-200"
              >
                <Search className="w-5 h-5 mr-2" />
                Explore
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Looking for something specific?</p>
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <Link to="/categories" className="text-primary hover:text-primary-dark">
                  Browse Categories
                </Link>
                <Link to="/contact" className="text-primary hover:text-primary-dark">
                  Contact Support
                </Link>
                <Link to="/" className="text-primary hover:text-primary-dark">
                  Latest News
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;


