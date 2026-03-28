// src/app/tickets/new/components/Attachments.js

import { FiUpload, FiX,  } from 'react-icons/fi';
import { formatFileSize, getFileIcon } from '../utils';
import { MAX_FILES } from '../constants';

export default function Attachments({ 
  files, 
  uploadProgress, 
  getRootProps, 
  getInputProps, 
  isDragActive, 
  open, 
  removeFile, 
  clearAllFiles,
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        
        Attachments
      </h2>
      
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border border-dashed rounded p-4 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}`}
        onClick={open}
      >
        <input {...getInputProps()} />
        <FiUpload className={`mx-auto h-6 w-6 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
        <p className="mt-1 text-xs text-gray-600">
          {isDragActive ? 'Drop files here' : 'Drag & drop or click to select'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Max {MAX_FILES} files, 5MB each
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">
              Files ({files.length}/{MAX_FILES})
            </p>
            <button
              type="button"
              onClick={clearAllFiles}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              const progress = uploadProgress[file.id] || 0;
              
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {file.preview ? (
                      <img 
                        src={file.preview} 
                        alt={file.name}
                        className="h-8 w-8 object-cover rounded"
                      />
                    ) : (
                      <FileIcon className="h-5 w-5 text-gray-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      {progress > 0 && progress < 100 && (
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-primary-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    aria-label={`Remove ${file.name}`}
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}