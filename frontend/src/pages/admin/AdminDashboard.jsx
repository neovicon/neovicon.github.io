import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Settings,
  Mail,
  RefreshCw
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { api } = useAuth();
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const location = useLocation();
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery(
    'admin-dashboard',
    async () => {
      const response = await api.get('/admin/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data.data;
    }
  );

  const handleManualNewsFetch = async () => {
    setIsRefreshingNews(true);
    try {
      await api.post('/admin/news/fetch', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      await refetch();
      toast.success('News fetch completed successfully!');
    } catch (error) {
      toast.error('Failed to fetch news');
    } finally {
      setIsRefreshingNews(false);
    }
  };

  const sidebarItems = [
    { path: '/admin', label: 'Overview', icon: BarChart3 },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/posts', label: 'Posts', icon: FileText },
    { path: '/admin/categories', label: 'Categories', icon: Settings },
    { path: '/admin/contacts', label: 'Messages', icon: Mail }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Intelixir</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-sm border-r">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-secondary">Admin Panel</h2>
            </div>
            
            <nav className="p-4 space-y-2">
              {sidebarItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<AdminOverview data={dashboardData} onRefreshNews={handleManualNewsFetch} isRefreshingNews={isRefreshingNews} />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/posts" element={<AdminPosts />} />
              <Route path="/categories" element={<AdminCategories />} />
              <Route path="/contacts" element={<AdminContacts />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
};

// Admin Overview Component
const AdminOverview = ({ data, onRefreshNews, isRefreshingNews }) => {
  if (!data) return <LoadingSpinner />;

  const stats = [
    { label: 'Total Users', value: data.overview.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Posts', value: data.overview.totalPosts, icon: FileText, color: 'bg-green-500' },
    { label: 'Categories', value: data.overview.totalCategories, icon: Settings, color: 'bg-purple-500' },
    { label: 'Pending Messages', value: data.overview.pendingContacts, icon: Mail, color: 'bg-red-500' }
  ];

  // Ensure recentActivity is always an array
  const recentActivity = Array.isArray(data.recentActivity) ? data.recentActivity : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor your platform's performance and activity</p>
        </div>
        
        <button
          onClick={onRefreshNews}
          disabled={isRefreshingNews}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshingNews ? 'animate-spin' : ''}`} />
          <span>{isRefreshingNews ? 'Fetching...' : 'Fetch News'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Growth Metrics */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Growth</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Users</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{data.weekly.users}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  data.growth.users >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {data.growth.users > 0 ? '+' : ''}{data.growth.users}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Posts</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{data.weekly.posts}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  data.growth.posts >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {data.growth.posts > 0 ? '+' : ''}{data.growth.posts}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-gray-600">{activity.description}</span>
                <span className="text-gray-400 ml-auto">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// User Management
const AdminUsers = () => {
  const { api } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/users', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setUsers(res.data.data.users || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  if (loading) return <LoadingSpinner text="Loading users..." />;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <table className="min-w-full bg-white border rounded">
        <thead><tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th></tr></thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} className="border-t"><td className="p-2">{user.name}</td><td className="p-2">{user.email}</td><td className="p-2">{user.role}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Post Management
const AdminPosts = () => {
  const { api } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/posts', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setPosts(res.data.data.posts || []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  if (loading) return <LoadingSpinner text="Loading posts..." />;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Post Management</h2>
      <table className="min-w-full bg-white border rounded">
        <thead><tr><th className="p-2">Title</th><th className="p-2">Author</th><th className="p-2">Type</th></tr></thead>
        <tbody>
          {posts.map(post => (
            <tr key={post._id} className="border-t"><td className="p-2">{post.title}</td><td className="p-2">{post.author?.name || 'N/A'}</td><td className="p-2">{post.type}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Category Management
const AdminCategories = () => {
  const { api } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [color, setColor] = React.useState('#00A4EF');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setCategories(res.data.data.categories || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/categories', { name, slug, description, color }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setSuccess('Category added!');
      setName(''); setSlug(''); setDescription(''); setColor('#00A4EF');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${slug}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      fetchCategories();
    } catch {}
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Category Management</h2>
      <form onSubmit={handleAdd} className="mb-6 flex flex-wrap gap-2 items-end">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="border rounded px-2 py-1" required />
        <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug" className="border rounded px-2 py-1" required />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="border rounded px-2 py-1" />
        <input value={color} onChange={e => setColor(e.target.value)} type="color" className="w-8 h-8 border rounded" />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Add</button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {loading ? <LoadingSpinner text="Loading categories..." /> : (
        <table className="min-w-full bg-white border rounded">
          <thead><tr><th className="p-2">Name</th><th className="p-2">Slug</th><th className="p-2">Description</th><th className="p-2">Color</th><th className="p-2">Actions</th></tr></thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat._id} className="border-t">
                <td className="p-2">{cat.name}</td>
                <td className="p-2">{cat.slug}</td>
                <td className="p-2">{cat.description}</td>
                <td className="p-2"><span style={{ background: cat.color, display: 'inline-block', width: 20, height: 20, borderRadius: 4 }}></span></td>
                <td className="p-2"><button onClick={() => handleDelete(cat.slug)} className="text-red-600 hover:underline">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Contact Management
const AdminContacts = () => {
  const { api } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [contacts, setContacts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/contacts', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setContacts(res.data.data.contacts || []);
      } catch {
        setContacts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  if (loading) return <LoadingSpinner text="Loading contacts..." />;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Contact Messages</h2>
      <table className="min-w-full bg-white border rounded">
        <thead><tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Message</th><th className="p-2">Status</th></tr></thead>
        <tbody>
          {contacts.map(contact => (
            <tr key={contact._id} className="border-t"><td className="p-2">{contact.name}</td><td className="p-2">{contact.email}</td><td className="p-2">{contact.message}</td><td className="p-2">{contact.status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
