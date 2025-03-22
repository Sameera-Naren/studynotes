import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserCircle, Edit2 } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  course: string;
  branch: string;
  year: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState<number>(1);

  useEffect(() => {
    fetchUserAndProfile();
  }, []);

  const fetchUserAndProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        // If a profile exists, use it to populate the form
        if (profiles && profiles.length > 0) {
          const profile = profiles[0];
          setProfile(profile);
          setName(profile.name);
          setCourse(profile.course);
          setBranch(profile.branch);
          setYear(profile.year);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const profileData = {
        user_id: user.id,
        name,
        course,
        branch,
        year,
        updated_at: new Date().toISOString(),
      };

      let query = supabase.from('profiles');
      
      if (profile) {
        // If profile exists, update it
        const { data, error } = await query
          .update(profileData)
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;
        setProfile(data);
      } else {
        // If no profile exists, insert a new one
        const { data, error } = await query
          .insert(profileData)
          .select()
          .single();

        if (error) throw error;
        setProfile(data);
      }
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        {!isEditing && profile ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UserCircle className="h-16 w-16 text-blue-500" />
                <h1 className="text-3xl font-bold text-gray-900 ml-4">{profile.name}</h1>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Course</dt>
                  <dd className="mt-1 text-lg text-gray-900">{profile.course}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Branch</dt>
                  <dd className="mt-1 text-lg text-gray-900">{profile.branch}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Year</dt>
                  <dd className="mt-1 text-lg text-gray-900">{profile.year}{profile.year === 1 ? 'st' : profile.year === 2 ? 'nd' : profile.year === 3 ? 'rd' : 'th'} Year</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-lg text-gray-900">{user?.email}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center mb-6">
              <UserCircle className="h-12 w-12 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900 ml-3">
                {profile ? 'Edit Profile' : 'Create Profile'}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Course of Study
                </label>
                <input
                  type="text"
                  required
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Bachelor of Technology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <select
                  required
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              <div className="flex gap-4">
                {profile && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {saving ? (
                    <div className="h-5 w-5 border-t-2 border-white rounded-full animate-spin"></div>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;