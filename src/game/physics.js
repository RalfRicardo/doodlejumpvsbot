// frontend/src/game/physics.js
// MODULE VẬT LÝ & CHUYỂN ĐỘNG (PHYSICS ENGINE)

import { 
  GRAVITY, 
  MAX_VY, 
  JUMP_VELOCITY, 
  SCREEN_WIDTH 
} from './index.js';

import { 
  checkAABB, 
  isLandingOnPlatform 
} from './collision.js';

/**
 * Các công thức động học chuyển động ném thẳng đứng
 */
export const Kinematics = {
  velocityAt: (v0, g, t) => v0 - g * t,
  positionAt: (y0, v0, g, t) => y0 + v0 * t - 0.5 * g * t * t,
  peakTime: (v0, g) => v0 / g,
  maxHeight: (v0, g) => (v0 * v0) / (2 * g),
  airTime: (v0, g) => (2 * v0) / g,
  range: (vx, v0, g) => vx * ((2 * v0) / g),
};

// =============================================================================
// 1. ÁP DỤNG TRỌNG LỰC & CẬP NHẬT TỌA ĐỘ
// Hệ tọa độ: Trục Y hướng lên trên (vy > 0 là bay lên, vy < 0 là rơi xuống)
// =============================================================================
export function applyPhysics(body, dt) {
  // Trọng lực kéo xuống: giảm vận tốc vy theo thời gian
  body.vy -= GRAVITY * dt;

  // Giới hạn vận tốc rơi tự do tối đa (-MAX_VY)
  if (body.vy < -MAX_VY) {
    body.vy = -MAX_VY;
  }

  // Cập nhật vị trí X và Y theo vận tốc
  body.x += body.vx * dt;
  body.y += body.vy * dt;
}

// =============================================================================
// 2. XỬ LÝ XUYÊN MÀN HÌNH (SCREEN WRAP-AROUND)
// Khi nhân vật đi qua mép màn hình bên này thì xuất hiện ở mép đối diện
// =============================================================================
export function handleScreenWrap(body, screenWidth = SCREEN_WIDTH) {
  const halfWidth = screenWidth / 2;
  const halfEntityWidth = (body.width || 46) / 2;

  // Đi qua mép phải -> xuất hiện ở mép trái
  if (body.x > halfWidth + halfEntityWidth) {
    body.x = -halfWidth - halfEntityWidth;
  } 
  // Đi qua mép trái -> xuất hiện ở mép phải
  else if (body.x < -halfWidth - halfEntityWidth) {
    body.x = halfWidth + halfEntityWidth;
  }
}

// Wrapper kiểm tra va chạm AABB
export function detectCollision(rectA, rectB) {
  return checkAABB(rectA, rectB);
}

// =============================================================================
// 3. XỬ LÝ TIẾP ĐẤT & BẬT NẢY TRÊN BỆ ĐỠ (PLATFORM COLLISIONS)
// =============================================================================
export function handlePlatformCollisions(entity, platforms, onBounce = null) {
  if (!Array.isArray(platforms)) {
    return;
  }

  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];

    // Bỏ qua bệ đã bị vỡ
    if (platform.broken) {
      continue;
    }

    // Kiểm tra tiếp đất an toàn (chỉ khi đang rơi xuống vy < 0)
    const isLanding = isLandingOnPlatform(entity, platform);

    if (isLanding) {
      // BỆ VỠ (BREAKABLE): Chạm vào là vỡ luôn và KHÔNG ĐƯỢC NHẢY LÊN! Rơi xuyên qua bệ!
      if (platform.type === 'breakable') {
        platform.broken = true;
        platform.brokenY = platform.y;
        platform.brokenTimer = 0;
        continue; // Rơi xuyên qua, không đặt y và không bật nảy lên
      }

      // BỆ THƯỜNG / BỆ DI CHUYỂN: Tiếp đất và bật nảy bay lên
      entity.y = platform.y;
      entity.vy = JUMP_VELOCITY;

      if (typeof onBounce === 'function') {
        onBounce(entity, platform);
      }

      break;
    }
  }
}
