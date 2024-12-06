import Dictaphone from "../../Dictaphone";
const Client = () => {
    return (
        
        <div className="relative h-screen w-screen flex flex-col bg-gray-200 p-[2rem]">
            <h1>React Media Recorder</h1>
            <button className="absolute top-10 right-10" onClick={() => {
                window.location.href = "/customer";
            }}>Customer</button>
            <div className="min-h-screen w-full flex justify-center bg-gray-200">
              <Dictaphone />
            </div>
        </div>
    );
};

export default Client;