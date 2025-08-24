import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InfiniteScroll from 'react-infinite-scroll-component';

const CategoryDetailPage = () => {
  const { slug } = useParams();
  const { api } = useAuth();
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery(
    ['category', slug],
    async () => {
      const response = await api.get(`/categories/${slug}`);
      return response.data.data.category;
    }
  );

  // Fetch category posts
  const { isLoading: postsLoading } = useQuery(
    ['category-posts', slug],
    async () => {
      const response = await api.get(`/categories/${slug}/posts`, {
        params: { page: 1, limit: 10 }
      });
      setPosts(response.data.data.posts);
      setPage(2);
      setHasMore(response.data.data.pagination.hasNextPage);
      return response.data.data.posts;
    },
    {
      enabled: !!slug
    }
  );

  const fetchMorePosts = async () => {
    try {
      const response = await api.get(`/categories/${slug}/posts`, {
        params: { page, limit: 10 }
      });
      
      setPosts(prev => [...prev, ...response.data.data.posts]);
      setPage(prev => prev + 1);
      setHasMore(response.data.data.pagination.hasNextPage);
    } catch (error) {
      console.error('Error fetching more posts:', error);
    }
  };

  if (categoryLoading || postsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading category..." />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h2>
          <p className="text-gray-600">The category you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.name} - Intelixir</title>
        <meta name="description" content={`Latest ${category.name} news and updates`} />
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Category Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="flex items-center space-x-6 mb-6">
              <div 
                className="w-20 h-20 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: category.color }}
              >
                <span className="text-white text-3xl font-bold">
                  {category.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-secondary mb-2">{category.name}</h1>
                {category.description && (
                  <p className="text-gray-600 text-lg">{category.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>{posts.length} posts</span>
                  {category.createdAt && (
                    <span>Created {new Date(category.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Category Stats */}
            {category.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{category.stats.totalPosts || 0}</div>
                  <div className="text-sm text-gray-500">Total Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{category.stats.weeklyPosts || 0}</div>
                  <div className="text-sm text-gray-500">This Week</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{category.stats.monthlyPosts || 0}</div>
                  <div className="text-sm text-gray-500">This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{category.stats.engagement || 0}%</div>
                  <div className="text-sm text-gray-500">Engagement</div>
                </div>
              </div>
            )}
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
                    <p>You've reached the end of {category.name}! 🎉</p>
                    <p>Check back later for more content in this category.</p>
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
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📰</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts in {category.name}</h3>
                <p className="text-gray-600 mb-4">This category doesn't have any posts yet. Check back later!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryDetailPage;
