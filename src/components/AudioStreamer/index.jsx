// src/components/AudioRecorder.jsx
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);
  const audioChunksRef = useRef([]);
  const silenceTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection with proper options
    const socket = io('https://283d-194-87-199-27.ngrok-free.app', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket'],
        timeout: 10000
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
        console.error(`Connection error: ${err.message}`);
        setIsConnected(false);
        // Optionally show error to user
        alert('Failed to connect to server. Please try again later.');
    });

    return () => {
        socket.disconnect();
    };
  }, []);

  const startRecording = async () => {

    socketRef.current.emit('start_recording');
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const dataArray = new Uint8Array(analyser.fftSize);
    source.connect(analyser);

    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
        console.log(audioChunksRef.current.length)
        resetSilenceTimeout();
      }
    };

    mediaRecorderRef.current.onstop = () => {
      sendAudioChunks();
    };

    mediaRecorderRef.current.start(250); // Collect 250ms chunks
    setIsRecording(true);
    resetSilenceTimeout();

    const detectSilence = () => {
      analyser.getByteTimeDomainData(dataArray);
      const isSilent = dataArray.every((value) => value === 128); // 128 is the midpoint value for silence
      if (!isSilent) {
        resetSilenceTimeout();
      }
      if (isRecording) {
        requestAnimationFrame(detectSilence);
      }
    };

    detectSilence();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log("Recording stopped")
      audioChunksRef.current = [];
    }
    setIsRecording(false);
    clearTimeout(silenceTimeoutRef.current);
  };

  const resetSilenceTimeout = () => {
    clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, 2000); // Stop after 2 seconds of silence
  };

  const sendAudioChunks = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      socketRef.current.emit('audio_chunk', { audio_bytes: base64data });
    };
    reader.readAsDataURL(audioBlob);
    audioChunksRef.current = [];
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 rounded-lg shadow-md">
       <p>Socket is {isConnected ? 'connected' : 'disconnected'}</p>
      <h1 className="text-2xl font-bold mb-4">Audio Recorder</h1>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded-lg font-semibold text-white ${
          isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <div className="w-full mt-4">
        <h2 className="text-xl font-semibold mb-2">Transcribed Text:</h2>
        <p className="p-4 bg-white rounded-lg shadow-inner min-h-[100px]">
          {transcribedText || 'No transcription available.'}
        </p>
      </div>
    </div>
  );
};

export default AudioRecorder;
