import React, { useCallback, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';

interface CameraFeedProps {
  onFrame: (frameData: string) => void;
  isConnected: boolean;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ onFrame, isConnected }) => {
  const webcamRef = useRef<Webcam>(null);
  const intervalRef = useRef<number>();

  const captureFrame = useCallback(() => {
    if (webcamRef.current && isConnected) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Extract base64 data from image
        const base64Data = imageSrc.split(',')[1];
        onFrame(base64Data);
      }
    }
  }, [onFrame, isConnected]);

  useEffect(() => {
    if (isConnected) {
      intervalRef.current = window.setInterval(captureFrame, 1000 / 30); // 30 FPS
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [captureFrame, isConnected]);

  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 1280,
          height: 720,
          facingMode: "environment"
        }}
        className="w-full h-full object-cover"
      />
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white">Connecting to server...</p>
        </div>
      )}
    </div>
  );
};
