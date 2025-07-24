import React, { useState, useEffect } from 'react';
import { usePingService } from '../hooks/use-ping-service';
import { Button } from './ui/button';

/**
 * Debug component to show MSW ping service status
 * Only shows in development mode
 */
export const PingStatus: React.FC = () => {
  const { start, stop, isRunning, getInterval } = usePingService();
  const [lastPing, setLastPing] = useState<string>('Never');
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  useEffect(() => {
    setIsVisible(import.meta.env.DEV);
  }, []);

  // Listen for ping events
  useEffect(() => {
    const handlePing = () => {
      setLastPing(new Date().toLocaleTimeString());
    };

    // Listen for console messages about successful pings
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0] === 'MSW Ping successful:') {
        handlePing();
      }
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm z-50">
      <div className="font-medium text-gray-900 mb-2">MSW Ping Service</div>
      
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            isRunning() 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isRunning() ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Interval:</span>
          <span className="text-gray-900">{getInterval() / 1000}s</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Last Ping:</span>
          <span className="text-gray-900">{lastPing}</span>
        </div>
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => start(30000)}
          disabled={isRunning()}
        >
          Start
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={stop}
          disabled={!isRunning()}
        >
          Stop
        </Button>
      </div>
    </div>
  );
}; 