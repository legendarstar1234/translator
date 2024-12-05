import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useSocket = (serverUrl) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(serverUrl);

    // Update connection status
    setIsConnected(socketInstance.connected);

    // Event listeners
    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [serverUrl]);

  return { socket, isConnected };
};

export default useSocket;
