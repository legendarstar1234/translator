import Dictaphone from "../../Dictaphone";
import AudioRecorder from "../../AudioRecorder";
const Client = () => {
    return (
        
        <div className="relative h-screen w-screen flex flex-col bg-gray-200 p-[2rem]">
            <h1>Speech Recorder</h1>
            <button className="absolute top-10 right-10" onClick={() => {
                window.location.href = "/customer";
            }}>Customer</button>
            <div className="min-h-screen w-full flex justify-center bg-gray-200">
              <Dictaphone />
              {/* <AudioRecorder /> */}
            </div>
        </div>
    );
};

export default Client;