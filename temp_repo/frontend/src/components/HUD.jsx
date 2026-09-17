// frontend/src/components/HUD.jsx
export default function HUD({ elapsedMs = 0, phase = 'ready' }) {
  const phaseLabels = {
    ready: 'Sẵn sàng',
    running: 'Đang chơi',
    paused: 'Tạm dừng',
    finished: 'Kết thúc',
  };

  const seconds = (elapsedMs / 1000).toFixed(1);

  return (
    <div
      id="game-hud"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#17352e',
        color: '#edf2e9',
        fontFamily: 'monospace',
        borderRadius: '8px 8px 0 0',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        fontSize: '14px',
      }}
    >
      <div>
        <span>⏱️ Thời gian: </span>
        <strong style={{ color: '#e8ad48' }}>{seconds}s</strong>
      </div>
      <div>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: phase === 'running' ? '#2e7d32' : '#555',
            fontSize: '12px',
          }}
        >
          {phaseLabels[phase] || phase}
        </span>
      </div>
    </div>
  );
}
