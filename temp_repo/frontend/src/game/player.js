// frontend/src/game/player.js
import { getPlayerSprite } from './render.js';
import {
  SCREEN_WIDTH,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  MAX_VX,
  ACCE,
  MASATTRUOT,
  JUMP_VELOCITY,
  PLATFORM_START_Y,
} from './index.js';

// =============================================================================
// 1. KHỞI TẠO NHÂN VẬT NGƯỜI CHƠI (CREATE PLAYER)
// =============================================================================
export function createPlayer() {
  const width = PLAYER_WIDTH;
  const height = PLAYER_HEIGHT;
  const startX = Math.floor(SCREEN_WIDTH / 2 - width / 2);
  const startY = PLATFORM_START_Y - height;

  return {
    x: startX,
    y: startY,
    width,
    height,
    vx: 0,
    vy: -JUMP_VELOCITY, // Bật nhảy ngay lập tức khi bắt đầu game với JUMP_VELOCITY từ index.js
    direction: 'right',
    image: getPlayerSprite('right'),
    progress: 0,
    isDead: false,
  };
}

// =============================================================================
// 2. CẬP NHẬT DI CHUYỂN NGANG (UPDATE HORIZONTAL)
// =============================================================================
// Sử dụng hệ thống quán tính:
// - Nhấn phím: gia tốc ACCE
// - Đổi hướng: gia tốc ACCE + ma sát MASATTRUOT để bẻ lái đầm tay
// - Thả phím: ma sát MASATTRUOT hãm tốc mượt mà về 0
export function updateHorizontal(player, direction, dt) {
  const maxVx = MAX_VX;
  const acce = ACCE;
  const friction = MASATTRUOT;

  if (direction < 0) {
    player.direction = 'left';
    player.image = getPlayerSprite('left');

    // Đang đi sang phải mà bẻ lái sang trái: dùng ma sát + gia tốc hãm đầm tay
    if (player.vx > 0) {
      player.vx = Math.max(-maxVx, player.vx - (acce + friction) * dt);
    } else {
      player.vx = Math.max(-maxVx, player.vx - acce * dt);
    }
  } else if (direction > 0) {
    player.direction = 'right';
    player.image = getPlayerSprite('right');

    // Đang đi sang trái mà bẻ lái sang phải: dùng ma sát + gia tốc hãm đầm tay
    if (player.vx < 0) {
      player.vx = Math.min(maxVx, player.vx + (acce + friction) * dt);
    } else {
      player.vx = Math.min(maxVx, player.vx + acce * dt);
    }
  } else {
    // Nhả phím: ma sát trượt hãm trớn mượt mà về 0
    if (player.vx > 0) {
      player.vx = Math.max(0, player.vx - friction * dt);
    } else if (player.vx < 0) {
      player.vx = Math.min(0, player.vx + friction * dt);
    }
  }
}
