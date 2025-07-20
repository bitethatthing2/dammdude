'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Video, Upload, RotateCcw, Clock, Zap, Send, Type } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface PostCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostCreator({ isOpen, onClose }: PostCreatorProps) {
  const { user } = useAuth();
  const [hasStream, setHasStream] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingMode, setRecordingMode] = useState<'photo' | 'video'>('video');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [maxDuration, setMaxDuration] = useState(60); // 60 seconds default
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [recordingProgress, setRecordingProgress] = useState(0);
  
  // Post creation states
  const [capturedMedia, setCapturedMedia] = useState<Blob | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [posting, setPosting] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    
    // If we already have a stream, apply it immediately
    if (element && streamRef.current) {
      console.log('🎥 Applying existing stream to video element');
      element.srcObject = streamRef.current;
      setHasStream(true);
      setCameraStatus('ready');
    }
  }, []);

  useEffect(() => {
    if (isOpen && !streamRef.current) {
      console.log('Opening camera...');
      startCamera();
    } else if (!isOpen) {
      console.log('Closing camera...');
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      console.log('=== STARTING CAMERA ===');
      setCameraStatus('loading');
      setErrorMessage('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true
      });
      
      console.log('✅ Got camera stream:', stream);
      streamRef.current = stream;
      
      // Apply stream to video element if it exists
      if (videoRef.current) {
        console.log('✅ Video element ready, setting srcObject');
        videoRef.current.srcObject = stream;
        setHasStream(true);
        setCameraStatus('ready');
        console.log('✅ Camera setup complete!');
      } else {
        console.log('⚠️ Video element not ready yet, will be applied when mounted');
        setHasStream(true);
        setCameraStatus('ready');
      }
    } catch (error) {
      console.error('❌ Camera failed:', error);
      setHasStream(false);
      setCameraStatus('error');
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            setErrorMessage('Camera access denied. Please enable camera permissions in your browser settings.');
            break;
          case 'NotFoundError':
            setErrorMessage('No camera found. Please ensure your camera is connected and enabled.');
            break;
          case 'NotReadableError':
            setErrorMessage('Camera is in use by another application. Please close other apps using the camera.');
            break;
          case 'OverconstrainedError':
            setErrorMessage('Camera constraints could not be satisfied. Try adjusting video settings.');
            break;
          default:
            setErrorMessage(`Camera error: ${error.message}`);
        }
      } else {
        setErrorMessage('An unexpected error occurred while starting camera.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setHasStream(false);
    setIsRecording(false);
    setRecordingTime(0);
    setRecordingProgress(0);
    setCameraStatus('idle');
    setErrorMessage('');
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    console.log('Starting recording...');
    
    // Try to use a supported MIME type for video recording
    let options: MediaRecorderOptions = {};
    const supportedTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8', 
      'video/webm',
      'video/mp4'
    ];
    
    for (const mimeType of supportedTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options.mimeType = mimeType;
        console.log('🎥 Using MIME type:', mimeType);
        break;
      }
    }
    
    const mediaRecorder = new MediaRecorder(streamRef.current, options);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    
    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        setRecordingProgress((newTime / maxDuration) * 100);
        
        // Auto-stop when max duration reached
        if (newTime >= maxDuration) {
          stopRecording();
        }
        
        return newTime;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setCapturedMedia(event.data);
          setMediaUrl(URL.createObjectURL(event.data));
          setShowCaptionInput(true);
        }
      };
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingProgress(0);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Stop current stream and restart with new facing mode
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setCameraStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasStream(true);
        setCameraStatus('ready');
      }
    } catch (error) {
      console.error('Camera switch failed:', error);
      setCameraStatus('error');
      setErrorMessage('Failed to switch camera');
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        console.log('Files selected:', files);
        // Handle file upload logic here
      }
    };
    
    input.click();
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedMedia(blob);
          setMediaUrl(URL.createObjectURL(blob));
          setShowCaptionInput(true);
          console.log('Photo taken');
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleMainAction = () => {
    if (recordingMode === 'photo') {
      takePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  const uploadToSupabase = async (file: Blob, fileName: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Debug blob info
    console.log('🎬 UPLOADING BLOB:', {
      type: file.type,
      size: file.size,
      fileName,
      recordingMode
    });

    // TEMPORARY: Use simple upload path like before while debugging
    console.log('⚡ Using simple upload (bypassing validation for now)');
    const simplePath = `${user.id}/${Date.now()}-${fileName}`;
    
    try {
      // Upload directly to simple path
      const { data, error } = await supabase.storage
        .from('wolfpack-media')
        .upload(simplePath, file);
      
      if (error) {
        console.error('Storage error:', error);
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('wolfpack-media')
        .getPublicUrl(data.path);
        
      console.log('✅ Upload successful:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.log('❌ Simple upload failed, trying with validation...');
      
      // Handle missing or invalid MIME type for video recordings
      let actualMimeType = file.type;
      if ((recordingMode === 'video' || fileName.includes('video')) && (!file.type || !file.type.startsWith('video/'))) {
        // Default to webm if no type is set for video recordings
        actualMimeType = 'video/webm';
        console.log('🔧 Corrected MIME type from', file.type, 'to:', actualMimeType);
      }

      // Determine file type
      const fileType = actualMimeType.startsWith('video/') ? 'video' : 'image';
      
      // Try validation approach
      const { data: validation, error: validationError } = await supabase.rpc('validate_file_upload', {
        p_user_id: user.id,
        p_file_type: fileType,
        p_file_size: file.size,
        p_mime_type: actualMimeType
      });

      if (validationError) {
        throw new Error(`Validation failed: ${validationError.message}`);
      }

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate proper storage path
      const { data: storagePath, error: pathError } = await supabase.rpc('generate_storage_path', {
        p_user_id: user.id,
        p_file_type: fileType,
        p_filename: fileName
      });

      if (pathError) {
        throw new Error(`Path generation failed: ${pathError.message}`);
      }

      // Upload to the generated path
      const { data: validatedData, error: validatedError } = await supabase.storage
        .from('wolfpack-media')
        .upload(storagePath, file);
      
      if (validatedError) throw validatedError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('wolfpack-media')
        .getPublicUrl(validatedData.path);
        
      return publicUrl;
    }
  };

  const handlePost = async () => {
    if (!user || !capturedMedia) {
      toast({
        title: 'Error',
        description: 'No media captured or user not authenticated',
        variant: 'destructive'
      });
      return;
    }

    try {
      setPosting(true);

      // Upload media to Supabase storage
      const fileName = recordingMode === 'photo' ? 'photo.jpg' : 'video.mp4';
      const mediaUrl = await uploadToSupabase(capturedMedia, fileName);

      // Create post in database
      const { data: postData, error: postError } = await supabase
        .from('wolfpack_videos')
        .insert({
          user_id: user.id,
          caption: caption.trim() || 'New post from Wolf Pack!',
          video_url: recordingMode === 'video' ? mediaUrl : null,
          thumbnail_url: recordingMode === 'photo' ? mediaUrl : null,
          duration: recordingMode === 'video' ? recordingTime : null,
          view_count: 0,
          like_count: 0,
          comments_count: 0
        })
        .select()
        .single();

      if (postError) throw postError;

      toast({
        title: 'Post created!',
        description: 'Your post has been shared to the Wolf Pack feed'
      });

      // Reset state and close
      resetState();
      onClose();

    } catch (error) {
      console.error('Error creating post:', error);
      
      // Show specific error message if available
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post. Please try again.';
      
      toast({
        title: 'Post failed',
        description: errorMessage.includes('quota') 
          ? 'Storage quota exceeded. Please delete some files or upgrade your plan.'
          : errorMessage.includes('File too large')
          ? 'File is too large. Please try a smaller file.'
          : errorMessage.includes('Invalid file type')
          ? 'Invalid file type. Please upload a supported video or image format.'
          : errorMessage,
        variant: 'destructive'
      });
    } finally {
      setPosting(false);
    }
  };

  const resetState = () => {
    setCapturedMedia(null);
    setMediaUrl('');
    setCaption('');
    setShowCaptionInput(false);
    setRecordingTime(0);
    setRecordingProgress(0);
  };

  const handleRetake = () => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    resetState();
  };

  if (!isOpen) return null;

  console.log('🎬 RENDER STATE:', {
    isOpen,
    hasStream,
    videoRefExists: !!videoRef.current,
    streamRefExists: !!streamRef.current
  });

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Full-screen camera view */}
      <div className="relative w-full h-full">
        {/* Camera View */}
        {hasStream ? (
          <video
            ref={setVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white bg-gray-900">
            <div className="text-center space-y-4 max-w-sm mx-auto">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              
              {cameraStatus === 'loading' && (
                <>
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                  <p>Starting camera...</p>
                </>
              )}
              
              {cameraStatus === 'error' && (
                <>
                  <p className="text-red-400 font-medium">Camera Error</p>
                  <p className="text-sm text-gray-300">{errorMessage}</p>
                </>
              )}
              
              {cameraStatus === 'idle' && (
                <p>Camera not ready</p>
              )}
              
              <button 
                onClick={startCamera}
                disabled={cameraStatus === 'loading'}
                className="bg-pink-500 px-6 py-3 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {cameraStatus === 'loading' ? 'Starting...' : 'Start Camera'}
              </button>
            </div>
          </div>
        )}
        
        {/* Top overlay */}
        <div className="absolute top-0 left-0 right-0 z-10">
          {/* Close button and duration selector */}
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Duration options */}
            <div className="flex gap-2">
              {[15, 60, 180].map((duration) => (
                <button
                  key={duration}
                  onClick={() => setMaxDuration(duration)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    maxDuration === duration 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-black/30 text-white'
                  }`}
                >
                  {duration < 60 ? `${duration}s` : `${duration/60}m`}
                </button>
              ))}
            </div>
            
            <button 
              onClick={switchCamera}
              disabled={!hasStream}
              className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          
          {/* Recording progress bar */}
          {isRecording && (
            <div className="px-4">
              <div className="w-full h-1 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 transition-all duration-100 ease-linear"
                  style={{ width: `${recordingProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Recording timer */}
          {isRecording && (
            <div className="absolute top-16 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-mono text-sm">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
        
        {/* Side controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-4">
          {/* Upload from gallery */}
          <button
            onClick={handleUpload}
            className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white"
          >
            <Upload className="w-6 h-6" />
          </button>
          
          {/* Speed control */}
          <button
            onClick={() => {
              const speeds = [0.5, 1, 1.5, 2];
              const currentIndex = speeds.indexOf(playbackSpeed);
              const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
              setPlaybackSpeed(nextSpeed);
            }}
            className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white"
          >
            <div className="text-xs font-bold">{playbackSpeed}x</div>
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
          {showCaptionInput ? (
            /* Caption input and post controls */
            <div className="px-4 space-y-4">
              {/* Preview thumbnail */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/20">
                  {recordingMode === 'photo' ? (
                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={mediaUrl} className="w-full h-full object-cover" muted />
                  )}
                </div>
              </div>

              {/* Caption input */}
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Type className="w-5 h-5 text-white mt-3" />
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="What's happening in the Wolf Pack?"
                    className="flex-1 bg-transparent text-white placeholder-white/70 resize-none border-none outline-none text-sm"
                    rows={3}
                    maxLength={300}
                  />
                </div>
                <div className="text-right text-white/50 text-xs mt-2">
                  {caption.length}/300
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRetake}
                  disabled={posting}
                  className="flex-1 bg-black/30 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  Retake
                </button>
                <button
                  onClick={handlePost}
                  disabled={posting}
                  className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {posting ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Post
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode selector */}
              <div className="flex justify-center mb-6">
                <div className="flex bg-black/30 rounded-full p-1">
                  <button
                    onClick={() => setRecordingMode('photo')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      recordingMode === 'photo' 
                        ? 'bg-white text-black' 
                        : 'text-white'
                    }`}
                  >
                    Photo
                  </button>
                  <button
                    onClick={() => setRecordingMode('video')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      recordingMode === 'video' 
                        ? 'bg-white text-black' 
                        : 'text-white'
                    }`}
                  >
                    Video
                  </button>
                </div>
              </div>

              {/* Main record button */}
              <div className="flex justify-center">
                <div className="relative">
                  {/* Outer ring for recording state */}
                  <div className={`w-20 h-20 rounded-full border-4 transition-all duration-300 ${
                    isRecording 
                      ? 'border-red-500 scale-110' 
                      : 'border-white/50'
                  }`}>
                    {/* Inner button */}
                    <button
                      onClick={handleMainAction}
                      disabled={!hasStream}
                      className={`w-full h-full rounded-full transition-all duration-200 ${
                        recordingMode === 'photo'
                          ? 'bg-white disabled:bg-gray-400'
                          : isRecording
                            ? 'bg-red-500 scale-75'
                            : 'bg-pink-500 disabled:bg-gray-400'
                      } disabled:opacity-50 flex items-center justify-center`}
                    >
                      {recordingMode === 'photo' ? (
                        <Camera className="w-8 h-8 text-black" />
                      ) : isRecording ? (
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                      ) : (
                        <div className="w-6 h-6 bg-white rounded-full"></div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}