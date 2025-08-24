import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userInterest, setUserInterest] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
     try {
    const result = await register({
      name,
      email,
      password,
      interests: userInterest ? [userInterest] : [],
      gdprConsent: gdprConsent.toString()
    });
    if (!result.success) {
      setError(result.error || 'Registration failed');
    } else {
      setSuccess('Registration successful! Please check your email to verify your account.');
      setName(''); setEmail(''); setPassword(''); setGdprConsent(false); setUserInterest('');
    }
  } catch (err) {
    setError('Network error');
  } finally {
    setLoading(false);
  }
  };

  return (
    <>
      <Helmet>
        <title>Register - Intelixir</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form onSubmit={handleSubmit} className="max-w-md w-full bg-white rounded-xl shadow p-8 space-y-6">
          <h2 className="text-3xl font-bold text-center">Join Intelixir</h2>
          {error && <div className="text-red-600 text-center">{error}</div>}
          {success && <div className="text-green-600 text-center">{success}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={2}
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
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
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters, contain uppercase, lowercase, and a number.</p>
          </div>
          
          <div className="flex items-center">
            <input
              type="text"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
              placeholder="Your area of interest (e.g., Technology, Health, Finance)"
              value={userInterest}
              onChange={e => setUserInterest(e.target.value)}
              required
            />
            
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="gdprConsent"
              checked={gdprConsent}
              onChange={e => setGdprConsent(e.target.checked)}
              required
              className="mr-2"
            />
            <label htmlFor="gdprConsent" className="text-sm">I consent to the processing of my data in accordance with the GDPR.</label>
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          <div className="text-center text-sm mt-2">
            Already have an account? <a href="/login" className="text-primary hover:underline">Login</a>
          </div>
        </form>
      </div>
    </>
  );
};

export default RegisterPage;


