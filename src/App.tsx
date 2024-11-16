import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Github } from 'lucide-react';
import { ChessBoard } from './components/ChessBoard';
import { CameraFeed } from './components/CameraFeed';
import { SpeechManager } from './utils/speech';

interface DetectedPiece {
  piece: string;
  position: string;
  confidence: number;
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [detectedPieces, setDetectedPieces] = useState<DetectedPiece[]>([]);
  const [previousPieces, setPreviousPieces] = useState<DetectedPiece[]>([]);
  const speechManager = SpeechManager.getInstance();

  // Retry attempt count for WebSocket
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced WebSocket connection with exponential backoff
  const connectWebSocket = useCallback(() => {
    const socket = new WebSocket('ws://localhost:8000/ws');

    socket.onopen = () => {
      setIsConnected(true);
      setRetryCount(0); // Reset retry count on successful connection
      speechManager.speak("Connected to chess vision system");
    };

    socket.onclose = () => {
      setIsConnected(false);
      const retryDelay = Math.min(3000 * (retryCount + 1), 30000); // Exponential backoff up to 30s
      setTimeout(connectWebSocket, retryDelay);
      setRetryCount((count) => count + 1);
      speechManager.speak("Connection lost. Attempting to reconnect");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setDetectedPieces(data.detected_pieces);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [retryCount]);

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  // Debounce function to limit announcement frequency
  const debounce = (func: () => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(), delay);
    };
  };

  const announceMove = useCallback(
    debounce(() => {
      detectedPieces.forEach((piece) => {
        const prevPiece = previousPieces.find((p) => p.piece === piece.piece);
        if (prevPiece && prevPiece.position !== piece.position) {
          const moveText = `${piece.piece} moved from ${prevPiece.position} to ${piece.position}`;
          speechManager.speak(moveText);
        }
      });
      setPreviousPieces(detectedPieces);
    }, 1000),
    [detectedPieces, previousPieces]
  );

  useEffect(() => {
    announceMove();
  }, [detectedPieces, announceMove]);

  const handleFrame = (frameData: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(frameData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Camera className="w-8 h-8 text-amber-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Chess Vision AI
              </h1>
            </div>
            <a
              href="https://github.com/shubhsardana29/slidely"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <CameraFeed onFrame={handleFrame} isConnected={isConnected} />
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Position your camera to capture the entire chessboard</li>
                  <li>Ensure good lighting conditions</li>
                  <li>Keep the board steady for optimal detection</li>
                  <li>Voice announcements will describe detected moves</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ChessBoard
                isConnected={isConnected}
                detectedPieces={detectedPieces}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500 text-sm">
          Powered by YOLOv8 and OpenCV
        </p>
      </footer>
    </div>
  );
}

export default App;
