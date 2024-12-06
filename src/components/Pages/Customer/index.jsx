import TextToSpeechComponent from "../../TextToSpeechComponent";

const Customer = () => 
    <div className=" relative h-screen w-screen flex flex-col bg-gray-200 p-[2rem]">
        <h1>React Media Recorder</h1>
        <button className="absolute top-10 right-10" onClick={() => {
            window.location.href = "/";
        }}>Client</button>
        <div className=" w-full flex flex-col justify-center bg-gray-200">
            
            <TextToSpeechComponent />
        </div>
    </div>

export default Customer;