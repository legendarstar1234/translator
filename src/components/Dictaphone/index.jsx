import 'regenerator-runtime/runtime';
import React, {useState, useRef} from 'react';
// import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { v4 as uuidv4 } from 'uuid';
import { SEND_TRANSCRIPT_URL, UPLOAD_AUDIO_URL } from '../utils/constants';

const Dictaphone = () => {
    
    const [uuid, setUuid] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [isClone, setIsClone] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);  
    const [audioChunks, setAudioChunks] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);

    

    const handleStart = async () => {
      if(listening) return;
      if(isLoading) return;
      // SpeechRecognition.startListening({continuous: true});
      setAudioChunks([])
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });  
      const recorder = new MediaRecorder(stream);  

      recorder.ondataavailable = (event) => {  
        setAudioChunks((prev) => [...prev, event.data]);  
      };  

      recorder.start(250);  
      setMediaRecorder(recorder); 
      setIsSaved(false);
      setListening(true);
    }
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
            type: 'audio/webm; codecs=opus'  // Changed from wav to webm
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
            setUuid(newUuid);
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
      formData.append('isClone', isClone);
  
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
            setTranscript(result.message)
          }
          console.log('Upload success:', result);
      } catch (error) {
          console.error('Error uploading audio:', error);
          setIsLoading(false);
      }
  };
  

    const resetTranscript = () => {
        setTranscript('');
        setUuid('');
        setIsSaved(false);
        setIsClone(false);
        const audioElement = document.getElementById('audio-element');
        if (audioElement) {
          audioElement.src = '';
        }
    }


  return (
    <div className='flex flex-col w-full p-5'>
      <div className='flex w-full items-center flex-col gap-2'>
        <p className='text-xl text-bold h-[30px]'>Microphone: {listening ? 'on' : 'off'}</p>
        <div className='flex gap-2'>
            <button className={`w-[100px] h-[50px] ${listening ? 'bg-green-500 disabled:opacity-50' : 'bg-red-200'}`} onClick={handleStart}>Start</button>
            <button className={`w-[100px] h-[50px] ${isLoading ? 'disabled:opacity-50' : ''}`} onClick={handleStopAndSend}>Stop</button>
            {isLoading? 
              <button type="button" class="bg-indigo-500 ..." disabled>
                  Processing...
              </button>:
              <button className={`w-[100px] h-[50px] bg-gray-500 disabled:opacity-50`} onClick={handleSave}>Save</button>
            }
            <button className={`w-[100px] h-[50px] ${isLoading ? 'disabled:opacity-50' : ''}`} onClick={resetTranscript}>Reset</button>
        </div>
         {/* <div><input type='checkbox' checked={isClone} onClick={()=>{setIsClone(!isClone)}}/> Clone my voice </div> */}
        {uuid && !isLoading && (
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
        )}
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