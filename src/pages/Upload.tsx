import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Upload as UploadIcon } from 'lucide-react';

const Upload = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bucketExists, setBucketExists] = useState(false);

  useEffect(() => {
    checkBucketExists();
  }, []);

  const checkBucketExists = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) throw error;

      const notesBucket = buckets.find(bucket => bucket.name === 'notes');
      if (!notesBucket) {
        // Create the bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket('notes', {
          public: false,
          fileSizeLimit: 52428800, // 50MB
        });
        if (createError) throw createError;
      }
      setBucketExists(true);
    } catch (error: any) {
      setError('Storage setup error: ' + error.message);
      console.error('Storage setup error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!bucketExists) {
      setError('Storage is not properly configured. Please try again later.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('You must be logged in to upload notes');
      }

      // First create the database entry
      const { data: noteData, error: dbError } = await supabase.from('notes').insert([
        {
          title,
          description,
          subject,
          file_path: '', // Temporary empty path
          user_id: user.data.user.id // Add the user_id
        },
      ]).select().single();

      if (dbError) throw dbError;

      // Then upload the file with the note ID as part of the path
      const fileExt = file.name.split('.').pop();
      const filePath = `${noteData.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        // If upload fails, delete the database entry
        await supabase.from('notes').delete().eq('id', noteData.id);
        throw uploadError;
      }

      // Update the note with the correct file path
      const { error: updateError } = await supabase
        .from('notes')
        .update({ file_path: filePath })
        .eq('id', noteData.id);

      if (updateError) throw updateError;

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'An error occurred while uploading the file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-center mb-6">
          <UploadIcon className="h-12 w-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Upload Lecture Notes
        </h2>

        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Introduction to Psychology"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Brief description of the notes content..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Psychology 101"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              File
            </label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              accept=".pdf,.doc,.docx,.txt,.md"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !bucketExists}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 border-t-2 border-white rounded-full animate-spin"></div>
            ) : (
              'Upload Notes'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;