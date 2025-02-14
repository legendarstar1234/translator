import 'regenerator-runtime/runtime';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_AUDIO_URL, UPLOAD_VIDEO_URL } from '../utils/constants';
import LoadingSpinner from '../LoadingSpinner';

const Dictaphone = () => {
    const [uuid, setUuid] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [listening, setListening] = useState(false);
    const [audioUrl, setAudioUrl] = useState('');
    const [audioBlob, setAudioBlob] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [videoFile, setVideoFile] = useState(null);
    const [transcript, setTranscript] = useState('');
    // const [isClone, setIsClone] = useState(false);

    const handleStart = async () => {
        if (listening || isLoading) return;
        setIsSaved(false);
        setAudioChunks([]);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
            setAudioChunks((prev) => [...prev, event.data]);
        };

        recorder.start(250);  
        setMediaRecorder(recorder); 
        setIsSaved(false);
        setListening(true);
    };

    // Function to handle stopping and sending transcript
    const handleStopAndSend = async () => {
      // SpeechRecognition.stopListening();
      if(!mediaRecorder){
        console.log('Audio is not working now');
        return;
      }
      const recordingFinished = new Promise(resolve => {
          mediaRecorder.onstop = () => resolve();
      });

      mediaRecorder.stop();
      
      // Wait for the final data
      await recordingFinished;

      // Now create the blob after we have all chunks
      const audioBlob = new Blob(audioChunks, { 
          type: 'audio/webm; codecs=opus'  
      });
    
    setAudioBlob(audioBlob);
    console.log(audioBlob)
    
    const audioUrl = URL.createObjectURL(audioBlob);
    const audioElement = document.getElementById('audio-element');
    if (audioElement) {
        audioElement.src = audioUrl;
        setAudioUrl(audioUrl);
        console.log(audioUrl)
        setListening(false);
        
        // Play only after ensuring the audio is loaded
        audioElement.onloadedmetadata = () => {
            audioElement.play().catch(e => console.error('Play failed:', e));
        };
    }
  };

  const handleSave = async () => {
    if(isLoading) return;
      if(audioBlob===null) return;
      if(isSaved) return;
      try {
          const newUuid = uuidv4(); // Generate a new UUID
          uploadAudio(newUuid);
          
              
        } catch (error) {
            console.error('Error sending audio:', error);
            alert('Failed to send audio. Please try again later.');
        }
  }

  const uploadAudio = async (newUuid) => {
    if (!audioBlob) {
        console.log('No audio blob available.');
        return;
    }
    setIsLoading(true);
    // Create form data
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('uuid', newUuid);
    setUuid(newUuid);

    // formData.append('isClone', isClone);

    try {
        // Send POST request to backend
        const response = await fetch(UPLOAD_AUDIO_URL, { // Adjust the endpoint URL as needed
            method: 'POST',
            headers: {
                "ngrok-skip-browser-warning": "1",
            },
            body: formData,
        });

        const result = await response.json();
        if(result.status==='success'){
          setIsSaved(true);
          setIsLoading(false);

          console.log(result.message);
          setTranscript(result.message)
        }
        console.log('Upload success:', result);
    } catch (error) {
        console.error('Error uploading audio:', error);
        setIsSaved(true);
        setIsLoading(false);
        console.log(error.message)
    }
  };

  const handleFileChange = (event) => {
      setVideoFile(event.target.files[0]);
  };

  const handleUpload = async () => {
      if (!videoFile) return;

      setIsLoading(true);
      const newUuid = uuidv4(); // Generate a new UUID
      const formData = new FormData();
      formData.append('uuid', newUuid);
      formData.append('video', videoFile, videoFile.name);
      setUuid(newUuid);

      try {
          const response = await fetch(UPLOAD_VIDEO_URL, { // Adjust URL for video uploads
              method: 'POST',
              body: formData,
              headers: {
                  "ngrok-skip-browser-warning": "1",
              },
          });
          if (!response.ok) {
            throw new Error('Network response was not ok');
        }
          const result = await response.json();
          if(result.status==='success'){
            setIsSaved(true);
            setIsLoading(false);

            console.log(result)
            setTranscript(result.message)
          }
          console.log('Upload success:', result);
      } catch (error) {
          console.error('Error uploading video:', error );
          setIsSaved(true);
          setIsLoading(false);
          setTranscript(error.message || "An unknown error occurred.");
      } finally {
        //   setIsLoading(false);
      }
  };

  const resetTranscript = () => {
    setTranscript('');
    setUuid('');
    setIsSaved(false);
    setIsLoading(false);
    // setIsClone(false);
    const audioElement = document.getElementById('audio-element');
    if (audioElement) {
      audioElement.src = '';
    }
  }

    return (
        <div className='flex flex-col w-full p-4 gap-4'>
            <div className='flex justify-between items-center'>
                <button className={`btn ${listening ? 'bg-red-500' : 'bg-green-500'}`} onClick={handleStart}>
                    Start
                </button>
                <button className='btn bg-blue-500' onClick={handleStopAndSend} disabled={!listening}>
                    Stop
                </button>
                <button className='btn bg-blue-500' onClick={handleSave} disabled={isLoading || isSaved || !audioBlob}>
                    {isLoading?"Saving...":"Save"}
                </button>
                <button className='btn bg-blue-500' onClick={resetTranscript} >
                    Reset
                </button>
                <div className='flex items-center'>
                    <input type='file' onChange={handleFileChange} accept='video/*' className='file-input' />
                    <button className={`btn ${isLoading?"bg-purple-200":"bg-purple-500"}`} onClick={handleUpload} disabled={!videoFile || isLoading}>
                        {isLoading?(<LoadingSpinner size={24}/>):"Upload Video"}
                    </button>
                </div>
            </div>
            <div>
                <p className='text-lg mt-4'>Use following value for your customers to identify their transcript</p>
                <input 
                  type="text"
                  value={uuid}
                  readOnly
                  className='border border-gray-300 w-full mt-2 p-2'
                  onFocus={(e) => e.target.select()} // Select all text on click for easy copying
                />
            </div>
            <div className='flex-1'>
              <audio src={audioUrl} controls autoPlay id='audio-element'></audio>
              <p className='text-xl text-bold'>Transcript:</p>
              <p>{transcript}</p>
            </div>
        </div>
    );
};

export default Dictaphone;
