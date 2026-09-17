// frontend/src/game/world.js
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  CAMERA_SIGHT_RATIO,
  P_HEIGHT,
  P_WIDTH_MIN,
  P_WIDTH_MAX,
  P_MOVING_SPEED,
  STEP_Y_MIN,
  STEP_Y_MAX,
  BREAKABLE_COUNTDOWN,
  DISAPPEAR_DELAY,
  PLATFORM_SAFE_GAP,
  PLATFORM_START_WIDTH,
  PLATFORM_START_Y,
  PLATFORM_CLEANUP_OFFSET,
} from './index.js';

// =============================================================================
// 1. TẠO DANH SÁCH BỆ XUẤT PHÁT THEO TỈ LỆ SCREEN_WIDTH & SCREEN_HEIGHT
// =============================================================================
export function getDefaultPlatforms() {
  const w = SCREEN_WIDTH;
  const startW = PLATFORM_START_WIDTH;
  const startY = PLATFORM_START_Y;
  const h = P_HEIGHT;
  const speed = P_MOVING_SPEED;

  return [
    // Vạch xuất phát đáy (startY = 460): 3 bệ song song công bằng cho cả 5 tay đua
    { x: Math.floor(w * 0.05), y: startY, width: 75, height: h, type: 'normal' },
    { x: Math.floor(w / 2 - startW / 2), y: startY, width: startW, height: h, type: 'normal' },
    { x: Math.floor(w * 0.76), y: startY, width: 75, height: h, type: 'normal' },

    // Tầng 1: 3 nhánh trải đều
    { x: Math.floor(w * 0.12), y: startY - 85, width: 75, height: h, type: 'normal' },
    { x: Math.floor(w * 0.46), y: startY - 95, width: 75, height: h, type: 'normal' },
    { x: Math.floor(w * 0.77), y: startY - 85, width: 75, height: h, type: 'normal' },

    // Tầng 2: Bệ di chuyển ở giữa tuần tra trong khoảng an toàn
    { x: Math.floor(w * 0.14), y: startY - 175, width: 72, height: h, type: 'normal' },
    {
      x: Math.floor(w * 0.46),
      y: startY - 180,
      width: 74,
      height: h,
      type: 'moving',
      vx: speed,
      minX: Math.floor(w * 0.32),
      maxX: Math.floor(w * 0.68),
    },
    { x: Math.floor(w * 0.81), y: startY - 175, width: 70, height: h, type: 'normal' },

    // Tầng 3:
    { x: Math.floor(w * 0.09), y: startY - 260, width: 74, height: h, type: 'normal' },
    { x: Math.floor(w * 0.40), y: startY - 265, width: 76, height: h, type: 'normal' },
    { x: Math.floor(w * 0.72), y: startY - 260, width: 72, height: h, type: 'normal' },

    // Tầng 4: Bệ di chuyển tuần tra an toàn
    { x: Math.floor(w * 0.12), y: startY - 345, width: 70, height: h, type: 'normal' },
    {
      x: Math.floor(w * 0.46),
      y: startY - 350,
      width: 74,
      height: h,
      type: 'moving',
      vx: -speed,
      minX: Math.floor(w * 0.30),
      maxX: Math.floor(w * 0.70),
    },
    { x: Math.floor(w * 0.83), y: startY - 345, width: 72, height: h, type: 'normal' },

    // Tầng 5:
    { x: Math.floor(w * 0.10), y: startY - 435, width: 75, height: h, type: 'normal' },
    { x: Math.floor(w * 0.38), y: startY - 440, width: 72, height: h, type: 'normal' },
    { x: Math.floor(w * 0.71), y: startY - 435, width: 74, height: h, type: 'normal' },

    // Tầng 6:
    { x: Math.floor(w * 0.25), y: startY - 525, width: 72, height: h, type: 'normal' },
    { x: Math.floor(w * 0.58), y: startY - 530, width: 75, height: h, type: 'normal' },
    { x: Math.floor(w * 0.86), y: startY - 525, width: 70, height: h, type: 'normal' },
  ];
}

export function createWorld(initialPlatforms = null) {
  const platforms = initialPlatforms || getDefaultPlatforms();
  return {
    platforms: platforms.map(p => ({ ...p })),
    cameraY: 0,
    score: 0,
    maxScore: 0,
    sightLine: SCREEN_HEIGHT * CAMERA_SIGHT_RATIO,
  };
}

