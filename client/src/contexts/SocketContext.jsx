import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, socket: externalSocket }) => {
  const [socket, setSocket] = useState(externalSocket);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (externalSocket) {
      setSocket(externalSocket);
      setIsConnected(externalSocket.connected);
      
      const handleConnect = () => {
        setIsConnected(true);
        setConnectionError(null);
      };
      
      const handleDisconnect = () => {
        setIsConnected(false);
      };
      
      const handleError = (error) => {
        setConnectionError(error);
        setIsConnected(false);
      };

      externalSocket.on('connect', handleConnect);
      externalSocket.on('disconnect', handleDisconnect);
      externalSocket.on('connect_error', handleError);

      return () => {
        externalSocket.off('connect', handleConnect);
        externalSocket.off('disconnect', handleDisconnect);
        externalSocket.off('connect_error', handleError);
      };
    }
  }, [externalSocket]);

  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  }, [socket, isConnected]);

  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  }, [socket]);

  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  const value = useMemo(() => ({
    socket,
    isConnected,
    connectionError,
    emit,
    on,
    off
  }), [socket, isConnected, connectionError, emit, on, off]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext };