import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Calendar,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const PostCard = ({ post, compact = false }) => {
  const { user, api } = useAuth();
  const [isLiked, setIsLiked] = useState(
    post.likes?.some(like => like.user === user?.id) || false
  );
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      const response = await api.post(`/posts/${post._id}/like`);
      setIsLiked(response.data.data.liked);
      setLikeCount(response.data.data.likeCount);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: `${window.location.origin}/post/${post._id}`
        });
        // Track share
        await api.post(`/posts/${post._id}/share`);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
      // You could show a toast notification here
    }
  };

  const truncateText = (text, limit) => {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  return (
    <motion.article
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 ${
        compact ? '' : 'mb-6'
      }`}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/post/${post._id}`} className="block">
        {/* Post Image */}
        {post.image && (
          <div className={`relative ${compact ? 'h-32' : 'h-48'} overflow-hidden`}>
            <img
              src={post.image}
              alt={post.title || 'Post image'}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            {post.isNews && (
              <div className="absolute top-3 left-3">
                <span className="bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
                  AI Curated
                </span>
              </div>
            )}
          </div>
        )}

        {/* Post Content */}
        <div className={`p-${compact ? '4' : '6'}`}>
          {/* Post Meta */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {post.author.profilePicture ? (
                  <img
                    src={post.author.profilePicture}
                    alt={post.author.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {post.author.name}
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </div>
            </div>

            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex space-x-1">
                {post.categories.slice(0, 2).map((category) => (
                  <span
                    key={category._id}
                    className="text-xs px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          {post.title && (
            <h2 className={`font-bold text-gray-900 mb-2 line-clamp-2 ${
              compact ? 'text-base' : 'text-lg'
            }`}>
              {compact ? truncateText(post.title, 60) : post.title}
            </h2>
          )}

          {/* Content */}
          <p className={`text-gray-600 line-clamp-${compact ? '2' : '3'} mb-4`}>
            {compact ? truncateText(post.content, 120) : truncateText(post.content, 200)}
          </p>

          {/* Link Preview */}
          {post.link && post.type === 'link' && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{post.link.title}</p>
                  <p className="text-xs text-gray-500">{post.link.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1 mb-4">
              {post.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Post Actions */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={!user || isLiking}
              className={`flex items-center space-x-1 ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              } transition-colors duration-200 ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likeCount}</span>
            </button>

            {/* Comment Button */}
            <Link
              to={`/post/${post._id}#comments`}
              className="flex items-center space-x-1 text-gray-500 hover:text-primary transition-colors duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.commentCount || 0}</span>
            </Link>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-gray-500 hover:text-primary transition-colors duration-200"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">{post.shares || 0}</span>
            </button>
          </div>

          {/* Views */}
          <div className="text-xs text-gray-400">
            {post.views || 0} views
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;


