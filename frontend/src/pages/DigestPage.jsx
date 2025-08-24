import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Mail, Calendar, Eye } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const DigestPage = () => {
  const { user, api } = useAuth();
  const [digestType, setDigestType] = useState('daily');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch digest data
  const { data: digestData, isLoading, refetch } = useQuery(
    ['digest', digestType],
    async () => {
      const response = await api.get(`/digest/${digestType}`);
      return response.data.data;
    },
    {
      enabled: !!user
    }
  );

  const generateDigest = async () => {
    setIsGenerating(true);
    try {
      await api.post('/digest/generate', { type: digestType });
      await refetch();
      toast.success('Digest generated successfully!');
    } catch (error) {
      toast.error('Failed to generate digest');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendDigestEmail = async () => {
    try {
      await api.post('/digest/send-email', { 
        type: digestType,
        posts: digestData?.posts?.map(p => p._id) || []
      });
      toast.success('Digest sent to your email!');
    } catch (error) {
      toast.error('Failed to send digest email');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your digest..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>AI Digest - Intelixir</title>
        <meta name="description" content="Your personalized AI-curated news digest" />
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-4xl font-bold text-secondary mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              📰 Your AI Digest
            </motion.h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Personalized news summaries curated by AI based on your interests and reading history.
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Digest Type:</label>
                <select
                  value={digestType}
                  onChange={(e) => setDigestType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                >
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                  <option value="trending">Trending Now</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={generateDigest}
                  disabled={isGenerating}
                  className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isGenerating ? 'Generating...' : 'Generate Digest'}</span>
                </button>

                {digestData?.posts && (
                  <button
                    onClick={sendDigestEmail}
                    className="flex items-center space-x-2 bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email This</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Digest Content */}
          {digestData?.posts ? (
            <div className="space-y-6">
              {/* Digest Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-secondary capitalize">
                    {digestType} Digest
                  </h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
                <p className="text-gray-600">
                  {digestData.posts.length} stories curated specifically for you based on your interests in{' '}
                  {user?.interests?.map(i => i.name).join(', ')}.
                </p>
              </div>

              {/* Digest Posts */}
              <div className="space-y-6">
                {digestData.posts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </div>

              {/* Digest Footer */}
              <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white text-center">
                <h3 className="text-xl font-semibold mb-2">Stay Informed</h3>
                <p className="mb-4 opacity-90">
                  Want to receive digests like this directly in your inbox?
                </p>
                <button
                  onClick={sendDigestEmail}
                  className="bg-white text-primary hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Mail className="w-5 h-5 inline mr-2" />
                  Subscribe to Email Digests
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Digest Available</h3>
              <p className="text-gray-600 mb-6">
                Generate a new digest to see your personalized news summary.
              </p>
              <button
                onClick={generateDigest}
                disabled={isGenerating}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate My Digest'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DigestPage;
