import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { 
  type Crop, 
  type PixelCrop, 
  centerCrop,
  makeAspectCrop 
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface CropModalProps {
  title: string;
  description: string;
  imageUrl: string;
  onComplete: (croppedFile: File) => void;
  onCancel: () => void;
  uploading?: boolean;
}

export function CropModal({
  title,
  description,
  imageUrl,
  onComplete,
  onCancel,
  uploading
}: CropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [rotation, setRotation] = useState(0); // Rotation in degrees

  // Initialize crop when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Account for rotation when calculating dimensions
    const isRotated = rotation % 180 !== 0;
    const displayWidth = isRotated ? naturalHeight : naturalWidth;
    const displayHeight = isRotated ? naturalWidth : naturalHeight;
    const aspectRatio = displayWidth / displayHeight;
    
    // Set default crop to center 80% of image
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
          height: 80 / aspectRatio,
        },
        aspectRatio,
        displayWidth,
        displayHeight
      ),
      displayWidth,
      displayHeight
    );
    
    setCrop(crop);
  };

  // Handle rotation change
  const handleRotate = (degrees: number) => {
    const newRotation = (rotation + degrees) % 360;
    setRotation(newRotation);
    // Reset crop when rotating - will be reinitialized by useEffect
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  // Reinitialize crop when rotation changes
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      onImageLoad({ currentTarget: imgRef.current } as React.SyntheticEvent<HTMLImageElement>);
    }
  }, [rotation]);

  // Crop the image on frontend using canvas and return as File
  const cropImageToFile = useCallback(async (): Promise<File | null> => {
    if (!completedCrop || !imgRef.current) return null;
    
    const img = imgRef.current;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Create a temporary canvas to rotate the image first
    const tempCanvas = document.createElement('canvas');
    const isRotated = rotation % 180 !== 0;
    tempCanvas.width = isRotated ? naturalHeight : naturalWidth;
    tempCanvas.height = isRotated ? naturalWidth : naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return null;
    
    // Apply rotation transformation
    const centerX = tempCanvas.width / 2;
    const centerY = tempCanvas.height / 2;
    tempCtx.translate(centerX, centerY);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.translate(-naturalWidth / 2, -naturalHeight / 2);
    
    // Draw the rotated image
    tempCtx.drawImage(img, 0, 0);
    
    // Now crop from the rotated image
    const imgRect = imgRef.current.getBoundingClientRect();
    const displayWidth = imgRect.width;
    const displayHeight = imgRect.height;
    
    // Calculate scale factors for the rotated canvas
    const scaleX = tempCanvas.width / displayWidth;
    const scaleY = tempCanvas.height / displayHeight;
    
    // Convert display pixels to canvas pixels
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;
    
    // Create final canvas for cropped result
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    // Draw the cropped portion from rotated image
    ctx.drawImage(
      tempCanvas,
      cropX, cropY, cropWidth, cropHeight, // Source: crop from rotated image
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
  }, [completedCrop, rotation]);

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
                style={{ 
                  maxHeight: '70vh', 
                  maxWidth: '100%',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease'
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-blue-700 flex justify-between items-center">
          <div className="flex gap-2 items-center">
            {/* Aspect Ratio Buttons */}
            <div className="flex gap-2 border-r border-gray-600 pr-2 mr-2">
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
            
            {/* Rotation Buttons */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-400 mr-1">Rotate:</span>
              <button
                onClick={() => handleRotate(-90)}
                className="px-3 py-2 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600"
                title="Rotate 90° counter-clockwise"
              >
                ↺ -90°
              </button>
              <button
                onClick={() => handleRotate(90)}
                className="px-3 py-2 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600"
                title="Rotate 90° clockwise"
              >
                ↻ +90°
              </button>
              <button
                onClick={() => handleRotate(180)}
                className="px-3 py-2 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600"
                title="Rotate 180°"
              >
                ↻ 180°
              </button>
            </div>
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

