import React from 'react';
import {  RefreshCw, ZapOff } from 'lucide-react';

interface ChessBoardProps {
  isConnected: boolean;
  detectedPieces: Array<{
    piece: string;
    position: string;
    confidence: number;
  }>;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  isConnected,
  detectedPieces,
}) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className="relative">
      <div className="grid grid-cols-8 w-[600px] h-[600px] border-2 border-gray-800 shadow-xl">
        {ranks.map((rank) =>
          files.map((file) => {
            const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0;
            const square = `${file}${rank}`;
            const piece = detectedPieces.find((p) => p.position === square);

            return (
              <div
                key={square}
                className={`relative ${
                  isLight ? 'bg-amber-100' : 'bg-amber-800'
                } flex items-center justify-center`}
              >
                {piece && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-green-500/20 rounded-full w-12 h-12 animate-pulse" />
                    <span className="absolute text-sm font-mono">
                      {piece.piece} ({Math.round(piece.confidence * 100)}%)
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="absolute -right-48 top-0 space-y-4">
        <div className={`p-4 rounded-lg ${
          isConnected ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <RefreshCw className="w-5 h-5 text-green-600 animate-spin" />
            ) : (
              <ZapOff className="w-5 h-5 text-red-600" />
            )}
            <span className={isConnected ? 'text-green-700' : 'text-red-700'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Detection Stats</h3>
          <div className="space-y-1 text-sm">
            <p>Pieces detected: {detectedPieces.length}</p>
            <p>FPS: 30</p>
            <p>Latency: 50ms</p>
          </div>
        </div>
      </div>
    </div>
  );
};