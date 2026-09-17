import { useEffect, useRef } from 'react';
import { createGame } from '../game/engine.js';

export default function GameCanvas({ config }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const game = createGame(canvasRef.current, config);
    return () => game.destroy();
  }, [config]);
  return <canvas ref={canvasRef} width="640" height="520" aria-label="Khung game tĩnh với nhân vật và bệ mẫu">Trình duyệt cần hỗ trợ Canvas 2D.</canvas>;
}
