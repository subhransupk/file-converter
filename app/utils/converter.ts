'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

class FFmpegManager {
  private static instance: FFmpegManager;
  private ffmpeg: FFmpeg;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | undefined;
  private activeFiles: Set<string> = new Set();

  private constructor() {
    this.ffmpeg = new FFmpeg();
  }

  public static getInstance(): FFmpegManager {
    if (!FFmpegManager.instance) {
      FFmpegManager.instance = new FFmpegManager();
    }
    return FFmpegManager.instance;
  }

  public async load(): Promise<void> {
    if (this.isLoaded) return;
    
    if (!this.loadPromise) {
      this.loadPromise = this.ffmpeg.load({
        coreURL: '/ffmpeg-core.js',
        wasmURL: '/ffmpeg-core.wasm',
      }).then(() => {
        this.isLoaded = true;
      });
    }
    
    return this.loadPromise;
  }

  public async cleanup(): Promise<void> {
    if (this.isLoaded) {
      try {
        // Clean up tracked files
        for (const file of this.activeFiles) {
          try {
            await this.ffmpeg.deleteFile(file);
          } catch (e) {
            console.warn(`Error removing file ${file}:`, e);
          }
        }
        this.activeFiles.clear();
      } catch (e) {
        console.warn('Error cleaning up files:', e);
      }

      try {
        await this.ffmpeg.terminate();
      } catch (e) {
        console.warn('Error terminating FFmpeg:', e);
      }

      this.isLoaded = false;
      this.loadPromise = undefined;
    }
  }

  public getFFmpeg(): FFmpeg {
    if (!this.isLoaded) {
      throw new Error('FFmpeg not loaded. Call load() first.');
    }
    return this.ffmpeg;
  }

  public trackFile(filename: string): void {
    this.activeFiles.add(filename);
  }

  public untrackFile(filename: string): void {
    this.activeFiles.delete(filename);
  }
}

export async function convertImage(
  file: File,
  outputFormat: string
): Promise<Blob> {
  const manager = FFmpegManager.getInstance();
  await manager.load();
  
  const ffmpeg = manager.getFFmpeg();
  const inputFileName = 'input' + getFileExtension(file.name);
  const outputFileName = 'output.' + outputFormat.toLowerCase();

  try {
    // Write the file to FFmpeg's virtual filesystem
    const inputData = await fetchFile(file);
    await ffmpeg.writeFile(inputFileName, inputData);
    manager.trackFile(inputFileName);

    // Run the conversion
    await ffmpeg.exec([
      '-i', inputFileName,
      outputFileName
    ]);
    manager.trackFile(outputFileName);

    // Read the result
    const data = await ffmpeg.readFile(outputFileName);
    
    // Clean up files from virtual filesystem
    try {
      await ffmpeg.deleteFile(inputFileName);
      manager.untrackFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
      manager.untrackFile(outputFileName);
    } catch (e) {
      console.warn('Error cleaning up temporary files:', e);
    }

    return new Blob([data], { type: `image/${outputFormat.toLowerCase()}` });
  } catch (error) {
    console.error('Error during conversion:', error);
    throw error;
  }
}

export async function cleanup(): Promise<void> {
  await FFmpegManager.getInstance().cleanup();
}

function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
} 