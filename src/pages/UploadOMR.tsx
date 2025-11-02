import { useState, useEffect, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Types from react-image-crop
type Crop = {
  unit: 'px' | '%';
  x: number;
  y: number;
  width: number;
  height: number;
} | undefined;

type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
} | undefined;
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
      setExtractedName(res.student_name || null);
      
      // After extracting name, show OMR crop modal only if answer key is selected
      if (selectedAnswerKey) {
        setShowOmrCropModal(true);
      } else {
        setError('Please select an answer key first');
      }
    } catch (err: any) {
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
      const omrRes = await api.processCroppedOMRByAnswerKey(selectedAnswerKey, croppedFile);
      setResult(omrRes);
      if (omrRes.image_path) setOmrCropPath(omrRes.image_path);
    } catch (err: any) {
      setError(err.message || 'Failed to process OMR sheet');
      setShowOmrCropModal(true); // Re-open modal on error
    } finally {
      setUploading(false);
    }
  }, [selectedAnswerKey]);

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
          description="Drag and resize the orange box to select the area containing the student's name and roll number."
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
                <div><span className="text-gray-400">Roll Number:</span> <span className="text-white">{result.roll_number || 'N/A'}</span></div>
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

// Crop Modal Component using react-image-crop
function CropModal({
  title,
  description,
  imageUrl,
  onComplete,
  onCancel,
  uploading
}: {
  title: string;
  description: string;
  imageUrl: string;
  onComplete: (croppedFile: File) => void;
  onCancel: () => void;
  uploading?: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>(undefined);
  const [aspect, setAspect] = useState<number | undefined>(undefined);

  // Initialize crop when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const aspectRatio = naturalWidth / naturalHeight;
    
    // Set default crop to center 80% of image
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
          height: 80 / aspectRatio,
        },
        aspectRatio,
        naturalWidth,
        naturalHeight
      ),
      naturalWidth,
      naturalHeight
    );
    
    setCrop(crop);
  };

  // Crop the image on frontend using canvas and return as File
  const cropImageToFile = useCallback(async (): Promise<File | null> => {
    if (!completedCrop || !imgRef.current) return null;
    
    const img = imgRef.current;
    const imgRect = img.getBoundingClientRect();
    const displayWidth = imgRect.width;
    const displayHeight = imgRect.height;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Calculate scale factors
    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;
    
    // Convert display pixels to natural pixels
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;
    
    // Create canvas and crop
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    // Draw the cropped portion
    ctx.drawImage(
      img,
      cropX, cropY, cropWidth, cropHeight, // Source: crop from original
      0, 0, cropWidth, cropHeight // Destination: full canvas
    );
    
    // Convert canvas to blob then to file
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], 'cropped.png', { type: 'image/png' });
        resolve(file);
      }, 'image/png');
    });
  }, [completedCrop]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg border border-blue-700 shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-blue-700">
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>

        {/* Cropper */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <div className="relative">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="max-w-full"
            >
          <img 
            ref={imgRef} 
                alt="Crop me"
            src={imageUrl} 
                style={{ maxHeight: '70vh', maxWidth: '100%' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
        </div>
      </div>

        {/* Footer */}
        <div className="p-6 border-t border-blue-700 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setAspect(undefined)}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                aspect === undefined 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setAspect(1)}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                aspect === 1 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              1:1
            </button>
            <button
              onClick={() => setAspect(16 / 9)}
              className={`px-4 py-2 rounded text-sm font-semibold ${
                aspect === 16 / 9 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              16:9
            </button>
        </div>
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              disabled={uploading}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const croppedFile = await cropImageToFile();
                if (croppedFile) {
                  onComplete(croppedFile);
                }
              }}
              disabled={!completedCrop || uploading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Processing...' : '✓ Crop & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadOMR;


