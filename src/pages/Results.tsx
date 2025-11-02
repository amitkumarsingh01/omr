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

  const exportToCSV = () => {
    if (omrSheets.length === 0) {
      alert('No data to export');
      return;
    }

    // Get all question numbers from all sheets to create complete columns
    const allQuestionNumbers = new Set<string>();
    omrSheets.forEach(sheet => {
      Object.keys(sheet.responses || {}).forEach(q => allQuestionNumbers.add(q));
    });
    const sortedQuestions = Array.from(allQuestionNumbers).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    // Create CSV headers
    const headers = [
      'ID',
      'Student Name',
      'USN',
      'Exam Date',
      'Template',
      'Total Questions',
      'Correct',
      'Wrong',
      'Unanswered',
      'Percentage',
      'Processed Date',
      ...sortedQuestions.map(q => `Q${q}`)
    ];

    // Create CSV rows
    const rows = omrSheets.map(sheet => {
      const templateName = getTemplateName(sheet.template_id);
      const unanswered = sheet.total_questions - sheet.correct_count - sheet.wrong_count;
      
      const row = [
        sheet.id.toString(),
        (sheet.student_name && sheet.student_name.trim()) ? sheet.student_name : 'N/A',
        sheet.roll_number || 'N/A',
        sheet.exam_date || 'N/A',
        templateName,
        sheet.total_questions.toString(),
        sheet.correct_count.toString(),
        sheet.wrong_count.toString(),
        unanswered.toString(),
        sheet.percentage || '0%',
        new Date(sheet.created_at).toLocaleString(),
        ...sortedQuestions.map(q => sheet.responses?.[q] || '-')
      ];

      // Escape CSV values (handle commas, quotes, newlines)
      return row.map(cell => {
        const str = String(cell || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `omr-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Processed Results</h1>
        {omrSheets.length > 0 && (
          <button
            onClick={exportToCSV}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2"
            title="Export all results to CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export to CSV
          </button>
        )}
      </div>

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
                      {sheet.student_name && sheet.student_name.trim() ? sheet.student_name : 'Unknown Student'}
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
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                    title="Delete result"
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
                        <span className="text-white">{(selectedSheet.student_name && selectedSheet.student_name.trim()) ? selectedSheet.student_name : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">USN:</span>{' '}
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

