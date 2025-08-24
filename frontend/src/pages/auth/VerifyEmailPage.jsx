import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const { verifyEmail, resendVerification } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
  if (token) {
    handleVerification();
  } else {
    setStatus('error');
    setMessage('Invalid verification link. Please check your email for the correct link.');
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]);


  const handleVerification = async () => {
    try {
      const result = await verifyEmail(token);
      if (result.success) {
        setStatus('success');
        setMessage('Your email has been successfully verified! You can now sign in to your account.');
      } else {
        setStatus('error');
        setMessage(result.error || 'Email verification failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again later.');
    }
  };

  const handleResendVerification = async () => {
    const email = prompt('Please enter your email address to resend verification:');
    if (email) {
      try {
        await resendVerification(email);
      } catch (error) {
        console.error('Resend verification error:', error);
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Email Verification - Intelixir</title>
        <meta name="description" content="Verify your email address to complete your Intelixir registration." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4">
        <motion.div
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {status === 'verifying' && (
            <>
              <motion.div
                className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-2xl font-bold text-secondary mb-4">Verifying Your Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <CheckCircle className="w-8 h-8 text-green-500" />
              </motion.div>
              <h1 className="text-2xl font-bold text-secondary mb-4">Email Verified!</h1>
              <p className="text-gray-600 mb-8">{message}</p>
              <Link
                to="/login"
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 inline-block"
              >
                Continue to Sign In
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <motion.div
                className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <XCircle className="w-8 h-8 text-red-500" />
              </motion.div>
              <h1 className="text-2xl font-bold text-secondary mb-4">Verification Failed</h1>
              <p className="text-gray-600 mb-8">{message}</p>
              <div className="space-y-4">
                <button
                  onClick={handleResendVerification}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  <Mail className="w-5 h-5 inline mr-2" />
                  Resend Verification Email
                </button>
                <Link
                  to="/register"
                  className="w-full bg-gray-200 hover:bg-gray-300 text-secondary font-semibold py-3 px-6 rounded-lg transition-colors duration-200 inline-block"
                >
                  Create New Account
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default VerifyEmailPage;
