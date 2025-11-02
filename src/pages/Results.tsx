import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { OMRSheet, Template } from '../types/index.ts';

function Results() {
  const [omrSheets, setOmrSheets] = useState<OMRSheet[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<OMRSheet | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sheetsData, templatesData] = await Promise.all([
        api.getOMRSheets(),
        api.getTemplates(),
      ]);
      setOmrSheets(sheetsData);
      setTemplates(templatesData);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateName = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    return template?.name || `Template ${templateId}`;
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    
    try {
      await api.deleteOMRSheet(id);
      loadData();
      if (selectedSheet?.id === id) {
        setSelectedSheet(null);
      }
    } catch (err) {
      alert('Failed to delete result');
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading results...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-white">Processed Results</h1>

      {omrSheets.length === 0 ? (
        <div className="card text-center text-gray-400">
          No results found. Upload and process an OMR sheet to see results here.
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 text-white">All Results</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {omrSheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    onClick={() => setSelectedSheet(sheet)}
                    className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                      selectedSheet?.id === sheet.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-blue-700 hover:border-blue-600'
                    }`}
                  >
                    <div className="font-semibold text-white">
                      {sheet.student_name || 'Unknown Student'}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {getTemplateName(sheet.template_id)}
                    </div>
                    {sheet.percentage && (
                      <div className="text-sm font-semibold text-orange-500 mt-1">
                        Score: {sheet.percentage} ({sheet.correct_count || 0}/{sheet.total_questions || 0})
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(sheet.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedSheet ? (
              <div className="card">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-semibold text-white">Result Details</h2>
                  <button
                    onClick={() => handleDelete(selectedSheet.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Statistics Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Score Statistics</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-400">{selectedSheet.correct_count}</div>
                        <div className="text-sm text-gray-300 mt-1">Correct</div>
                      </div>
                      <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-red-400">{selectedSheet.wrong_count}</div>
                        <div className="text-sm text-gray-300 mt-1">Wrong</div>
                      </div>
                      <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-blue-400">
                          {selectedSheet.total_questions - selectedSheet.correct_count - selectedSheet.wrong_count}
                        </div>
                        <div className="text-sm text-gray-300 mt-1">Unanswered</div>
                      </div>
                      <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-orange-400">{selectedSheet.percentage}</div>
                        <div className="text-sm text-gray-300 mt-1">Score</div>
                      </div>
                    </div>
                    <div className="mt-4 bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-gray-300">
                        Total Questions: <span className="text-white font-semibold">{selectedSheet.total_questions}</span>
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        Answered: <span className="text-white font-semibold">
                          {selectedSheet.correct_count + selectedSheet.wrong_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Student Information</h3>
                    <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="text-gray-400">Name:</span>{' '}
                        <span className="text-white">{selectedSheet.student_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Roll Number:</span>{' '}
                        <span className="text-white">{selectedSheet.roll_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Exam Date:</span>{' '}
                        <span className="text-white">{selectedSheet.exam_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Template:</span>{' '}
                        <span className="text-white">{getTemplateName(selectedSheet.template_id)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Processed:</span>{' '}
                        <span className="text-white">
                          {new Date(selectedSheet.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Responses</h3>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="grid grid-cols-10 gap-2">
                        {Object.entries(selectedSheet.responses).map(([question, answer]) => {
                          const template = templates.find((t) => t.id === selectedSheet.template_id);
                          const correctAnswer = template?.answer_key[question];
                          const isCorrect = answer && correctAnswer && 
                            answer.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
                          const isAnswered = answer && answer.trim() !== "";
                          
                          return (
                            <div
                              key={question}
                              className={`text-center p-2 rounded border-2 ${
                                !isAnswered
                                  ? 'bg-slate-800/50 border-gray-600'
                                  : isCorrect
                                  ? 'bg-green-900/30 border-green-600'
                                  : 'bg-red-900/30 border-red-600'
                              }`}
                            >
                              <div className="text-xs text-gray-400">{question}</div>
                              <div className={`text-sm font-semibold ${
                                !isAnswered
                                  ? 'text-gray-500'
                                  : isCorrect
                                  ? 'text-green-400'
                                  : 'text-red-400'
                              }`}>
                                {answer || '-'}
                              </div>
                              {correctAnswer && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ✓ {correctAnswer}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-900/30 border-2 border-green-600 rounded"></div>
                          <span className="text-gray-300">Correct</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-900/30 border-2 border-red-600 rounded"></div>
                          <span className="text-gray-300">Wrong</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-800/50 border-2 border-gray-600 rounded"></div>
                          <span className="text-gray-300">Unanswered</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Intentionally hiding raw JSON for other details */}

                  
                </div>
              </div>
            ) : (
              <div className="card text-center text-gray-400">
                Select a result from the list to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Results;