// =============================================================================
// 2. THUẬT TOÁN SINH BỆ PHÍA TRƯỚC (ENSURE PLATFORMS AHEAD)
// =============================================================================
// Tự động phân chia 3 vùng (Trái, Giữa, Phải) theo tỉ lệ SCREEN_WIDTH từ index.js
export function ensurePlatformsAhead(world, targetMinY) {
  let highestY = world.platforms.length > 0
    ? Math.min(...world.platforms.map(p => p.y))
    : 0;

  while (highestY > targetMinY) {
    // Bước nhảy dọc ngẫu nhiên từ STEP_Y_MIN đến STEP_Y_MAX lấy từ index.js
    highestY -= STEP_Y_MIN + Math.random() * (STEP_Y_MAX - STEP_Y_MIN);

    // 3 vùng phân bổ ngang co giãn linh hoạt theo SCREEN_WIDTH
    const zoneLeft = {
      minX: Math.floor(SCREEN_WIDTH * 0.03),
      maxX: Math.floor(SCREEN_WIDTH * 0.29),
    };
    const zoneMid = {
      minX: Math.floor(SCREEN_WIDTH * 0.35),
      maxX: Math.floor(SCREEN_WIDTH * 0.62),
    };
    const zoneRight = {
      minX: Math.floor(SCREEN_WIDTH * 0.68),
      maxX: Math.floor(SCREEN_WIDTH * 0.94),
    };

    const rand = Math.random();
    let selectedZones = [];

    if (rand < 0.45) {
      selectedZones = [zoneLeft, zoneMid, zoneRight];
    } else if (rand < 0.75) {
      selectedZones = [zoneLeft, zoneRight];
    } else if (rand < 0.90) {
      selectedZones = Math.random() < 0.5 ? [zoneLeft, zoneMid] : [zoneMid, zoneRight];
    } else {
      selectedZones = [zoneMid];
    }

    let hasSafePlatform = false;

    // Tạo bệ cho các vùng được chọn
    for (let i = 0; i < selectedZones.length; i++) {
      const zone = selectedZones[i];
      const isLastInTier = i === selectedZones.length - 1;
      const isSinglePlatformTier = selectedZones.length === 1;
      const width = Math.floor(P_WIDTH_MIN + Math.random() * (P_WIDTH_MAX - P_WIDTH_MIN));
      const availableRange = zone.maxX - zone.minX - width;
      const x = Math.floor(zone.minX + Math.random() * Math.max(10, availableRange));
      const yOffset = Math.floor(Math.random() * 10 - 5);

      // Random 3 loại bệ
      let type = 'normal';
      let vx = 0;
      const typeRoll = Math.random();

      if (!hasSafePlatform && isLastInTier) {
        if (typeRoll < 0.30) {
          type = 'moving';
          vx = (Math.random() < 0.5 ? 1 : -1) * P_MOVING_SPEED;
        } else {
          type = 'normal';
        }
        hasSafePlatform = true;
      } else {
        if (typeRoll < 0.18 && selectedZones.length > 1) {
          type = 'breakable';
        } else if (typeRoll < 0.40) {
          type = 'moving';
          vx = (Math.random() < 0.5 ? 1 : -1) * P_MOVING_SPEED;
          hasSafePlatform = true;
        } else {
          type = 'normal';
          hasSafePlatform = true;
        }
      }

      const platformData = {
        x,
        y: highestY + yOffset,
        width,
        height: P_HEIGHT,
        type,
      };

      if (type === 'moving') {
        platformData.vx = vx;
        if (isSinglePlatformTier) {
          platformData.minX = 40;
          platformData.maxX = SCREEN_WIDTH - 40;
        } else {
          platformData.minX = zone.minX;
          platformData.maxX = zone.maxX;
        }
      } else if (type === 'breakable') {
        platformData.isTriggered = false;
        platformData.countdown = BREAKABLE_COUNTDOWN; // Lấy từ index.js
        platformData.broken = false;
        platformData.brokenTimer = 0;
      }

      world.platforms.push(platformData);
    }
  }
}

