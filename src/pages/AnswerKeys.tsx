import { useState, useEffect } from 'react';
import { CropModal } from '../components/CropModal';
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
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedAnswerKey, setSelectedAnswerKey] = useState<AnswerKey | null>(null);

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
      const selectedFile = e.target.files[0];
      setError(null);
      const url = URL.createObjectURL(selectedFile);
      setImageUrl(url);
      setShowCropModal(true);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setFile(croppedFile);
    setShowCropModal(false);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
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
            <div 
              key={key.id} 
              className="card cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => setSelectedAnswerKey(key)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{key.name}</h3>
                  {key.description && (
                    <p className="text-gray-400 text-sm mb-2">{key.description}</p>
                  )}
                  <p className="text-gray-400 text-sm">
                    {Object.keys(key.answer_key).length} answers
                  </p>
                  <p className="text-blue-400 text-sm mt-2">Click to view answers →</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(key.id);
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold ml-4"
                  title="Delete answer key"
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
                    Cropped image ready: {file.name} ({(file.size / 1024).toFixed(2)} KB)
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
                  if (imageUrl) {
                    URL.revokeObjectURL(imageUrl);
                    setImageUrl(null);
                  }
                  setShowCropModal(false);
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

      {showCropModal && imageUrl && (
        <CropModal
          title="Crop Answer Key Image"
          description="Crop the OMR sheet image to focus on the answer key region. Adjust the crop area and click 'Crop & Continue' when done."
          imageUrl={imageUrl}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
          uploading={uploading}
        />
      )}

      {selectedAnswerKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAnswerKey(null)}>
          <div className="card max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedAnswerKey.name}</h2>
                {selectedAnswerKey.description && (
                  <p className="text-gray-400">{selectedAnswerKey.description}</p>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={async () => {
                    if (confirm(`Are you sure you want to delete "${selectedAnswerKey.name}"? This action cannot be undone.`)) {
                      try {
                        await api.deleteAnswerKey(selectedAnswerKey.id);
                        setSelectedAnswerKey(null);
                        loadAnswerKeys();
                      } catch (err) {
                        alert('Failed to delete answer key');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedAnswerKey(null)}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="mb-4 text-sm text-gray-400">
                Total Questions: {Object.keys(selectedAnswerKey.answer_key).length}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Object.entries(selectedAnswerKey.answer_key)
                  .sort(([a], [b]) => {
                    // Sort numerically if both are numbers, otherwise alphabetically
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (!isNaN(numA) && !isNaN(numB)) {
                      return numA - numB;
                    }
                    return a.localeCompare(b);
                  })
                  .map(([questionNum, answer]) => (
                    <div
                      key={questionNum}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-blue-500 transition-colors"
                    >
                      <div className="text-xs text-gray-400 mb-1">Q{questionNum}</div>
                      <div className="text-lg font-bold text-blue-400">{answer}</div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => setSelectedAnswerKey(null)}
                className="btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnswerKeys;

