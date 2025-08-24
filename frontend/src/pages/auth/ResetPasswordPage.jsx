import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState('form'); // 'form', 'success', 'error'
  const { resetPassword, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    if (!token) {
      // Send forgot password email
      try {
        const result = await forgotPassword(data.email);
        if (result.success) {
          setStatus('success');
        }
      } catch (error) {
        setStatus('error');
      }
    } else {
      // Reset password with token
      try {
        const result = await resetPassword(token, data.password);
        if (result.success) {
          navigate('/login', {
            state: { message: 'Password reset successfully! You can now sign in.' }
          });
        }
      } catch (error) {
        setStatus('error');
      }
    }
  };

  if (!token) {
    // Forgot password form
    return (
      <>
        <Helmet>
          <title>Forgot Password - Intelixir</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4">
          <motion.div
            className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-secondary">Forgot Password?</h1>
              <p className="text-gray-600 mt-2">Enter your email to receive reset instructions</p>
            </div>

            {status === 'success' ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">If an account exists with that email, we've sent reset instructions.</p>
                <Link to="/login" className="text-primary hover:text-primary-dark">
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    {...register('email', { required: 'Email is required' })}
                    type="email"
                    className="input-field"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </>
    );
  }

  // Reset password form
  return (
    <>
      <Helmet>
        <title>Reset Password - Intelixir</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center px-4">
        <motion.div
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-secondary">Reset Password</h1>
            <p className="text-gray-600 mt-2">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg"
            >
              Reset Password
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
