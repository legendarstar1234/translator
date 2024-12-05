import TextToSpeechComponent from "../../TextToSpeechComponent";

const Customer = () => 
    <div className="h-screen w-screen flex flex-col bg-gray-200 p-[2rem]">
        <h1>React Media Recorder</h1>
        <div className=" w-full flex flex-col justify-center bg-gray-200">
            
            <TextToSpeechComponent />
        </div>
    </div>

export default Customer;