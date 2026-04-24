// src/app/tickets/new/utils.js

import { FiFile, FiFileText, FiPaperclip, FiImage } from 'react-icons/fi';

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileType) => {
  if (fileType?.startsWith('image/')) return FiImage;
  if (fileType?.includes('pdf')) return FiFile;
  if (fileType?.includes('word') || fileType?.includes('document')) return FiFileText;
  if (fileType?.includes('sheet') || fileType?.includes('excel')) return FiFileText;
  return FiPaperclip;
};

