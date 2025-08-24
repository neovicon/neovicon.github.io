import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Save, Bell, Shield, Download, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile, api } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedInterests, setSelectedInterests] = useState(user?.interests?.map(i => i._id) || []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      emailPreferences: user?.emailPreferences || {}
    }
  });

  // Fetch categories for interests
  const { data: categories } = useQuery(
    'categories',
    async () => {
      const response = await api.get('/categories');
      return response.data.data.categories;
    }
  );

  const onSubmit = async (data) => {
    try {
      const updateData = {
        ...data,
        interests: selectedInterests
      };
      
      await updateProfile(updateData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleInterestToggle = (categoryId) => {
    setSelectedInterests(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleDataExport = async () => {
    try {
      const response = await api.get('/users/export-data');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'intelixir-data-export.json';
      a.click();
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleAccountDeletion = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/users/account');
        toast.success('Account deleted successfully');
        // Logout and redirect will be handled by the auth context
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Camera },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield }
  ];

  return (
    <>
      <Helmet>
        <title>Profile Settings - Intelixir</title>
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary mb-2">Account Settings</h1>
            <p className="text-gray-600">Manage your profile, preferences, and privacy settings</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-secondary mb-6">Profile Information</h2>
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                            {user?.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.name}
                                className="w-20 h-20 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl font-bold text-white">
                                {user?.name?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md border"
                          >
                            <Camera className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{user?.name}</h3>
                          <p className="text-gray-500 text-sm">{user?.email}</p>
                        </div>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          {...register('name', { required: 'Name is required' })}
                          className="input-field"
                          placeholder="Enter your full name"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                        )}
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          {...register('bio')}
                          rows={3}
                          className="input-field resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      {/* Interests */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Interests
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {categories?.map((category) => (
                            <button
                              key={category._id}
                              type="button"
                              onClick={() => handleInterestToggle(category._id)}
                              className={`p-3 rounded-lg text-sm font-medium transition-all ${
                                selectedInterests.includes(category._id)
                                  ? 'text-white shadow-md transform scale-105'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              style={selectedInterests.includes(category._id) ? 
                                { backgroundColor: category.color } : {}}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        <Save className="w-5 h-5" />
                        <span>Save Changes</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-secondary mb-6">Email & Notification Preferences</h2>
                    
                    <div className="space-y-6">
                      {/* Email Digest Frequency */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Email Digest Frequency
                        </label>
                        <div className="space-y-2">
                          {[
                            { value: 'daily', label: 'Daily digest' },
                            { value: 'weekly', label: 'Weekly digest' },
                            { value: 'instant', label: 'Instant notifications' },
                            { value: 'never', label: 'Never' }
                          ].map((option) => (
                            <label key={option.value} className="flex items-center">
                              <input
                                {...register('emailPreferences.digestFrequency')}
                                type="radio"
                                value={option.value}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                              />
                              <span className="ml-2 text-gray-700">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Breaking News */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Breaking News Alerts</h3>
                          <p className="text-sm text-gray-500">Get notified about important breaking news</p>
                        </div>
                        <input
                          {...register('emailPreferences.breakingNews')}
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                      </div>

                      <button
                        onClick={() => handleSubmit(onSubmit)()}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        <Save className="w-5 h-5" />
                        <span>Save Preferences</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-secondary mb-6">Privacy & Data</h2>
                    
                    <div className="space-y-6">
                      {/* GDPR Compliance */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-2">Your Data Rights</h3>
                        <p className="text-blue-700 text-sm mb-4">
                          Under GDPR, you have the right to access, export, and delete your personal data.
                        </p>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleDataExport}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            <span>Export My Data</span>
                          </button>
                        </div>
                      </div>

                      {/* Account Deletion */}
                      <div className="border-t pt-6">
                        <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
                        <p className="text-gray-600 text-sm mb-4">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button
                          onClick={handleAccountDeletion}
                          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
