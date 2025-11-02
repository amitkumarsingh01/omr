import { useState, useEffect, useCallback } from 'react';
import { CropModal } from '../components/CropModal';
import { api } from '../services/api';
import type { AnswerKey } from '../types/index.ts';
 

function UploadOMR() {
  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([]);
  const [selectedAnswerKey, setSelectedAnswerKey] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Crop modal states
  const [showNameCropModal, setShowNameCropModal] = useState(false);
  const [showOmrCropModal, setShowOmrCropModal] = useState(false);
  
  const [extractedName, setExtractedName] = useState<string | null>(null);
  const [extractedUSN, setExtractedUSN] = useState<string | null>(null);
  const [extractedDate, setExtractedDate] = useState<string | null>(null);
  const [omrCropPath, setOmrCropPath] = useState<string | null>(null);

  useEffect(() => {
    loadAnswerKeys();
  }, []);

  // Handle name crop completion - receives cropped image file
  const handleNameCropComplete = useCallback(async (croppedFile: File) => {
    if (!croppedFile) return;
    
    setShowNameCropModal(false);
    
    try {
      setUploading(true);
      setError(null);
      const res = await api.extractNameFromCropped(croppedFile);
      console.log('Name extraction response:', res);
      const extractedNameValue = res.student_name && res.student_name.trim() ? res.student_name.trim() : null;
      const extractedUSNValue = res.roll_number && res.roll_number.trim() ? res.roll_number.trim() : null;
      const extractedDateValue = res.exam_date && res.exam_date.trim() ? res.exam_date.trim() : null;
      
      setExtractedName(extractedNameValue);
      setExtractedUSN(extractedUSNValue);
      setExtractedDate(extractedDateValue);
      
      if (!extractedNameValue) {
        console.warn('No name extracted from image');
        // Don't block the flow, just warn - user can proceed
      }
      
      // After extracting name, show OMR crop modal only if answer key is selected
      if (selectedAnswerKey) {
        setShowOmrCropModal(true);
      } else {
        setError('Please select an answer key first');
      }
    } catch (err: any) {
      console.error('Error extracting name:', err);
      setError(err.message || 'Failed to extract name');
      setShowNameCropModal(true); // Re-open modal on error
    } finally {
      setUploading(false);
    }
  }, [selectedAnswerKey]);

  // Handle OMR crop completion - receives cropped image file
  const handleOmrCropComplete = useCallback(async (croppedFile: File) => {
    if (!croppedFile || !selectedAnswerKey) return;
    
    setShowOmrCropModal(false);
    
    try {
      setUploading(true);
      setError(null);
      // Pass the extracted name, USN, and date if they exist and are not empty
      const nameToSend = extractedName && extractedName.trim() ? extractedName.trim() : undefined;
      const usnToSend = extractedUSN && extractedUSN.trim() ? extractedUSN.trim() : undefined;
      const dateToSend = extractedDate && extractedDate.trim() ? extractedDate.trim() : undefined;
      console.log('Sending to backend - Name:', nameToSend, 'USN:', usnToSend, 'Date:', dateToSend);
      const omrRes = await api.processCroppedOMRByAnswerKey(selectedAnswerKey, croppedFile, nameToSend, usnToSend, dateToSend);
      console.log('OMR processing response:', omrRes);
      setResult(omrRes);
      // Update extracted values from response if they come back
      if (omrRes.student_name && omrRes.student_name.trim()) {
        setExtractedName(omrRes.student_name.trim());
        console.log('Name saved in response:', omrRes.student_name);
      }
      if (omrRes.roll_number && omrRes.roll_number.trim()) {
        setExtractedUSN(omrRes.roll_number.trim());
      }
      if (omrRes.exam_date && omrRes.exam_date.trim()) {
        setExtractedDate(omrRes.exam_date.trim());
      }
      if (omrRes.image_path) setOmrCropPath(omrRes.image_path);
    } catch (err: any) {
      setError(err.message || 'Failed to process OMR sheet');
      setShowOmrCropModal(true); // Re-open modal on error
    } finally {
      setUploading(false);
    }
  }, [selectedAnswerKey, extractedName, extractedUSN, extractedDate]);

  const loadAnswerKeys = async () => {
    try {
      const data = await api.getAnswerKeys();
      setAnswerKeys(data);
    } catch (err) {
      setError('Failed to load answer keys');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setExtractedName(null);
      setExtractedUSN(null);
      setExtractedDate(null);
      setOmrCropPath(null);
      const url = URL.createObjectURL(selectedFile);
      setImageUrl(url);
      
      // Show name crop modal immediately after file upload (only if answer key is selected)
      if (selectedAnswerKey) {
        setShowNameCropModal(true);
      }
    }
  };

  const handleAnswerKeyChange = (keyId: number) => {
    setSelectedAnswerKey(keyId);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Show main UI only when not cropping */}
      {!showNameCropModal && !showOmrCropModal && (
        <>
      <h1 className="text-4xl font-bold mb-8 text-white">Upload OMR Sheet</h1>

      <div className="card mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-white">Step 1: Select Answer Key</h2>
        {answerKeys.length === 0 ? (
          <div className="text-gray-400 mb-4">
            No answer keys available. Please create an answer key first.
          </div>
        ) : (
          <div className="space-y-2">
            {answerKeys.map((key) => (
              <label
                key={key.id}
                className={`block p-4 rounded-lg cursor-pointer border-2 transition-all ${
                  selectedAnswerKey === key.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-blue-700 hover:border-blue-600'
                }`}
              >
                <input
                  type="radio"
                  name="answerKey"
                  value={key.id}
                  checked={selectedAnswerKey === key.id}
                  onChange={(e) => handleAnswerKeyChange(Number(e.target.value))}
                  className="mr-3"
                />
                <span className="font-semibold text-white">{key.name}</span>
                <span className="text-gray-400 ml-2">
                  ({Object.keys(key.answer_key || {}).length} questions)
                </span>
                {key.description && (
                  <div className="text-sm text-gray-400 mt-1">{key.description}</div>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="card mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-white">Step 2: Upload OMR Sheet</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Choose Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
            />
          </div>
          {file && (
            <div className="text-sm text-gray-400">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>
      </div>

          </>
        )}

      {/* Name Crop Modal */}
      {showNameCropModal && imageUrl && (
        <CropModal
          title="Select Name Area"
          description="Drag and resize the orange box to select the area containing the student's name, USN, and exam date."
          imageUrl={imageUrl}
          onComplete={handleNameCropComplete}
          onCancel={() => {
            setShowNameCropModal(false);
            setImageUrl(null);
            setFile(null);
          }}
          uploading={uploading}
        />
      )}

      {/* OMR Crop Modal */}
      {showOmrCropModal && imageUrl && selectedAnswerKey && (
        <CropModal
          title="Select OMR Answers Area"
          description="Drag and resize the orange box to select the area containing the OMR answer bubbles."
          imageUrl={imageUrl}
          onComplete={handleOmrCropComplete}
          onCancel={() => {
            setShowOmrCropModal(false);
          }}
          uploading={uploading}
        />
      )}

      {/* Show results only after OMR crop is complete */}
      {result && !showNameCropModal && !showOmrCropModal && (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 text-white">Processing Results</h2>
          
          <div className="space-y-4">
            {omrCropPath && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">OMR Crop Preview</h3>
                <img 
                  src={omrCropPath.startsWith('http') ? omrCropPath : `${import.meta.env.VITE_API_URL || 'https://omr.msiproject.space'}${omrCropPath}`} 
                  alt="omr-crop" 
                  className="max-h-64 rounded border border-blue-700" 
                />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Student Details</h3>
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div><span className="text-gray-400">Name:</span> <span className="text-white">{extractedName || result.student_name || 'N/A'}</span></div>
                <div><span className="text-gray-400">USN:</span> <span className="text-white">{result.roll_number || 'N/A'}</span></div>
                <div><span className="text-gray-400">Exam Date:</span> <span className="text-white">{result.exam_date || 'N/A'}</span></div>
                {result.correct_count !== undefined && (
                  <div><span className="text-gray-400">Score:</span> <span className="text-white">{result.correct_count}/{result.total_questions} ({result.percentage || '0%'})</span></div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Responses</h3>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(result.responses || {}).map(([question, answer]: any) => (
                    <div key={question} className="text-center p-2 rounded border border-blue-700">
                      <div className="text-xs text-gray-400">{question}</div>
                      <div className="text-sm font-semibold text-white">{(answer as string) || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Intentionally hiding raw JSON for other details */}
          </div>
        </div>
      )}

      {/* Show error if any */}
      {error && !showNameCropModal && !showOmrCropModal && (
        <div className="card mb-6 bg-red-900/50 border-red-600">
          <p className="text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}

export default UploadOMR;


