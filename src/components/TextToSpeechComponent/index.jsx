import React, { useState } from "react";
import { GET_TRANSCRIPT_URL, DOWNLOAD_AUDIO_URL } from "../utils/constants";



const TextToSpeechComponent = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [text, setText] = useState("This is a sample text.");
  const [uuid, setUuid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
   const fetchTranscript = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(GET_TRANSCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "ngrok-skip-browser-warning": "1",
        },
            body: JSON.stringify({ uuid: uuid })
      });

      if (!response.ok) {
        setIsLoading(false);
          throw new Error('Failed to send transcript');
      }

      const data = await response.json();
      if(data.status==='success'){
        setText(data.content);
      } else {
        setText("No transcript found");
      }
      

      const audioResponse = await fetch(DOWNLOAD_AUDIO_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "ngrok-skip-browser-warning": "1",
        }, body: JSON.stringify({ filename: uuid })
      });

      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioPlayer = document.getElementById("audio_player");
      audioPlayer.src = audioUrl;
      setIsLoading(false);

    } catch (error) {
      setIsLoading(false);
      console.error('Error fetching transcript:', error);
    }
  };

  const handlePlay = () => {
    const audioPlayer = document.getElementById("audio_player");

    if(isPaused){
      audioPlayer.play();
      setIsPaused(false);
    } 
  }

  const handleStop = () => {
    const audioPlayer = document.getElementById("audio_player");
    audioPlayer.pause();
    setIsPaused(true);
  }

  return (
    <div className="w-full flex flex-col gap-2 mt-4">
        <div className="flex flex-row gap-2">
            <input className="p-2 rounded-md" type="text" placeholder="Enter key" value={uuid} onChange={(e) => setUuid(e.target.value)}/>
            {isLoading?
              <button className="bg-blue-500 text-white p-2 rounded-md" onClick={fetchTranscript} disabled>Loading...</button>:
              <button className="bg-blue-500 text-white p-2 rounded-md" onClick={fetchTranscript}>Ok</button>
            }
        </div>
        <div className="flex flex-row gap-2">
            <button onClick={handlePlay}>{isPaused ? "Resume" : "Play"}</button>
            <button onClick={handleStop}>Stop</button>
            <audio controls autoPlay id="audio_player">

            </audio>
        </div>
        <p>{text}</p>
    </div>
  );
};

export default TextToSpeechComponent;