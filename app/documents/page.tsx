'use client';

import { useState, useCallback } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { saveAs } from 'file-saver';
import { convertDocument } from '../utils/documentUtils';

interface UploadedDocument {
  id: string;
  file: File;
  targetFormat: string;
  converted?: string;
  status: 'uploaded' | 'converting' | 'done' | 'error';
  errorMessage?: string;
}

const supportedFormats = [
  'pdf', 'docx', 'txt'
] as const;

type SupportedFormat = typeof supportedFormats[number];

export default function DocumentConverter() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const handleConvert = async (docId: string) => {
    const docToConvert = documents.find(d => d.id === docId);
    if (!docToConvert) return;

    setDocuments(prev =>
      prev.map(d =>
        d.id === docId
          ? { ...d, status: 'converting', errorMessage: undefined }
          : d
      )
    );

    try {
      console.log('Starting conversion:', {
        fileName: docToConvert.file.name,
        targetFormat: docToConvert.targetFormat
      });

      const convertedBlob = await convertDocument(
        docToConvert.file,
        docToConvert.targetFormat
      );

      console.log('Conversion successful:', {
        fileName: docToConvert.file.name,
        blobSize: convertedBlob.size
      });

      const convertedUrl = URL.createObjectURL(convertedBlob);

      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? { 
                ...d, 
                converted: convertedUrl, 
                status: 'done',
                errorMessage: undefined 
              }
            : d
        )
      );
    } catch (error) {
      console.error('Conversion failed:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to convert document';
        
      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? { 
                ...d, 
                status: 'error',
                errorMessage 
              }
            : d
        )
      );
    }
  };

  const handleDownload = (doc: UploadedDocument) => {
    if (!doc.converted) return;

    const filename = `${doc.file.name.split('.')[0]}.${doc.targetFormat}`;
    saveAs(doc.converted, filename);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    onDrop: (acceptedFiles: FileWithPath[]) => {
      const newDocuments = acceptedFiles.map((file: FileWithPath) => ({
        id: Math.random().toString(36).substring(7),
        file,
        targetFormat: 'pdf' as SupportedFormat,
        status: 'uploaded' as const
      }));
      setDocuments(prev => [...prev, ...newDocuments]);
    }
  });

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Document Converter
        </h1>
        <p className="text-gray-600">
          Convert between DOCX, PDF, and TXT formats
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8
          flex flex-col items-center justify-center
          transition-colors cursor-pointer
          min-h-[200px]
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="text-center space-y-4">
          <div className="text-6xl">📄</div>
          <div className="text-lg font-medium text-gray-700">
            {isDragActive
              ? "Drop your documents here..."
              : "Drag & drop documents here, or click to select"}
          </div>
          <p className="text-sm text-gray-500">
            Supports DOCX, PDF, and TXT formats
          </p>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border rounded-lg p-4 bg-white shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-gray-900 truncate flex-1">
                  {doc.file.name}
                </p>
                <select
                  value={doc.targetFormat}
                  onChange={(e) => {
                    setDocuments(prev =>
                      prev.map(d =>
                        d.id === doc.id
                          ? { ...d, targetFormat: e.target.value as SupportedFormat }
                          : d
                      )
                    );
                  }}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  disabled={doc.status === 'converting'}
                >
                  {supportedFormats.map(format => (
                    <option key={format} value={format}>
                      Convert to {format.toUpperCase()}
                    </option>
                  ))}
                </select>
                {doc.status === 'uploaded' && (
                  <button
                    onClick={() => handleConvert(doc.id)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                  >
                    Convert
                  </button>
                )}
                {doc.status === 'converting' && (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white text-sm rounded-md"
                  >
                    Converting...
                  </button>
                )}
                {doc.status === 'done' && (
                  <button
                    onClick={() => handleDownload(doc)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
                  >
                    Download
                  </button>
                )}
              </div>
              {doc.status === 'error' && doc.errorMessage && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {doc.errorMessage}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 