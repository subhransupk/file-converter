'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import Image from 'next/image';
import { saveAs } from 'file-saver';
import { convertImage, cleanup } from './utils/converter';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  targetFormat: string;
  converted?: string;
  status: 'uploaded' | 'converting' | 'done' | 'error';
  errorMessage?: string;
}

const supportedFormats = [
  'bmp', 'eps', 'gif', 'ico', 'jpeg', 'jpg', 
  'odd', 'png', 'psd', 'svg', 'tga', 'tiff', 'webp'
] as const;

type SupportedFormat = typeof supportedFormats[number];

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const cleanupResources = useCallback(async () => {
    files.forEach(file => {
      if (file.preview) {
        try {
          URL.revokeObjectURL(file.preview);
        } catch (e) {
          console.warn('Error revoking preview URL:', e);
        }
      }
      if (file.converted) {
        try {
          URL.revokeObjectURL(file.converted);
        } catch (e) {
          console.warn('Error revoking converted URL:', e);
        }
      }
    });

    try {
      await cleanup();
    } catch (e) {
      console.warn('Error during FFmpeg cleanup:', e);
    }
  }, [files]);

  useEffect(() => {
    return () => {
      cleanupResources().catch(e => {
        console.warn('Error during cleanup:', e);
      });
    };
  }, [cleanupResources]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': []
    },
    onDrop: (acceptedFiles: FileWithPath[]) => {
      const newFiles = acceptedFiles.map((file: FileWithPath) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        targetFormat: 'png' as SupportedFormat,
        status: 'uploaded' as const
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  });

  const handleConvert = async (fileId: string) => {
    const fileToConvert = files.find(f => f.id === fileId);
    if (!fileToConvert) return;

    setFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? { ...f, status: 'converting', errorMessage: undefined }
          : f
      )
    );

    try {
      const convertedBlob = await convertImage(
        fileToConvert.file,
        fileToConvert.targetFormat
      );

      const convertedUrl = URL.createObjectURL(convertedBlob);

      setFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { 
                ...f, 
                converted: convertedUrl, 
                status: 'done',
                errorMessage: undefined 
              }
            : f
        )
      );
    } catch (error) {
      console.error('Conversion failed:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to convert image';
        
      setFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { 
                ...f, 
                status: 'error',
                errorMessage 
              }
            : f
        )
      );
    }
  };

  const handleDownload = (file: UploadedFile) => {
    if (!file.converted) return;

    const filename = `${file.file.name.split('.')[0]}.${file.targetFormat}`;
    saveAs(file.converted, filename);
  };

  const handleDownloadAll = () => {
    files.forEach(file => {
      if (file.status === 'done' && file.converted) {
        const filename = `${file.file.name.split('.')[0]}.${file.targetFormat}`;
        saveAs(file.converted, filename);
      }
    });
  };

  return (
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Image Converter
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto px-4">
          Convert your images to any format instantly. Support for BMP, EPS, GIF, ICO, 
          JPEG, JPG, ODD, PNG, PSD, SVG, TGA, TIFF, WEBP.
        </p>
      </div>

      {/* Upload Section */}
      <div
        {...getRootProps()}
        className={`
          mx-4 border-2 border-dashed rounded-xl p-8
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
          <div className="text-6xl">🖼️</div>
          <div className="text-lg font-medium text-gray-700">
            {isDragActive
              ? "Drop your images here..."
              : "Drag & drop images here, or click to select"}
          </div>
          <p className="text-sm text-gray-500">
            Supports multiple images upload
          </p>
        </div>
      </div>

      {/* Middle Ad Space */}
      {files.length > 0 && (
        <div className="w-full bg-gray-50 p-4 flex justify-center">
          <div className="w-full max-w-[728px] h-[90px] bg-gray-100 flex items-center justify-center text-sm text-gray-400">
            Ad Space
          </div>
        </div>
      )}

      {/* Images Preview Section */}
      {files.length > 0 && (
        <div className="space-y-6 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Uploaded Images
            </h2>
            <button
              onClick={handleDownloadAll}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Download All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="border rounded-lg p-4 space-y-4 bg-white shadow-sm"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={file.converted || file.preview}
                    alt={file.file.name}
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-gray-900 truncate">
                    {file.file.name}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={file.targetFormat}
                      onChange={(e) => {
                        setFiles(prev =>
                          prev.map(f =>
                            f.id === file.id
                              ? { ...f, targetFormat: e.target.value }
                              : f
                          )
                        );
                      }}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      disabled={file.status === 'converting'}
                    >
                      {supportedFormats.map(format => (
                        <option key={format} value={format}>
                          Convert to {format.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    {file.status === 'uploaded' && (
                      <button
                        onClick={() => handleConvert(file.id)}
                        className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                      >
                        Convert
                      </button>
                    )}
                    {file.status === 'converting' && (
                      <button
                        disabled
                        className="w-full sm:w-auto px-3 py-1.5 bg-gray-400 text-white text-sm rounded-md"
                      >
                        Converting...
                      </button>
                    )}
                    {file.status === 'done' && (
                      <button
                        onClick={() => handleDownload(file)}
                        className="w-full sm:w-auto px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
                      >
                        Download
                      </button>
                    )}
                    {file.status === 'error' && (
                      <div className="space-y-2">
                        {file.errorMessage && (
                          <p className="text-sm text-red-600">
                            {file.errorMessage}
                          </p>
                        )}
                        <button
                          onClick={() => handleConvert(file.id)}
                          className="w-full sm:w-auto px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
