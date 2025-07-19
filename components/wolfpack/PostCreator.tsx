'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { uploadImage, uploadVideo, generateVideoThumbnail } from '@/lib/storage/uploadHelpers';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';
import { X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PostCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostCreator({ isOpen, onClose }: PostCreatorProps) {
  const { user } = useConsistentAuth();
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(15); // Default to 15s
  const [mediaMode, setMediaMode] = useState<'camera' | 'gallery'>('camera');
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-start camera disabled to allow manual activation
  useEffect(() => {
    // Cleanup on close
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      console.log('Starting camera activation...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Please ensure you are using HTTPS.');
      }

      // Check if we're in a secure context
      if (!window.isSecureContext) {
        throw new Error('Camera requires a secure context (HTTPS)');
      }

      // For iOS PWAs, try with simplified constraints first
      const isIOSPWA = window.navigator.standalone || 
                       (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
      
      let constraints = {
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      // Simplify constraints for iOS PWAs to improve compatibility
      if (isIOSPWA) {
        constraints = {
          video: { facingMode: 'user' },
          audio: false // Some iOS PWAs have issues with audio permissions
        };
      }

      console.log('Requesting camera access with constraints:', constraints);
      console.log('Browser:', navigator.userAgent);
      console.log('Is iOS PWA:', isIOSPWA);
      console.log('Is secure context:', window.isSecureContext);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video metadata to load
        await new Promise((resolve, reject) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
            videoRef.current.onerror = reject;
          }
        });
        
        // Attempt to play the video
        await videoRef.current.play();
        setCameraActive(true);
        console.log('Camera activated successfully');
        
        toast({
          title: 'Camera activated',
          description: 'Ready to record',
        });
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Failed to access camera';
      let errorDescription = 'Please check your camera permissions';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access denied';
        errorDescription = 'Please allow camera access in your browser settings. For iOS, you may need to enable camera in Safari settings > Website Settings';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found';
        errorDescription = 'Please ensure your device has a camera connected';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is busy';
        errorDescription = 'Camera might be used by another application. Please close other apps and try again';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera requirements not met';
        errorDescription = 'Trying with basic camera settings...';
        
        // Retry with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            streamRef.current = basicStream;
            await videoRef.current.play();
            setCameraActive(true);
            toast({
              title: 'Camera activated',
              description: 'Using basic camera settings',
            });
            return;
          }
        } catch (retryError) {
          console.error('Basic camera retry failed:', retryError);
        }
      } else if (error.message?.includes('https')) {
        errorMessage = 'Secure connection required';
        errorDescription = 'Camera access requires HTTPS. Please use a secure connection';
      }
      
      toast({
        title: errorMessage,
        description: errorDescription,
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current);
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], 'recorded-video.webm', { type: 'video/webm' });
      
      // Convert to supported format or use as-is
      setSelectedFile(file);
      const url = URL.createObjectURL(blob);
      setPreview(url);
      
      // Stop recording UI
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);

    // Start recording timer
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        if (newTime >= selectedDuration) {
          stopRecording();
          return selectedDuration;
        }
        return newTime;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        const url = URL.createObjectURL(blob);
        setPreview(url);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 100MB for videos, 10MB for images)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `Maximum size is ${isVideo ? '100MB' : '10MB'}`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setMediaMode('gallery');
  };

  const handlePost = async () => {
    if (!selectedFile || !user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to upload content',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const isVideo = selectedFile.type.startsWith('video/');

      if (isVideo) {
        // Upload video
        const mediaUrl = await uploadVideo(selectedFile, (progress) => {
          setUploadProgress(progress * 0.7); // 70% for video
        });

        // Generate and upload thumbnail
        let thumbnailUrl: string | null = null;
        try {
          const thumbnailFile = await generateVideoThumbnail(selectedFile);
          thumbnailUrl = await uploadImage(thumbnailFile, 'wolfpack-thumbnails');
          setUploadProgress(85);
        } catch (error) {
          console.warn('Failed to generate thumbnail:', error);
          // Continue without thumbnail
        }

        // Create video post in wolfpack_videos table (using backend schema column names)
        const { error: postError } = await supabase
          .from('wolfpack_videos')
          .insert({
            user_id: user.id,
            title: caption.substring(0, 100), // Use first 100 chars as title
            caption: caption, // Full caption text (existing column)
            description: caption, // Also store as description for compatibility
            video_url: mediaUrl,
            thumbnail_url: thumbnailUrl,
            duration: null, // Use duration (backend added this)
            view_count: 0, // Use view_count (backend added this)
            like_count: 0, // Use like_count (backend added this)
            is_featured: false,
            is_active: true
          });

        if (postError) {
          console.error('Error creating video post:', postError);
          throw new Error(`Failed to create video post: ${postError.message}`);
        }

        setUploadProgress(100);
        
        toast({
          title: 'Video posted!',
          description: 'Your video has been shared with the wolfpack.',
        });

      } else {
        // Upload image
        const mediaUrl = await uploadImage(selectedFile, 'wolfpack-images');
        setUploadProgress(80);

        // For images, we'll also use the wolfpack_videos table but with null video_url
        // This keeps all posts in one place for the feed (using backend schema column names)
        const { error: postError } = await supabase
          .from('wolfpack_videos')
          .insert({
            user_id: user.id,
            title: caption.substring(0, 100),
            caption: caption, // Full caption text (existing column)
            description: caption, // Also store as description for compatibility
            video_url: null, // No video for image posts
            thumbnail_url: mediaUrl, // Use image as thumbnail
            duration: null, // Use duration (backend added this)
            view_count: 0, // Use view_count (backend added this)
            like_count: 0, // Use like_count (backend added this)
            is_featured: false,
            is_active: true
          });

        if (postError) {
          console.error('Error creating image post:', postError);
          throw new Error(`Failed to create image post: ${postError.message}`);
        }

        setUploadProgress(100);
        
        toast({
          title: 'Image posted!',
          description: 'Your image has been shared with the wolfpack.',
        });
      }

      // Success! Reset form
      setCaption('');
      setSelectedFile(null);
      setPreview(null);
      onClose();

    } catch (error) {
      console.error('Error creating post:', error);
      
      // Check for specific RLS policy errors
      let errorMessage = 'Failed to create post';
      if (error instanceof Error) {
        if (error.message.includes('row-level security policy')) {
          errorMessage = 'Authentication error. Please log out and log back in.';
        } else if (error.message.includes('User not authenticated')) {
          errorMessage = 'Please log in to upload content';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing during upload
    setCaption('');
    setSelectedFile(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* TikTok-style Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <button
          onClick={handleClose}
          disabled={loading}
          className="text-white hover:text-gray-300 disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full">
          <span className="text-white font-medium">Add sound</span>
        </div>
        <div className="w-6 h-6" /> {/* Spacer */}
      </div>

      {/* Main Content Area */}
      <div className="h-full flex flex-col">
        {/* Camera/Preview Area */}
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
          {/* Live Camera Feed */}
          {mediaMode === 'camera' && cameraActive && !preview && (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Recording Timer */}
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="font-mono text-sm">
                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              
              {/* Recording Progress Bar */}
              {isRecording && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
                  <div 
                    className="h-full bg-red-500 transition-all duration-1000"
                    style={{ width: `${(recordingTime / selectedDuration) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Preview Mode */}
          {preview && (
            <div className="relative w-full h-full">
              {selectedFile?.type.startsWith('video/') ? (
                <video 
                  src={preview} 
                  controls 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}
          
          {/* Default State */}
          {!cameraActive && !preview && mediaMode === 'camera' && (
            <button
              onClick={startCamera}
              className="text-center text-gray-400 hover:text-gray-300 transition-colors p-8"
            >
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-lg">Tap to activate camera</p>
            </button>
          )}
          
          {/* Gallery Mode Default State */}
          {!preview && mediaMode === 'gallery' && (
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg">Select from gallery</p>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="bg-black p-4 space-y-4">
          {/* Recording Duration Selector */}
          <div className="flex items-center justify-center space-x-6">
            {[3, 6, 9, 15, 30, 60].map((duration) => (
              <button
                key={duration}
                onClick={() => setSelectedDuration(duration)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedDuration === duration
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                {duration}s
              </button>
            ))}
            <button
              onClick={() => setSelectedDuration(0)}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedDuration === 0
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              PHOTO
            </button>
          </div>

          {/* Camera Controls */}
          <div className="flex items-center justify-between">
            {/* Mode Switch */}
            <div className="flex space-x-2">
              <button
                onClick={() => setMediaMode('camera')}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  mediaMode === 'camera' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setMediaMode('gallery')}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  mediaMode === 'gallery' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            {/* Main Action Button */}
            <button
              onClick={() => {
                if (mediaMode === 'camera') {
                  if (selectedDuration === 0) {
                    takePhoto();
                  } else if (isRecording) {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                } else {
                  document.getElementById('media-upload')?.click();
                }
              }}
              disabled={loading || (mediaMode === 'camera' && !cameraActive)}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {mediaMode === 'camera' ? (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isRecording ? 'bg-white' : 'bg-red-500'
                }`}>
                  {isRecording ? (
                    <div className="w-6 h-6 bg-red-500 rounded-sm"></div>
                  ) : selectedDuration === 0 ? (
                    <div className="w-12 h-12 bg-white rounded-full border-4 border-gray-300"></div>
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                  )}
                </div>
              ) : (
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>

            {/* Gallery Button */}
            <button
              onClick={() => document.getElementById('media-upload')?.click()}
              className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Caption Input */}
          {selectedFile && (
            <div className="space-y-2">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 
                           resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 
                           focus:border-transparent"
                rows={2}
                disabled={loading}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-center">
                {caption.length}/500 characters
              </p>
            </div>
          )}

          {/* Progress Bar */}
          {loading && uploadProgress > 0 && (
            <div>
              <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm mt-2 text-center">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {/* Post/Create Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handlePost}
              disabled={loading || !selectedFile || !caption.trim()}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold
                         disabled:bg-gray-700 disabled:cursor-not-allowed
                         hover:bg-purple-700 transition-colors duration-200"
            >
              {loading ? 'POSTING...' : 'POST'}
            </button>
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold
                         hover:bg-gray-600 transition-colors duration-200"
            >
              CREATE
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        id="media-upload"
        type="file"
        accept="image/*,video/mp4,video/mov,video/avi,video/wmv,video/flv,video/mkv"
        onChange={handleFileSelect}
        className="hidden"
        disabled={loading}
      />
      
      {/* Hidden Canvas for Photo Capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
}