// frontend/src/game/world.js
// MODULE QUẢN LÝ THẾ GIỚI GAME, BỆ ĐỠ & DUNG NHAM

import {
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
  LAVA_INITIAL_Y,
  LAVA_SPEED,
  LAVA_CLEANUP_OFFSET,
} from './index.js';

// =============================================================================
// 1. TẠO DANH SÁCH BỆ XUẤT PHÁT (DEFAULT INITIAL PLATFORMS)
// Hệ tọa độ: Điểm gốc (0,0) tại vị trí xuất phát của Player.
// Trục X: 0 là tâm ngang, trải từ -SCREEN_WIDTH/2 (-480) đến +SCREEN_WIDTH/2 (+480).
// Trục Y: y = 0 là bệ xuất phát. Các bệ bên trên có y > 0 tăng dần.
// =============================================================================
export function getDefaultPlatforms() {
  const startW = PLATFORM_START_WIDTH;
  const h = P_HEIGHT;
  const speed = P_MOVING_SPEED;

  return [
    // Vạch xuất phát đáy (y = 0): 3 bệ song song công bằng cho cả 5 tay đua
    { x: -280, y: 0, width: 75, height: h, type: 'normal' },
    { x: 0, y: 0, width: startW, height: h, type: 'normal' },
    { x: 280, y: 0, width: 75, height: h, type: 'normal' },

    // Tầng 1: y = 85 (3 nhánh trải đều)
    { x: -300, y: 85, width: 75, height: h, type: 'normal' },
    { x: 0, y: 95, width: 75, height: h, type: 'normal' },
    { x: 300, y: 85, width: 75, height: h, type: 'normal' },

    // Tầng 2: y = 175 (Bệ di chuyển ở giữa)
    { x: -290, y: 175, width: 72, height: h, type: 'normal' },
    {
      x: 0,
      y: 180,
      width: 74,
      height: h,
      type: 'moving',
      vx: speed,
      minX: -160,
      maxX: 160,
    },
    { x: 310, y: 175, width: 70, height: h, type: 'normal' },

    // Tầng 3: y = 260
    { x: -320, y: 260, width: 74, height: h, type: 'normal' },
    { x: -70, y: 265, width: 76, height: h, type: 'normal' },
    { x: 260, y: 260, width: 72, height: h, type: 'normal' },

    // Tầng 4: y = 345 (Bệ di chuyển tuần tra an toàn)
    { x: -300, y: 345, width: 70, height: h, type: 'normal' },
    {
      x: 0,
      y: 350,
      width: 74,
      height: h,
      type: 'moving',
      vx: -speed,
      minX: -180,
      maxX: 180,
    },
    { x: 320, y: 345, width: 72, height: h, type: 'normal' },

    // Tầng 5: y = 435
    { x: -320, y: 435, width: 75, height: h, type: 'normal' },
    { x: -80, y: 440, width: 72, height: h, type: 'normal' },
    { x: 250, y: 435, width: 74, height: h, type: 'normal' },

    // Tầng 6: y = 525
    { x: -180, y: 525, width: 72, height: h, type: 'normal' },
    { x: 100, y: 530, width: 75, height: h, type: 'normal' },
    { x: 340, y: 525, width: 70, height: h, type: 'normal' },
  ];
}

export function createWorld(initialPlatforms = null) {
  const platforms = initialPlatforms ? initialPlatforms : getDefaultPlatforms();

  return {
    platforms: platforms.map((p) => ({ ...p })),
    cameraY: 0, // Độ cao camera trong hệ tọa độ thế giới (bắt đầu từ 0)
    score: 0,
    maxScore: 0,
    sightLine: 217, // Khi player.y vượt quá cameraY + 217 thì camera cuộn theo
    lava: {
      y: LAVA_INITIAL_Y,
      speed: LAVA_SPEED,
    },
  };
}

// Cập nhật mực dung nham dâng lên theo thời gian
export function updateLava(world, dt) {
  if (!world) {
    return;
  }
  if (!world.lava) {
    return;
  }

  const speed = world.lava.speed || LAVA_SPEED;
  world.lava.y += speed * dt;
}

