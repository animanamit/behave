import { useRecordWebcam } from 'react-record-webcam';
import { useState, useCallback, useEffect } from 'react';

type RecordingState = 
  | 'idle' 
  | 'camera_ready' 
  | 'countdown' 
  | 'recording' 
  | 'review' 
  | 'saving';

export function useVideoRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  
  const hook = useRecordWebcam({
    options: { 
      fileName: 'practice-recording',
      fileType: 'webm',
    },
    mediaRecorderOptions: {
      mimeType: 'video/webm;codecs=vp8',
    },
  });

  const {
    createRecording,
    openCamera,
    startRecording,
    stopRecording,
    closeCamera,
    clearError,
    errorMessage,
    activeRecordings,
  } = hook;

  const recording = activeRecordings[0];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordingState === 'recording') {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timeout = setTimeout(() => {
        setCountdown(prev => (prev || 0) - 1);
      }, 1000);
      return () => clearTimeout(timeout);
    }
    return;
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && recording) {
      startRecording(recording.id);
      setRecordingState('recording');
      setCountdown(null);
    }
  }, [countdown, recording, startRecording]);

  const handleStartCamera = useCallback(async () => {
    const newRecording = await createRecording();
    if (newRecording && 'id' in newRecording) {
      await openCamera(newRecording.id);
      setRecordingState('camera_ready');
    }
  }, [createRecording, openCamera]);

  const handleCloseCamera = useCallback(async () => {
    if (recording) {
      await closeCamera(recording.id);
    }
  }, [closeCamera, recording]);

  const handleStartRecording = useCallback(() => {
    setCountdown(3);
    setTimer(0);
    setRecordingState('countdown');
  }, []);

  const handleStopRecording = useCallback(async () => {
    if (!recording) {
      console.error('[useVideoRecorder] No recording to stop');
      return;
    }
    console.log('[useVideoRecorder] Stopping recording:', recording.id);
    const result = await stopRecording(recording.id);
    console.log('[useVideoRecorder] Recording stopped, result:', result);
    if (result && 'blob' in result && result.blob) {
      setRecordedBlob(result.blob);
      setRecordedUrl(result.objectURL || null);
      setRecordingState('review');
      await closeCamera(recording.id);
    } else {
      console.error('[useVideoRecorder] Failed to stop recording:', result);
    }
  }, [stopRecording, recording, closeCamera]);

  const handleReRecord = useCallback(async () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setTimer(0);
    await handleStartCamera();
  }, [handleStartCamera]);

  const handleDiscard = useCallback(async () => {
    if (recording) {
      await closeCamera(recording.id);
    }
    setRecordingState('idle');
    setRecordedBlob(null);
    setRecordedUrl(null);
    setTimer(0);
  }, [closeCamera, recording]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  return {
    recordingState,
    timer,
    countdown,
    recordedBlob,
    recordedUrl,
    errorMessage,
    webcamRef: recording?.webcamRef,
    previewRef: recording?.previewRef,
    handleStartCamera,
    handleStartRecording,
    handleStopRecording,
    handleReRecord,
    handleDiscard,
    clearError,
    formatTime,
    isCameraReady: recordingState === 'camera_ready',
    isRecording: recordingState === 'recording',
    isReview: recordingState === 'review',
    isSaving: recordingState === 'saving',
  };
}
