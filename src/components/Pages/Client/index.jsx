import Dictaphone from "../../Dictaphone";
const Client = () => {
    return (
        
        <div className="h-screen w-screen flex flex-col bg-gray-200 p-[2rem]">
            <h1>React Media Recorder</h1>
            <div className="min-h-screen w-full flex justify-center bg-gray-200">
              <Dictaphone />
            </div>
        </div>
    );
};

export default Client;