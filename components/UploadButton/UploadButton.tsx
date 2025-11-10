'use client';

import { useRef, ChangeEvent } from 'react';

interface UploadButtonProps {
  onImageUpload: (file: File) => void;
  onMultipleFilesUpload?: (files: File[]) => void;
  accept?: string;
}

// Supported image formats including TIF/TIFF
const SUPPORTED_IMAGE_TYPES = [
  'image/*',
  '.tif',
  '.tiff',
  'image/tiff',
  'image/tif',
];

// Supported video formats
const SUPPORTED_VIDEO_TYPES = [
  'video/*',
  '.mp4',
  '.webm',
  '.ogg',
  '.mov',
  '.avi',
  '.mkv',
  '.flv',
  '.wmv',
  '.m4v',
  '.3gp',
];

export const UploadButton: React.FC<UploadButtonProps> = ({
  onImageUpload,
  onMultipleFilesUpload,
  accept = 'image/*,video/*,.tif,.tiff,.obj,.gltf,.glb,.fbx,.mb,.ma,.bin',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Check if any file is a GLTF file (which might need dependencies)
    const hasGLTF = files.some(f => 
      f.name.toLowerCase().endsWith('.gltf')
    );
    
    if (hasGLTF && files.length > 1 && onMultipleFilesUpload) {
      // If GLTF with multiple files, use multiple file handler
      onMultipleFilesUpload(files);
    } else {
      // Single file or non-GLTF, use single file handler
      const file = files[0];
      if (file && (isImageFile(file) || isModelFile(file))) {
        onImageUpload(file);
      }
    }
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check if file is an image or video
  const isImageFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // Check by MIME type
    if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
      return true;
    }
    
    // Check by file extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tif', '.tiff'];
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'];
    return imageExtensions.some(ext => fileName.endsWith(ext)) || 
           videoExtensions.some(ext => fileName.endsWith(ext));
  };
  
  // Check if file is a 3D model
  const isModelFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return ['.obj', '.gltf', '.glb', '.fbx', '.mb', '.ma', '.bin'].some(ext => fileName.endsWith(ext));
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        Upload Media
      </button>
    </div>
  );
};

