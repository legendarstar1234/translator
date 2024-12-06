import 'regenerator-runtime/runtime';
import React, {useState} from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { v4 as uuidv4 } from 'uuid';
import { SEND_TRANSCRIPT_URL } from '../utils/constants';

const Dictaphone = () => {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();
    const [uuid, setUuid] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    const handleStart = () => {
        if(listening) return;
        SpeechRecognition.startListening({continuous: true});
        
        console.log('Started listening');
        setIsSaved(false)

    }
    // Function to handle stopping and sending transcript
    const handleStopAndSend = async () => {
        SpeechRecognition.stopListening();
    };

    const handleSave = async () => {
        if (transcript==='') return;
        if(isSaved) return;
        try {
            const newUuid = uuidv4(); // Generate a new UUID
            setUuid(newUuid);
            const response = await fetch(SEND_TRANSCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "1",
                },
                    body: JSON.stringify({ transcript, uuid: newUuid })
            });

            if (!response.ok) {
                throw new Error('Failed to send transcript');
            }

            console.log('Transcript sent successfully');
            setIsSaved(true)
                
        } catch (error) {
            console.error('Error sending transcript:', error);
            alert('Failed to send transcript. Please try again later.');
        }
    }

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  return (
    <div className='flex flex-col w-full p-5'>
      <div className='flex w-full items-center flex-col gap-2'>
        <p className='text-xl text-bold h-[30px]'>Microphone: {listening ? 'on' : 'off'}</p>
        <div className='flex gap-2'>
            <button className={`w-[100px] h-[50px] ${listening ? 'bg-green-500 disabled:opacity-50' : 'bg-red-200'}`} onClick={handleStart}>Start</button>
            <button className='w-[100px] h-[50px]' onClick={handleStopAndSend}>Stop</button>
            <button className={`w-[100px] h-[50px] ${transcript==='' ? 'bg-gray-500 disabled:opacity-50' : 'bg-green-200'}`} onClick={handleSave}>Save</button>
            <button className='w-[100px] h-[50px]' onClick={resetTranscript}>Reset</button>
        </div>
        {uuid && (
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
        <p className='text-xl text-bold'>Transcript:</p>
        <p>{transcript}</p>
      </div>
    </div>
  );
};
export default Dictaphone;