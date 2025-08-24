import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Calendar, 
  User, 
  ExternalLink,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const PostDetailPage = () => {
  const { id } = useParams();
  const { user, api } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Fetch post
  const { data: post, isLoading, error } = useQuery(
    ['post', id],
    async () => {
      const response = await api.get(`/posts/${id}`);
      const postData = response.data.data.post;
      setIsLiked(postData.likes?.some(like => like.user === user?.id) || false);
      setLikeCount(postData.likeCount || 0);
      return postData;
    }
  );

  // Add comment mutation
  const addCommentMutation = useMutation(
    (commentData) => api.post(`/posts/${id}/comment`, commentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['post', id]);
        setCommentText('');
        toast.success('Comment added successfully!');
      },
      onError: () => {
        toast.error('Failed to add comment');
      }
    }
  );

  // Like post mutation
  const likeMutation = useMutation(
    () => api.post(`/posts/${id}/like`),
    {
      onSuccess: (response) => {
        setIsLiked(response.data.data.liked);
        setLikeCount(response.data.data.likeCount);
      }
    }
  );

  // Share post mutation
  const shareMutation = useMutation(
    () => api.post(`/posts/${id}/share`)
  );

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    
    addCommentMutation.mutate({ content: commentText.trim() });
  };

  const handleLike = () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }
    likeMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: window.location.href
        });
        shareMutation.mutate();
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
      shareMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading post..." />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h2>
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist or has been removed.</p>
          <Link to="/dashboard" className="text-primary hover:text-primary-dark">
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title ? `${post.title} - Intelixir` : 'Post - Intelixir'}</title>
        <meta name="description" content={post.content.substring(0, 160)} />
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Post Content */}
          <motion.article
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Post Image */}
            {post.image && (
              <div className="relative h-64 md:h-80">
                <img
                  src={post.image}
                  alt={post.title || 'Post image'}
                  className="w-full h-full object-cover"
                />
                {post.isNews && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-white text-sm font-medium px-3 py-1 rounded-full">
                      AI Curated
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="p-6 md:p-8">
              {/* Post Meta */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    {post.author.profilePicture ? (
                      <img
                        src={post.author.profilePicture}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{post.author.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Categories */}
                <div className="flex space-x-2">
                  {post.categories?.map((category) => (
                    <Link
                      key={category._id}
                      to={`/categories/${category.slug}`}
                      className="text-xs px-3 py-1 rounded-full text-white hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Title */}
              {post.title && (
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {post.title}
                </h1>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Link Preview */}
              {post.link && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{post.link.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{post.link.description}</p>
                      <a
                        href={post.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark text-sm flex items-center"
                      >
                        Visit link <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                    {post.link.image && (
                      <img
                        src={post.link.image}
                        alt=""
                        className="w-16 h-16 object-cover rounded ml-4"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={handleLike}
                    disabled={!user}
                    className={`flex items-center space-x-2 ${
                      isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    } transition-colors`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likeCount}</span>
                  </button>

                  <div className="flex items-center space-x-2 text-gray-500">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments?.length || 0}</span>
                  </div>

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 text-gray-500 hover:text-primary transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>{post.shares || 0}</span>
                  </button>
                </div>

                <div className="text-sm text-gray-400">
                  {post.views || 0} views
                </div>
              </div>
            </div>
          </motion.article>

          {/* Comments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Comments ({post.comments?.length || 0})
            </h2>

            {/* Add Comment Form */}
            {user ? (
              <form onSubmit={handleAddComment} className="mb-8">
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary resize-none"
                      rows="3"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!commentText.trim() || addCommentMutation.isLoading}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        <span>Post Comment</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg mb-8">
                <p className="text-gray-600 mb-4">Sign in to join the conversation</p>
                <Link
                  to="/login"
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {post.comments?.map((comment) => (
                <motion.div
                  key={comment._id}
                  className="flex space-x-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {comment.user.profilePicture ? (
                      <img
                        src={comment.user.profilePicture}
                        alt={comment.user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-600">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{comment.user.name}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {(!post.comments || post.comments.length === 0) && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostDetailPage;
