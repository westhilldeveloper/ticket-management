import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/app/context/ToastContext';
import { MAX_FILES, MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from '../constants';

export function useFileUpload() {
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(file => {
        file.errors.forEach(error => {
          switch (error.code) {
            case 'file-too-large':
              toast.error(`${file.file.name} is too large. Max size is 5MB`, { duration: 5000 });
              break;
            case 'file-invalid-type':
              toast.error(`${file.file.name} has invalid file type. Allowed: Images, PDF, DOC, XLS, TXT`, { duration: 5000 });
              break;
            case 'too-many-files':
              toast.error(`Maximum ${MAX_FILES} files allowed`, { duration: 5000 });
              break;
            default:
              toast.error(`${file.file.name}: ${error.message}`, { duration: 5000 });
          }
        });
      });
    }

    if (files.length + acceptedFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`, { duration: 5000 });
      return;
    }

    const newFiles = acceptedFiles.map(file => {
      let preview = null;
      if (file.type.startsWith('image/')) {
        try {
          preview = URL.createObjectURL(file);
        } catch (error) {
          console.error('Error creating preview:', error);
        }
      }

      return {
        file,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        uploadProgress: 0,
        error: null
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    
    if (acceptedFiles.length > 0) {
      toast.success(`${acceptedFiles.length} file(s) added`, { duration: 3000 });
    }
  }, [files.length, toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_SIZE,
    accept: ACCEPTED_FILE_TYPES,
    noClick: true,
    noKeyboard: true
  });

  const removeFile = useCallback((fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
    toast.info('File removed', { duration: 2000 });
  }, [toast]);

  const clearAllFiles = useCallback(() => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    toast.info('All files cleared', { duration: 2000 });
  }, [files, toast]);

  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return {
    files,
    uploadProgress,
    setUploadProgress,
    getRootProps,
    getInputProps,
    isDragActive,
    open,
    removeFile,
    clearAllFiles,
    setFiles
  };
}