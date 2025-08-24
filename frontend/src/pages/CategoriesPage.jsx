import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CategoriesPage = () => {
  const { api } = useAuth();

  const { data: categories, isLoading } = useQuery(
    'categories',
    async () => {
      const response = await api.get('/categories');
      return response.data.data.categories;
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading categories..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Browse Categories - Intelixir</title>
        <meta name="description" content="Explore news categories and find content that interests you" />
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-secondary mb-4">Browse Categories</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover news and content organized by topics that matter to you
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories?.map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/categories/${category.slug}`}
                  className="block group"
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group-hover:scale-105">
                    <div className="flex items-center space-x-4 mb-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color }}
                      >
                        <span className="text-white text-xl font-bold">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {category.postCount || 0} posts
                        </p>
                      </div>
                    </div>
                    
                    {category.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {category.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-primary text-sm font-medium group-hover:text-primary-dark transition-colors">
                        Explore Category →
                      </span>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {(!categories || categories.length === 0) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Categories Available</h3>
              <p className="text-gray-600">Categories will appear here once they're added to the platform.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoriesPage;
