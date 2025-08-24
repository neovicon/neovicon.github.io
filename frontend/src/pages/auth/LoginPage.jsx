import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await login({ email, password });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
      } else {
        setSuccess('Login successful! Redirecting...');
      }
    } catch (err) {
      setError(data.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Intelixir</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form onSubmit={handleSubmit} className="max-w-md w-full bg-white rounded-xl shadow p-8 space-y-6">
          <h2 className="text-3xl font-bold text-center">Login to Intelixir</h2>
          {error && <div className="text-red-600 text-center">{error}</div>}
          {success && <div className="text-green-600 text-center">{success}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div className="text-center text-sm mt-2">
            <a href="/reset-password" className="text-primary hover:underline">Forgot password?</a>
          </div>
          <div className="text-center text-sm">
            Don't have an account? <a href="/register" className="text-primary hover:underline">Register</a>
          </div>
        </form>
      </div>
    </>
  );
};

export default LoginPage;


