// frontend/src/game/input.js
// MODULE BẮT SỰ KIỆN PHÍM BẤM (INPUT HANDLING)

export function createInput(target = window) {
  const activeKeys = new Set();
  const state = { left: false, right: false };

  const LEFT_KEYS = ['KeyA', 'ArrowLeft', 'a', 'A'];
  const RIGHT_KEYS = ['KeyD', 'ArrowRight', 'd', 'D'];

  function updateState() {
    state.left = LEFT_KEYS.some((k) => activeKeys.has(k));
    state.right = RIGHT_KEYS.some((k) => activeKeys.has(k));
  }

  function handleKeyDown(event) {
    activeKeys.add(event.code);
    activeKeys.add(event.key);
    updateState();
  }

  function handleKeyUp(event) {
    activeKeys.delete(event.code);
    activeKeys.delete(event.key);
    updateState();
  }

  // Khi người chơi Alt+Tab hoặc click ra ngoài cửa sổ: xóa trạng thái giữ phím
  function handleBlur() {
    activeKeys.clear();
    state.left = false;
    state.right = false;
  }

  target.addEventListener('keydown', handleKeyDown);
  target.addEventListener('keyup', handleKeyUp);
  target.addEventListener('blur', handleBlur);

  return {
    state,
    destroy() {
      target.removeEventListener('keydown', handleKeyDown);
      target.removeEventListener('keyup', handleKeyUp);
      target.removeEventListener('blur', handleBlur);
      handleBlur();
    },
  };
}
