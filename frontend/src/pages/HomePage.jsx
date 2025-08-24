import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Zap, 
  Target, 
  MessageCircle, 
  Mail, 
  TrendingUp,
  Users,
  Globe,
  Sparkles,
  ChevronRight,
  Play
} from 'lucide-react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { api } from '../contexts/AuthContext';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "AI-Curated Content",
      description: "Our advanced AI processes news from multiple sources, summarizes key points, and delivers personalized content based on your interests.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Personalized Feed",
      description: "Choose your interests and watch as your feed adapts in real-time to show you the most relevant news and discussions.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Social Engagement",
      description: "Like, comment, and share posts. Engage with a community that values informed discussion and diverse perspectives.",
      gradient: "from-green-500 to-teal-500"
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Smart Digests",
      description: "Receive personalized email digests with the stories that matter most to you, delivered on your preferred schedule.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  // Fetch trending posts for preview
  const { data: trendingPosts, isLoading: postsLoading } = useQuery(
    'trending-posts-preview',
    async () => {
      const response = await api.get('/posts/trending/today?limit=6');
      return response.data.data.posts;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000 // 10 minutes
    }
  );

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [features.length]);

  const stats = [
    { number: "50K+", label: "Active Users", icon: <Users className="w-6 h-6" /> },
    { number: "1M+", label: "Articles Processed", icon: <Globe className="w-6 h-6" /> },
    { number: "99%", label: "Accuracy Rate", icon: <Target className="w-6 h-6" /> },
    { number: "24/7", label: "AI Monitoring", icon: <Zap className="w-6 h-6" /> }
  ];

  return (
    <>
      <Helmet>
        <title>Intelixir - AI-Powered Social News Platform</title>
        <meta name="description" content="Stay informed with AI-curated news, personalized feeds, and intelligent discussions. Join Intelixir's community of informed readers." />
        <meta name="keywords" content="news, AI, social media, personalized feed, breaking news, technology" />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-secondary">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Hero Content */}
              <motion.div 
                className="text-white space-y-8"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
              >
                <div className="space-y-4">
                  <motion.div
                    className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Powered by Advanced AI
                  </motion.div>
                  
                  <h1 className="text-5xl lg:text-7xl font-bold font-heading leading-tight">
                    News That
                    <span className="block bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
                      Adapts to You
                    </span>
                  </h1>
                  
                  <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed max-w-lg">
                    Experience the future of news consumption with AI-powered personalization, 
                    real-time curation, and intelligent social engagement.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {!isAuthenticated ? (
                    <>
                      <Link
                        to="/register"
                        className="group inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        to="/categories"
                        className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Explore Content
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="group inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>

                {/* Stats */}
                <motion.div 
                  className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8"
                  variants={staggerContainer}
                  animate="animate"
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      className="text-center"
                      variants={fadeInUp}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg mx-auto mb-2">
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold">{stat.number}</div>
                      <div className="text-blue-200 text-sm">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Hero Visual */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="space-y-4">
                    {/* Mock Feed Items */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="ml-3 text-white font-medium">AI Curated</div>
                      </div>
                      <div className="text-white/80 text-sm">
                        Latest developments in renewable energy technology show promising growth...
                      </div>
                    </div>
                    
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div className="ml-3 text-white font-medium">Trending</div>
                      </div>
                      <div className="text-white/80 text-sm">
                        Market analysis reveals significant shifts in global economics...
                      </div>
                    </div>
                    
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="ml-3 text-white font-medium">Discussion</div>
                      </div>
                      <div className="text-white/80 text-sm">
                        Community insights on the impact of AI in healthcare...
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold font-heading text-secondary mb-4">
                Why Choose Intelixir?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience the next generation of news consumption with features designed 
                for the modern, informed reader.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Features List */}
              <motion.div 
                className="space-y-6"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                      activeFeature === index
                        ? 'bg-gradient-to-r ' + feature.gradient + ' text-white shadow-lg scale-105'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    variants={fadeInUp}
                    onClick={() => setActiveFeature(index)}
                    whileHover={{ scale: activeFeature === index ? 1.05 : 1.02 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        activeFeature === index ? 'bg-white/20' : 'bg-primary/10'
                      }`}>
                        <div className={activeFeature === index ? 'text-white' : 'text-primary'}>
                          {feature.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${
                          activeFeature === index ? 'text-white' : 'text-secondary'
                        }`}>
                          {feature.title}
                        </h3>
                        <p className={`leading-relaxed ${
                          activeFeature === index ? 'text-white/90' : 'text-gray-600'
                        }`}>
                          {feature.description}
                        </p>
                      </div>
                      <ChevronRight className={`w-6 h-6 transition-transform ${
                        activeFeature === index ? 'text-white rotate-90' : 'text-gray-400'
                      }`} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Feature Visualization */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-2xl">
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-secondary">
                          {features[activeFeature].title}
                        </h4>
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${features[activeFeature].gradient}`}>
                          <div className="text-white">
                            {features[activeFeature].icon}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                          <motion.div
                            key={item}
                            className="bg-gray-50 rounded-lg p-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: item * 0.1 }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <div className="flex-1 h-3 bg-gray-200 rounded"></div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trending Posts Preview */}
        {trendingPosts && trendingPosts.length > 0 && (
          <section className="py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                className="text-center mb-16"
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                <h2 className="text-4xl lg:text-5xl font-bold font-heading text-secondary mb-4">
                  Trending Today
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Discover what's capturing attention in our community right now.
                </p>
              </motion.div>

              {postsLoading ? (
                <div className="flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <motion.div 
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                >
                  {trendingPosts.slice(0, 6).map((post) => (
                    <motion.div key={post._id} variants={fadeInUp}>
                      <PostCard post={post} compact />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              <motion.div 
                className="text-center mt-12"
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                <Link
                  to="/categories"
                  className="inline-flex items-center px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Explore All Categories
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </motion.div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {!isAuthenticated && (
          <section className="py-24 bg-gradient-to-r from-primary to-primary-dark">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.div
                className="space-y-8"
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                <h2 className="text-4xl lg:text-5xl font-bold font-heading text-white">
                  Ready to Transform Your News Experience?
                </h2>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                  Join thousands of informed readers who rely on Intelixir for their daily news consumption. 
                  Get started in less than 2 minutes.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Start Your Journey
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200"
                  >
                    Already a Member? Sign In
                  </Link>
                </div>

                <div className="flex items-center justify-center space-x-8 pt-8 text-blue-200">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm">Free to join</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm">No ads</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm">Cancel anytime</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default HomePage;
                