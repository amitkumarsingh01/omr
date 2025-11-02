import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { AnswerKey } from '../types/index.ts';

function AnswerKeys() {
  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnswerKeys();
  }, []);

  const loadAnswerKeys = async () => {
    try {
      const data = await api.getAnswerKeys();
      setAnswerKeys(data);
    } catch (err) {
      console.error('Failed to load answer keys', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleCreate = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await api.createAnswerKey(name, description || null, file);
      setShowCreateModal(false);
      setFile(null);
      setName('');
      setDescription('');
      loadAnswerKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to create answer key');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this answer key?')) return;
    
    try {
      await api.deleteAnswerKey(id);
      loadAnswerKeys();
    } catch (err) {
      alert('Failed to delete answer key');
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading answer keys...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Answer Keys</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + Create Answer Key
        </button>
      </div>

      <div className="card mb-6 bg-blue-900/30 border-blue-600">
        <p className="text-gray-300">
          Upload an OMR sheet image with correct answers marked. AI will automatically extract the answer key.
        </p>
      </div>

      {answerKeys.length === 0 ? (
        <div className="card text-center text-gray-400">
          No answer keys found. Create your first answer key by uploading an OMR sheet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {answerKeys.map((key) => (
            <div key={key.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{key.name}</h3>
                  {key.description && (
                    <p className="text-gray-400 text-sm mb-2">{key.description}</p>
                  )}
                  <p className="text-gray-400 text-sm">
                    {Object.keys(key.answer_key).length} answers
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(key.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
              
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-semibold mb-4 text-white">Create Answer Key</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Answer Key Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., Math Exam 2024 Answer Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field w-full"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload OMR Sheet with Answers *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
                />
                {file && (
                  <div className="text-sm text-gray-400 mt-2">
                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFile(null);
                  setName('');
                  setDescription('');
                  setError(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!file || !name.trim() || uploading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Processing...' : 'Create Answer Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnswerKeys;

