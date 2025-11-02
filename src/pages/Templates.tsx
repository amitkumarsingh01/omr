import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Template } from '../types/index.ts';

function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'upload'>('manual');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total_questions: '',
    answer_key: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates', err);
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

  const handleCreateFromUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please enter a template name');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // First create answer key from image
      const answerKeyData = await api.createAnswerKey(formData.name, formData.description || null, file);
      
      // Then create template from the answer key
      const templateData = {
        name: formData.name,
        description: formData.description || null,
        total_questions: Object.keys(answerKeyData.answer_key).length,
        answer_key: answerKeyData.answer_key,
      };

      await api.createTemplate(templateData);
      setShowCreateModal(false);
      setFile(null);
      setFormData({ name: '', description: '', total_questions: '', answer_key: '' });
      setCreateMode('manual');
      loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to create template from image');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const answerKey = JSON.parse(formData.answer_key);
      const templateData = {
        name: formData.name,
        description: formData.description || null,
        total_questions: parseInt(formData.total_questions),
        answer_key: answerKey,
      };

      await api.createTemplate(templateData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', total_questions: '', answer_key: '' });
      setCreateMode('manual');
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to create template');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await api.deleteTemplate(id);
      loadTemplates();
    } catch (err) {
      alert('Failed to delete template');
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading templates...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Templates</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="card text-center text-gray-400">
          No templates found. Create your first template to get started.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{template.name}</h3>
                  {template.description && (
                    <p className="text-gray-400 text-sm mb-2">{template.description}</p>
                  )}
                  <p className="text-gray-400 text-sm">
                    {template.total_questions} questions
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                  title="Delete template"
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
          <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4 text-white">Create Template</h2>
            
            {/* Mode Selection */}
            <div className="mb-6 flex gap-4">
              <button
                onClick={() => {
                  setCreateMode('manual');
                  setFile(null);
                  setError(null);
                }}
                className={`px-4 py-2 rounded-lg transition-all ${
                  createMode === 'manual'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => {
                  setCreateMode('upload');
                  setError(null);
                }}
                className={`px-4 py-2 rounded-lg transition-all ${
                  createMode === 'upload'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Upload Image
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-300">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="e.g., Math Exam 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full"
                  placeholder="Optional description"
                />
              </div>

              {createMode === 'upload' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Upload OMR Sheet with Answer Key *
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
                    <p className="text-xs text-gray-400 mt-2">
                      Upload an OMR sheet image with correct answers marked. AI will automatically extract the answer key.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Total Questions *
                    </label>
                    <input
                      type="number"
                      value={formData.total_questions}
                      onChange={(e) => setFormData({ ...formData, total_questions: e.target.value })}
                      className="input-field w-full"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Answer Key (JSON) *
                    </label>
                    <textarea
                      value={formData.answer_key}
                      onChange={(e) => setFormData({ ...formData, answer_key: e.target.value })}
                      className="input-field w-full h-32 font-mono text-sm"
                      placeholder='{"1": "A", "2": "B", "3": "C", ...}'
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Format: {"{"}"1": "A", "2": "B", ...{"}"}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFile(null);
                  setFormData({ name: '', description: '', total_questions: '', answer_key: '' });
                  setCreateMode('manual');
                  setError(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createMode === 'upload' ? handleCreateFromUpload : handleCreate}
                disabled={
                  createMode === 'upload'
                    ? !file || !formData.name.trim() || uploading
                    : !formData.name.trim() || !formData.total_questions || !formData.answer_key.trim() || uploading
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Processing...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Templates;

