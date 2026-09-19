// src/App.tsx
// GIAO DIỆN CHÍNH & VỎ BỌC REACT CHO TRÒ CHƠI 2D DOODLE JUMP

import React, { useEffect, useRef, useState } from 'react';
import { createGame } from './game/engine.js';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './game/index.js';
import { RotateCcw, Maximize2, Minimize2, ArrowLeft, ArrowRight } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameState, setGameState] = useState<{
    elapsedMs: number;
    phase: string;
    isGameOver: boolean;
    isWin: boolean;
  }>({
    elapsedMs: 0,
    phase: 'running',
    isGameOver: false,
    isWin: false,
  });

  const [gameKey, setGameKey] = useState(0);

  // ===========================================================================
  // 1. KHỞI TẠO GAME ENGINE VÀ ĐỒNG BỘ TRẠNG THÁI
  // ===========================================================================
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

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
          isGameOver: Boolean(game.state.isGameOver),
          isWin: Boolean(game.state.isWin),
        });
      }
    }, 60);

    return () => {
      clearInterval(interval);
      game.destroy();
    };
  }, [gameKey]);

  // ===========================================================================
  // 2. LẮNG NGHE SỰ KIỆN TOÀN MÀN HÌNH CỦA TRÌNH DUYỆT
  // ===========================================================================
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Bật/tắt chế độ toàn màn hình trình duyệt (Native Fullscreen)
  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Không thể chuyển đổi toàn màn hình:', err);
    }
  };

  const handleRestart = () => {
    if (gameRef.current?.restart) {
      gameRef.current.restart();
    } else {
      setGameKey((prev) => prev + 1);
    }
  };

  // Hỗ trợ cảm ứng hoặc chuột bấm nút điều khiển trái / phải
  const triggerKey = (key: 'ArrowLeft' | 'ArrowRight', isDown: boolean) => {
    const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
      key: key,
      code: key,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  const seconds = (gameState.elapsedMs / 1000).toFixed(1);

  return (
    <div
      ref={containerRef}
      id="game-fullscreen-container"
      className="fixed inset-0 w-screen h-screen bg-[#11241f] overflow-hidden select-none flex flex-col justify-between"
    >
      {/* THANH ĐIỀU KHIỂN NỔI PHÍA TRÊN (TOP FLOATING HUD & CONTROLS) */}
      <header className="z-30 w-full px-3 py-2 sm:px-5 sm:py-3 flex items-center justify-between gap-2 bg-gradient-to-b from-[#0b1714]/90 via-[#0b1714]/60 to-transparent backdrop-blur-[2px]">
        {/* Tiêu đề và Thời gian */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-[#17352e]/80 border border-[#2e574b] px-2.5 py-1 rounded-lg text-white shadow-sm">
            <span className="text-base sm:text-lg">🐸</span>
            <span className="font-extrabold text-xs sm:text-sm tracking-tight text-[#e8ad48]">
              2D Doodle Jump
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1 rounded-lg text-white text-xs sm:text-sm font-mono">
            <span className="text-stone-400">⏱️</span>
            <strong className="text-amber-400">{seconds}s</strong>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-[11px] text-stone-300">
            <span>Phím điều khiển:</span>
            <kbd className="px-1 py-0.5 bg-white/10 rounded font-mono font-bold text-white text-[10px]">A / D</kbd>
            <span>hoặc</span>
            <kbd className="px-1 py-0.5 bg-white/10 rounded font-mono font-bold text-white text-[10px]">← / →</kbd>
          </div>
        </div>

        {/* Nút hành động: Chơi lại & Toàn màn hình */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            title="Chơi lại ván mới"
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition shadow-md ${
              gameState.isWin
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 animate-pulse ring-2 ring-amber-300'
                : gameState.isGameOver
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse ring-2 ring-rose-300'
                : 'bg-[#2a5948] hover:bg-[#346c58] text-white active:scale-95 border border-[#3f8068]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>
              {gameState.isWin
                ? '👑 Bạn Thắng! Chơi lại'
                : gameState.isGameOver
                ? 'Chơi lại ngay'
                : 'Chơi lại'}
            </span>
          </button>

          <button
            onClick={toggleBrowserFullscreen}
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Bật toàn màn hình'}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 transition shadow-md"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="hidden sm:inline">Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* KHUNG TRÒ CHƠI (CANVAS VIEWPORT STAGE) */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center p-1 sm:p-2 overflow-hidden">
        <div
          className="relative w-full h-full max-w-full max-h-full flex items-center justify-center"
          style={{
            aspectRatio: `${SCREEN_WIDTH} / ${SCREEN_HEIGHT}`,
          }}
        >
          <canvas
            ref={canvasRef}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            className="w-full h-full max-w-full max-h-full object-contain block rounded-lg sm:rounded-xl shadow-2xl border border-white/10 bg-[#edf2e9] cursor-pointer"
          />
        </div>
      </main>

      {/* NÚT ĐIỀU KHIỂN CẢM ỨNG NỔI Ở 2 BÊN GÓC DƯỚI (TOUCH CONTROLS) */}
      <div className="z-30 pointer-events-none absolute bottom-4 left-4 right-4 flex justify-between items-center">
        {/* Nút sang trái */}
        <button
          type="button"
          aria-label="Sang trái"
          className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/40 hover:bg-black/60 active:bg-emerald-600/80 active:scale-90 text-white/90 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition select-none touch-none"
          onMouseDown={() => triggerKey('ArrowLeft', true)}
          onMouseUp={() => triggerKey('ArrowLeft', false)}
          onMouseLeave={() => triggerKey('ArrowLeft', false)}
          onTouchStart={(e) => {
            e.preventDefault();
            triggerKey('ArrowLeft', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            triggerKey('ArrowLeft', false);
          }}
        >
          <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>

        {/* Nút sang phải */}
        <button
          type="button"
          aria-label="Sang phải"
          className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/40 hover:bg-black/60 active:bg-emerald-600/80 active:scale-90 text-white/90 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition select-none touch-none"
          onMouseDown={() => triggerKey('ArrowRight', true)}
          onMouseUp={() => triggerKey('ArrowRight', false)}
          onMouseLeave={() => triggerKey('ArrowRight', false)}
          onTouchStart={(e) => {
            e.preventDefault();
            triggerKey('ArrowRight', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            triggerKey('ArrowRight', false);
          }}
        >
          <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
      </div>
    </div>
  );
}
