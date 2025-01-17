import 'regenerator-runtime/runtime';
import React, { useState, useRef } from 'react';
import { SEND_TRANSCRIPT_URL, UPLOAD_AUDIO_URL } from '../utils/constants';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const AudioRecorder = () => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const recordingRef = useRef(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceThreshold = 10;
  const silenceDuration = 2000;
  let silenceTimeout: NodeJS.Timeout;
  const lastSilenceCheck = useRef<number>(0);
  const SILENCE_CHECK_INTERVAL = 1000; // Check silence every 1 second

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setAudioChunks((prev) => {
          const newChunks = [...prev, event.data];
          audioChunksRef.current = newChunks;
          return newChunks;
        });
      }
    };

    // Start recording with a small timeslice to get frequent chunks
    recorder.start(100); // Get data every 100ms
    recordingRef.current = true;

    // Create an AudioContext for analyzing audio levels
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    analyser.fftSize = 2048;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Monitor audio levels
    const checkSilence = () => {
      if (recordingRef.current) {
        const now = Date.now();
        analyser.getByteFrequencyData(dataArray);
        const averageVolume = dataArray.reduce((sum, value) => sum + value) / dataArray.length;

        // Only check silence every SILENCE_CHECK_INTERVAL
        if (now - lastSilenceCheck.current >= SILENCE_CHECK_INTERVAL) {
          lastSilenceCheck.current = now;
          
          if (averageVolume < silenceThreshold) {
            console.log("Silence detected:", averageVolume);
            silenceTimeout = setTimeout(async () => {
              console.log("Duration.");
              if (audioChunksRef.current.length > 0) {
                console.log("Detected audio chunks")
                const audioBlob = new Blob(audioChunksRef.current);
                audioChunksRef.current = [];
                setAudioChunks([]);
                await uploadAudio(audioBlob);
              }
            }, silenceDuration);
          } else {
            clearTimeout(silenceTimeout);
          }
        }

        requestAnimationFrame(checkSilence);
      }
    };

    checkSilence();
  };

  const stopRecording = async () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      recordingRef.current = false;
      clearTimeout(silenceTimeout);
      
      // Upload any remaining audio chunks
      if (audioChunks.length > 0) {
        await uploadAudio(new Blob(audioChunks));
        setAudioChunks([]);
      }

      // Clean up stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const uploadAudio = async (audioBlob) => {
    console.log("Sending...")
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      await fetch(UPLOAD_AUDIO_URL, {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  return (
    <div>
      <button onClick={recordingRef.current ? stopRecording : startRecording}>
        {recordingRef.current ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
};

export default AudioRecorder;
