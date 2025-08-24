import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Filter, TrendingUp, Clock, Heart } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InfiniteScroll from 'react-infinite-scroll-component';

const DashboardPage = () => {
  const { user, api } = useAuth();
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('recent');
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Create Post Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostCategory, setNewPostCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Fetch categories
  const { data: categories } = useQuery(
    'categories',
    async () => {
      const response = await api.get('/categories');
      return response.data.data.categories;
    }
  );

  // Fetch initial posts
  const { isLoading } = useQuery(
    ['posts', sortBy, selectedCategory],
    async () => {
      const response = await api.get('/posts', {
        params: {
          page: 1,
          limit: 10,
          sortBy,
          category: selectedCategory === 'all' ? undefined : selectedCategory
        }
      });
      setPosts(response.data.data.posts);
      setPage(2);
      setHasMore(response.data.data.pagination.hasNextPage);
      return response.data.data.posts;
    },
    {
      enabled: !!user
    }
  );

  const fetchMorePosts = async () => {
    try {
      const response = await api.get('/posts', {
        params: {
          page,
          limit: 10,
          sortBy,
          category: selectedCategory === 'all' ? undefined : selectedCategory
        }
      });
      
      setPosts(prev => [...prev, ...response.data.data.posts]);
      setPage(prev => prev + 1);
      setHasMore(response.data.data.pagination.hasNextPage);
    } catch (error) {
      console.error('Error fetching more posts:', error);
    }
  };

  const sortOptions = [
    { value: 'recent', label: 'Most Recent', icon: Clock },
    { value: 'popular', label: 'Most Popular', icon: Heart },
    { value: 'trending', label: 'Trending', icon: TrendingUp }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your personalized feed..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Intelixir</title>
        <meta name="description" content="Your personalized AI-curated news feed" />
      </Helmet>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowCreateModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Create a Post</h2>
            {createError && <div className="text-red-600 mb-2">{createError}</div>}
            <form onSubmit={async (e) => {
              e.preventDefault();
              setCreating(true);
              setCreateError('');
              try {
                const formData = new FormData();
                formData.append('content', newPostText);
                if (newPostImage) {
                  formData.append('image', newPostImage);
                  formData.append('type', 'image');
                } else {
                  formData.append('type', 'text');
                }
                if (newPostCategory) formData.append('categories', newPostCategory);
                const res = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                setShowCreateModal(false);
                setNewPostText('');
                setNewPostImage(null);
                setNewPostCategory('');
                setPosts(prev => [res.data.data.post, ...prev]);
              } catch (err) {
                setCreateError(err.response?.data?.message || 'Failed to create post');
              } finally {
                setCreating(false);
              }
            }}>
              <textarea
                className="w-full border rounded px-3 py-2 mb-3"
                placeholder="What's on your mind?"
                value={newPostText}
                onChange={e => setNewPostText(e.target.value)}
                required
                rows={4}
              />
              <input
                type="file"
                accept="image/*"
                className="mb-3"
                onChange={e => setNewPostImage(e.target.files[0])}
              />
              <select
                className="w-full border rounded px-3 py-2 mb-3"
                value={newPostCategory}
                onChange={e => setNewPostCategory(e.target.value)}
              >
                <option value="">Select Category (optional)</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                disabled={creating}
              >
                {creating ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600">Here's your personalized news feed based on your interests</p>
            </div>
            <button
              className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg shadow transition-colors duration-200"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Post
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-500" />
                {/* Sort Options */}
                <div className="flex space-x-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === option.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <option.icon className="w-4 h-4" />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              >
                <option value="all">All Categories</option>
                {categories?.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              <InfiniteScroll
                dataLength={posts.length}
                next={fetchMorePosts}
                hasMore={hasMore}
                loader={
                  <div className="flex justify-center py-8">
                    <LoadingSpinner text="Loading more posts..." />
                  </div>
                }
                endMessage={
                  <div className="text-center py-8 text-gray-500">
                    <p>You've reached the end! 🎉</p>
                    <p>Check back later for more AI-curated content.</p>
                  </div>
                }
              >
                {posts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </InfiniteScroll>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or check back later for new content.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
