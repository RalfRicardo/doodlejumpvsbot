import React, { useEffect, useRef, useState } from 'react';
import { createGame } from '../temp_repo/frontend/src/game/engine.js';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../temp_repo/frontend/src/game/index.js';
import HUD from '../temp_repo/frontend/src/components/HUD.jsx';
import { RotateCcw, Gamepad2, Maximize2 } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<any>(null);

  const [sizeMode, setSizeMode] = useState<'fullscreen' | 'large' | 'medium' | 'compact'>('fullscreen');
  const [gameState, setGameState] = useState<{
    elapsedMs: number;
    phase: string;
    isGameOver: boolean;
  }>({
    elapsedMs: 0,
    phase: 'running',
    isGameOver: false,
  });

  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = createGame(canvasRef.current, {
      bots: [
        { id: 'bot-1', name: 'Thầy Sơn' },
        { id: 'bot-2', name: 'Thầy Việt' },
        { id: 'bot-3', name: 'Thầy Hiệp' },
        { id: 'bot-4', name: 'Thầy Nam' },
      ],
    });
    gameRef.current = game;

    const interval = setInterval(() => {
      if (game?.state) {
        setGameState({
          elapsedMs: game.state.elapsedMs || 0,
          phase: game.state.phase || 'running',
          isGameOver: !!game.state.isGameOver,
        });
      }
    }, 80);

    return () => {
      clearInterval(interval);
      game.destroy();
    };
  }, [gameKey]);

  const handleRestart = () => {
    if (gameRef.current?.restart) {
      gameRef.current.restart();
    } else {
      setGameKey(k => k + 1);
    }
  };

  // Tính toán kích thước tối đa để game to gần kín màn hình mà không bị tràn/cuộn
  const sizeClass = {
    fullscreen: 'max-w-[min(98vw,calc((100vh-140px)*960/540))]',
    large: 'max-w-[1100px]',
    medium: 'max-w-[880px]',
    compact: 'max-w-[680px]',
  }[sizeMode];

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center p-2 sm:p-3 text-stone-900 font-sans select-none">
      <header className="mb-2 text-center w-full max-w-5xl flex flex-wrap items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#17352e] flex items-center gap-1.5">
            <span>🐸</span> 2D Doodle Jump
          </h1>
          <span className="text-xs text-stone-500 hidden md:inline">
            • Phím <kbd className="px-1.5 py-0.5 bg-stone-200 rounded border border-stone-300 text-[11px] font-mono font-bold">A/D</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-stone-200 rounded border border-stone-300 text-[11px] font-mono font-bold">← / →</kbd>
          </span>
        </div>

        {/* Bộ chọn kích thước hiển thị */}
        <div className="inline-flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg text-xs font-medium">
          <span className="px-1.5 text-stone-500 text-[11px] flex items-center gap-1">
            <Maximize2 className="w-3 h-3" /> Cỡ:
          </span>
          <button
            onClick={() => setSizeMode('fullscreen')}
            className={`px-2.5 py-1 rounded-md transition ${sizeMode === 'fullscreen' ? 'bg-[#17352e] shadow text-white font-bold' : 'text-stone-700 hover:text-stone-900'}`}
          >
            Toàn màn hình
          </button>
          <button
            onClick={() => setSizeMode('large')}
            className={`px-2 py-1 rounded-md transition ${sizeMode === 'large' ? 'bg-white shadow text-[#17352e] font-bold' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Lớn (1100px)
          </button>
          <button
            onClick={() => setSizeMode('medium')}
            className={`px-2 py-1 rounded-md transition ${sizeMode === 'medium' ? 'bg-white shadow text-[#17352e] font-bold' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Vừa (880px)
          </button>
          <button
            onClick={() => setSizeMode('compact')}
            className={`px-2 py-1 rounded-md transition ${sizeMode === 'compact' ? 'bg-white shadow text-[#17352e] font-bold' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Nhỏ (680px)
          </button>
        </div>
      </header>

      <div className={`flex flex-col items-center justify-center w-full ${sizeClass} transition-all duration-200`}>
        {/* Khung Canvas Trò chơi */}
        <div className="flex flex-col items-center bg-white p-2 sm:p-3 rounded-2xl shadow-xl border border-stone-200 w-full">
          <HUD
            elapsedMs={gameState.elapsedMs}
            phase={gameState.phase}
          />

          <div
            className="relative border-2 border-[#17352e]/20 rounded-b-xl overflow-hidden bg-[#edf2e9] w-full"
            style={{ aspectRatio: `${SCREEN_WIDTH} / ${SCREEN_HEIGHT}` }}
          >
            <canvas
              ref={canvasRef}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              className="w-full h-full block cursor-pointer"
            />
          </div>

          {/* Thanh công cụ dưới Canvas */}
          <div className="mt-3.5 flex items-center justify-center w-full px-1">
            <button
              onClick={handleRestart}
              className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition shadow-sm ${
                gameState.isGameOver
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-[#43765c] hover:bg-[#345c48] text-white active:scale-95'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              {gameState.isGameOver ? 'Chơi lại ngay' : 'Chơi lại'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