// =============================================================================
// 2. THUẬT TOÁN SINH BỆ PHÍA TRƯỚC (ENSURE PLATFORMS AHEAD)
// =============================================================================
export function ensurePlatformsAhead(world, targetMaxY) {
  let highestY = 0;
  if (world.platforms.length > 0) {
    highestY = Math.max(...world.platforms.map((p) => p.y));
  }

  while (highestY < targetMaxY) {
    // Bước nhảy dọc ngẫu nhiên từ STEP_Y_MIN đến STEP_Y_MAX
    highestY += STEP_Y_MIN + Math.random() * (STEP_Y_MAX - STEP_Y_MIN);

    // 3 vùng phân bổ ngang đối xứng quanh tâm 0 (-SCREEN_WIDTH/2 đến +SCREEN_WIDTH/2)
    const zoneLeft = {
      minX: -440,
      maxX: -180,
    };
    const zoneMid = {
      minX: -130,
      maxX: 130,
    };
    const zoneRight = {
      minX: 180,
      maxX: 440,
    };

    const rand = Math.random();
    let selectedZones = [];

    if (rand < 0.45) {
      selectedZones = [zoneLeft, zoneMid, zoneRight];
    } else if (rand < 0.75) {
      selectedZones = [zoneLeft, zoneRight];
    } else if (rand < 0.90) {
      if (Math.random() < 0.5) {
        selectedZones = [zoneLeft, zoneMid];
      } else {
        selectedZones = [zoneMid, zoneRight];
      }
    } else {
      selectedZones = [zoneMid];
    }

    let hasSafePlatform = false;

    // Tạo bệ cho các vùng được chọn
    for (let i = 0; i < selectedZones.length; i++) {
      const zone = selectedZones[i];
      const isLastInTier = (i === selectedZones.length - 1);
      const isSinglePlatformTier = (selectedZones.length === 1);
      const width = Math.floor(P_WIDTH_MIN + Math.random() * (P_WIDTH_MAX - P_WIDTH_MIN));
      const minCenter = zone.minX + width / 2;
      const maxCenter = zone.maxX - width / 2;
      const x = Math.floor(minCenter + Math.random() * Math.max(10, maxCenter - minCenter));
      const yOffset = Math.floor(Math.random() * 10 - 5);

      // Ngẫu nhiên chọn loại bệ
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
        x: x,
        y: highestY + yOffset,
        width: width,
        height: P_HEIGHT,
        type: type,
      };

      if (type === 'moving') {
        platformData.vx = vx;
        if (isSinglePlatformTier) {
          platformData.minX = -400;
          platformData.maxX = 400;
        } else {
          platformData.minX = zone.minX;
          platformData.maxX = zone.maxX;
        }
      } else if (type === 'breakable') {
        platformData.isTriggered = false;
        platformData.countdown = BREAKABLE_COUNTDOWN;
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

      const boundaryMin = p.minX !== undefined ? p.minX : -440;
      const boundaryMax = p.maxX !== undefined ? p.maxX : 440;

      // Lớp 1: Kiểm tra biên giới hạn hành lang tuần tra
      if (p.x - p.width / 2 <= boundaryMin) {
        p.x = boundaryMin + p.width / 2;
        p.vx = Math.abs(p.vx || P_MOVING_SPEED);
      } else if (p.x + p.width / 2 >= boundaryMax) {
        p.x = boundaryMax - p.width / 2;
        p.vx = -Math.abs(p.vx || P_MOVING_SPEED);
      }

      // Lớp 2: Kiểm tra va chạm với các bệ khác cùng độ cao
      for (let j = 0; j < world.platforms.length; j++) {
        if (i === j) {
          continue;
        }

        const other = world.platforms[j];
        if (other.broken) {
          continue;
        }

        if (Math.abs(p.y - other.y) < 20) {
          const pLeft = p.x - p.width / 2;
          const pRight = p.x + p.width / 2;
          const oLeft = other.x - other.width / 2;
          const oRight = other.x + other.width / 2;

          // Chạm mép trái bệ other
          if (p.vx > 0 && pRight >= oLeft - PLATFORM_SAFE_GAP && pLeft < oLeft) {
            p.x = oLeft - PLATFORM_SAFE_GAP - p.width / 2;
            p.vx = -Math.abs(p.vx || P_MOVING_SPEED);

            if (other.type === 'moving' && other.vx < 0) {
              other.vx = Math.abs(other.vx || P_MOVING_SPEED);
            }
          }
          // Chạm mép phải bệ other
          else if (p.vx < 0 && pLeft <= oRight + PLATFORM_SAFE_GAP && pRight > oRight) {
            p.x = oRight + PLATFORM_SAFE_GAP + p.width / 2;
            p.vx = Math.abs(p.vx || P_MOVING_SPEED);

            if (other.type === 'moving' && other.vx > 0) {
              other.vx = -Math.abs(other.vx || P_MOVING_SPEED);
            }
          }
        }
      }
    }
    // Xử lý Bệ vỡ (breakable): Chạm vào là vỡ ngay lập tức
    else if (p.type === 'breakable') {
      if (p.broken) {
        // Hiệu ứng rơi rụng xuống vực (giảm y) và tan biến sau khi vỡ
        p.brokenTimer = (p.brokenTimer || 0) + dt * 1000;
        p.brokenY = (p.brokenY || p.y) - 380 * dt;
      }
    }
  }

  // Dọn dẹp bệ: Chỉ xóa khi bệ vỡ tan biến HOẶC Dung Nham (Lava) đã dâng qua bệ đó!
  // Nhờ đó khi người chơi leo nhanh, bệ phía dưới vẫn còn nguyên vẹn cho các bot tiếp tục leo lên.
  world.platforms = world.platforms.filter((p) => {
    if (p.type === 'breakable' && p.broken) {
      return (p.brokenTimer || 0) < DISAPPEAR_DELAY;
    }

    if (world.lava) {
      return p.y >= world.lava.y - LAVA_CLEANUP_OFFSET;
    }

    return true;
  });
}

// =============================================================================
// 4. CUỘN CAMERA THẾ GIỚI (SCROLL WORLD)
// =============================================================================
export function scrollWorld(world, scrollAmount) {
  world.cameraY += scrollAmount;
  world.score = Math.floor(world.cameraY);
  world.maxScore = Math.max(world.maxScore, world.score);
}