// =============================================================================
// 3. CẬP NHẬT CHUYỂN ĐỘNG BỆ & ĐẾM NGƯỢC BỆ VỠ (UPDATE WORLD PLATFORMS)
// =============================================================================
export function updateWorldPlatforms(world, dt) {
  for (let i = 0; i < world.platforms.length; i++) {
    const p = world.platforms[i];

    // Xử lý Bệ di chuyển (moving)
    if (p.type === 'moving') {
      p.x += (p.vx || P_MOVING_SPEED) * dt;

      const boundaryMin = p.minX !== undefined ? p.minX : 20;
      const boundaryMax = p.maxX !== undefined ? p.maxX : (SCREEN_WIDTH - 20);

      // Lớp 1: Kiểm tra biên giới hạn hành lang tuần tra
      if (p.x <= boundaryMin) {
        p.x = boundaryMin;
        p.vx = Math.abs(p.vx || P_MOVING_SPEED);
      } else if (p.x + p.width >= boundaryMax) {
        p.x = boundaryMax - p.width;
        p.vx = -Math.abs(p.vx || P_MOVING_SPEED);
      }

      // Lớp 2: Kiểm tra va chạm với các bệ khác cùng độ cao
      for (let j = 0; j < world.platforms.length; j++) {
        if (i === j) continue;
        const other = world.platforms[j];
        if (other.broken) continue;

        if (Math.abs(p.y - other.y) < 20) {
          // Chạm mép trái bệ other
          if (p.vx > 0 && p.x + p.width >= other.x - PLATFORM_SAFE_GAP && p.x < other.x) {
            p.x = other.x - p.width - PLATFORM_SAFE_GAP;
            p.vx = -Math.abs(p.vx || P_MOVING_SPEED);
            if (other.type === 'moving' && other.vx < 0) {
              other.vx = Math.abs(other.vx || P_MOVING_SPEED);
            }
          }
          // Chạm mép phải bệ other
          else if (p.vx < 0 && p.x <= other.x + other.width + PLATFORM_SAFE_GAP && p.x > other.x) {
            p.x = other.x + other.width + PLATFORM_SAFE_GAP;
            p.vx = Math.abs(p.vx || P_MOVING_SPEED);
            if (other.type === 'moving' && other.vx > 0) {
              other.vx = -Math.abs(other.vx || P_MOVING_SPEED);
            }
          }
        }
      }
    }
    // Xử lý Bệ vỡ (breakable)
    else if (p.type === 'breakable') {
      if (p.isTriggered && !p.broken) {
        // Đang đếm ngược BREAKABLE_COUNTDOWN sau khi chạm chân
        p.countdown = (p.countdown ?? BREAKABLE_COUNTDOWN) - dt;
        if (p.countdown <= 0) {
          p.countdown = 0;
          p.broken = true; // Hết giờ: bệ vỡ tan!
          p.brokenY = p.y;
          p.brokenTimer = 0;
        }
      } else if (p.broken) {
        // Hiệu ứng rơi rụng và tan biến
        p.brokenTimer = (p.brokenTimer || 0) + dt * 1000;
        p.brokenY = (p.brokenY || p.y) + 360 * dt;
      }
    }
  }

  // Dọn dẹp bệ vỡ sau khi tan biến hết DISAPPEAR_DELAY
  world.platforms = world.platforms.filter(p => {
    if (p.type === 'breakable' && p.broken) {
      return (p.brokenTimer || 0) < DISAPPEAR_DELAY;
    }
    return true;
  });
}

// =============================================================================
// 4. CUỘN CAMERA THẾ GIỚI (SCROLL WORLD)
// =============================================================================
export function scrollWorld(world, scrollAmount) {
  world.score += scrollAmount;
  world.maxScore = Math.max(world.maxScore, world.score);

  for (let i = 0; i < world.platforms.length; i++) {
    world.platforms[i].y += scrollAmount;
    if (world.platforms[i].brokenY !== undefined) {
      world.platforms[i].brokenY += scrollAmount;
    }
  }

  // Dọn dẹp các bệ đã trôi ra khỏi đáy màn hình theo PLATFORM_CLEANUP_OFFSET
  world.platforms = world.platforms.filter(p => p.y <= SCREEN_HEIGHT + PLATFORM_CLEANUP_OFFSET);
}
