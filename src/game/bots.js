// frontend/src/game/bots.js
// MODULE TRÍ TUỆ NHÂN TẠO CỦA 4 BOT ĐỐI THỦ (BOT AI ENGINE)

import {
  SCREEN_WIDTH,
  MAX_VX,
  JUMP_VELOCITY,
  BOT_WIDTH,
  BOT_HEIGHT,
  BOT_ACCEL,
  BOT_PROFILES,
} from './index.js';

import { getBotSprite } from './render.js';

export { BOT_PROFILES };

// =============================================================================
// 1. KHỞI TẠO BOT - XUẤT PHÁT CÙNG LÚC VỚI NGƯỜI CHƠI
// Hệ tọa độ: Vị trí ban đầu là mặt bệ xuất phát (y = 0).
// vy dương (> 0) là bay lên, vy âm (< 0) là rơi xuống.
// =============================================================================
export function createBot(typeKey, startX, startY = 0) {
  const profile = BOT_PROFILES[typeKey] || BOT_PROFILES.STANDARD;

  const randomSide = Math.random() < 0.5 ? -1 : 1;
  const currentAimOffset = (profile.aimOffset || 0) * randomSide;

  return {
    type: typeKey,
    x: startX,
    y: startY,
    width: BOT_WIDTH,
    height: BOT_HEIGHT,
    vx: 0,
    vy: JUMP_VELOCITY, // Xuất phát bật nhảy dương bay lên ngay lập tức!
    isDead: false,
    direction: 'right',
    image: getBotSprite(typeKey, 'right'),
    progress: 0,

    // Trạng thái AI
    profile,
    targetPlatform: null,
    targetOffsetX: currentAimOffset,
    lastPlatformY: startY,
    reactionTimer: profile.reactionDelay || 0,
  };
}

// =============================================================================
// 2. TÌM KIẾM BỆ ĐỠ MỤC TIÊU TRÊN KHUNG HÌNH (TARGET PLATFORM SELECTION)
// =============================================================================
export function findTargetPlatform(bot, platforms, allBots = []) {
  const botCenterX = bot.x;
  const currentY = bot.lastPlatformY !== undefined ? bot.lastPlatformY : bot.y;
  const maxReach = bot.profile.maxJumpReach || 178;

  // Ưu tiên 1: Nếu bot đang rơi xuống (vy < 0), tìm ngay bệ an toàn phía dưới chân để tiếp đất
  if (bot.vy < 0) {
    const catchAll = platforms.filter((p) => {
      if (p.broken) {
        return false;
      }
      return p.y <= bot.y + 15 && p.y >= bot.y - 180;
    });

    const safeCatch = catchAll.filter((p) => {
      return p.type === 'normal' || p.type === 'moving';
    });

    const mistakeChance = bot.profile.breakableMistakeChance ?? 0.008;
    const isChoosingSafe = safeCatch.length > 0 && Math.random() >= mistakeChance;
    const catchPool = isChoosingSafe ? safeCatch : catchAll;

    if (catchPool.length > 0) {
      catchPool.sort((a, b) => {
        const aDx = Math.min(Math.abs(a.x - botCenterX), SCREEN_WIDTH - Math.abs(a.x - botCenterX));
        const bDx = Math.min(Math.abs(b.x - botCenterX), SCREEN_WIDTH - Math.abs(b.x - botCenterX));
        return aDx - bDx;
      });
      return catchPool[0];
    }
  }

  // Lọc tất cả bệ chưa bị vỡ trong tầm nhảy tới được (p.y > currentY)
  const reachableAbove = platforms.filter((p) => {
    if (p.broken) {
      return false;
    }

    const dy = p.y - currentY;
    if (dy < 30) {
      return false;
    }
    if (dy > maxReach) {
      return false;
    }

    // Tính khoảng cách ngang ngắn nhất (tính cả cơ chế xuyên màn hình)
    const directDx = p.x - botCenterX;
    const wrapDx = directDx > 0 ? directDx - SCREEN_WIDTH : directDx + SCREEN_WIDTH;
    const chosenDx = Math.min(Math.abs(directDx), Math.abs(wrapDx));

    // Giới hạn tầm ngang hợp lý theo chiều cao bệ
    const maxAllowedDx = Math.max(65, SCREEN_WIDTH * 0.44 - (Math.max(0, dy - 110) * 0.9));
    return chosenDx <= maxAllowedDx;
  });

  // Phân loại: Ưu tiên bệ an toàn (normal, moving), tỉ lệ sơ suất thấp đối với bệ vỡ
  const safePlatforms = reachableAbove.filter((p) => {
    return p.type === 'normal' || p.type === 'moving';
  });

  const breakablePlatforms = reachableAbove.filter((p) => {
    return p.type === 'breakable';
  });

  const mistakeChance = bot.profile.breakableMistakeChance ?? 0.008;
  const isMistake = breakablePlatforms.length > 0 && Math.random() < mistakeChance;

  let targetPool = [];
  if (isMistake) {
    targetPool = breakablePlatforms;
  } else if (safePlatforms.length > 0) {
    targetPool = safePlatforms;
  } else {
    targetPool = reachableAbove;
  }

  if (targetPool.length > 0) {
    // Tách các bệ bậc 2 (nhảy vượt 2 bậc)
    const tier2Platforms = targetPool.filter((p) => {
      const dy = p.y - currentY;
      if (dy < 110) {
        return false;
      }

      const directDx = p.x - botCenterX;
      const wrapDx = directDx > 0 ? directDx - SCREEN_WIDTH : directDx + SCREEN_WIDTH;
      const chosenDx = Math.min(Math.abs(directDx), Math.abs(wrapDx));
      return chosenDx <= SCREEN_WIDTH * 0.32;
    });

    // Chỉ nhảy vượt bậc khi đã rời khỏi bệ xuất phát
    const isPastStart = currentY > 50;
    const canAttemptSkip = isPastStart && tier2Platforms.length > 0;
    const shouldAttemptSkipJump = canAttemptSkip && Math.random() < (bot.profile.skipJumpChance || 0);

    // Chiến lược nhảy vượt 2 bậc
    if (shouldAttemptSkipJump) {
      if (bot.profile.strategy === 'highest_aggressive') {
        tier2Platforms.sort((a, b) => {
          const aDx = Math.min(Math.abs(a.x - botCenterX), SCREEN_WIDTH - Math.abs(a.x - botCenterX));
          const bDx = Math.min(Math.abs(b.x - botCenterX), SCREEN_WIDTH - Math.abs(b.x - botCenterX));
          const scoreA = (a.y - currentY) - (aDx * 0.30);
          const scoreB = (b.y - currentY) - (bDx * 0.30);
          return scoreB - scoreA;
        });
        return tier2Platforms[0];
      }

      return tier2Platforms.reduce((best, curr) => {
        const cDx = Math.min(Math.abs(curr.x - botCenterX), SCREEN_WIDTH - Math.abs(curr.x - botCenterX));
        const bDx = Math.min(Math.abs(best.x - botCenterX), SCREEN_WIDTH - Math.abs(best.x - botCenterX));
        return cDx < bDx ? curr : best;
      });
    }

    // Chiến lược nhảy 1 bậc tiêu chuẩn
    if (bot.profile.strategy === 'highest_aggressive') {
      targetPool.sort((a, b) => {
        const aDx = Math.min(Math.abs(a.x - botCenterX), SCREEN_WIDTH - Math.abs(a.x - botCenterX));
        const bDx = Math.min(Math.abs(b.x - botCenterX), SCREEN_WIDTH - Math.abs(b.x - botCenterX));
        const scoreA = (a.y - currentY) - (aDx * 0.30);
        const scoreB = (b.y - currentY) - (bDx * 0.30);
        return scoreB - scoreA;
      });
      return targetPool[0];
    }

    if (bot.profile.strategy === 'optimal_uncontested' && targetPool.length > 1) {
      const otherTargets = new Set(
        allBots
          .filter((b) => b !== bot && b.targetPlatform)
          .map((b) => b.targetPlatform)
      );
      const uncontested = targetPool.filter((p) => !otherTargets.has(p));
      const pool = uncontested.length > 0 ? uncontested : targetPool;

      return pool.reduce((best, curr) => {
        const cDx = Math.min(Math.abs(curr.x - botCenterX), SCREEN_WIDTH - Math.abs(curr.x - botCenterX));
        const bDx = Math.min(Math.abs(best.x - botCenterX), SCREEN_WIDTH - Math.abs(best.x - botCenterX));
        return cDx < bDx ? curr : best;
      });
    }

    if (bot.profile.strategy === 'nearest_wide') {
      targetPool.sort((a, b) => {
        const aDx = Math.abs(a.x - botCenterX);
        const bDx = Math.abs(b.x - botCenterX);
        return (aDx - a.width * 0.4) - (bDx - b.width * 0.4);
      });
      return targetPool[0];
    }

    return targetPool.reduce((best, curr) => {
      const cDx = Math.min(Math.abs(curr.x - botCenterX), SCREEN_WIDTH - Math.abs(curr.x - botCenterX));
      const bDx = Math.min(Math.abs(best.x - botCenterX), SCREEN_WIDTH - Math.abs(best.x - botCenterX));
      return cDx < bDx ? curr : best;
    });
  }

  // Dự phòng: Lấy bệ phía trên gần nhất nếu có
  const allAbove = platforms.filter((p) => {
    return !p.broken && p.y > currentY + 20;
  });
  if (allAbove.length > 0) {
    allAbove.sort((a, b) => a.y - b.y);
    return allAbove[0];
  }

  // Dự phòng: Tìm bệ bên dưới nếu đang rơi cấp cứu
  const allBelow = platforms.filter((p) => {
    return !p.broken && p.y <= bot.y;
  });
  if (allBelow.length > 0) {
    allBelow.sort((a, b) => b.y - a.y);
    return allBelow[0];
  }

  const firstUnbroken = platforms.find((p) => !p.broken);
  if (firstUnbroken) {
    return firstUnbroken;
  }
  if (platforms.length > 0) {
    return platforms[0];
  }

  return null;
}

// =============================================================================
// 3. CẬP NHẬT AI CỦA BOT (CHẠY MỖI FRAME)
// =============================================================================
export function updateBotAI(bot, platforms, dt, allBots = [], player = null, cameraY = 0, lavaY = -999) {
  if (bot.isDead) {
    return;
  }

  // Tốc độ ngang cơ bản theo hồ sơ cá nhân (không rubber-banding)
  const speedMult = bot.profile.speedMultiplier;
  const maxVx = MAX_VX * speedMult;

  // Đếm ngược thời gian phản xạ / ngập ngừng
  if (bot.reactionTimer > 0) {
    bot.reactionTimer -= dt;
    if (bot.reactionTimer > 0) {
      bot.image = getBotSprite(bot.type, bot.direction);
      return;
    }
  }

  // Làm mới bệ mục tiêu nếu chưa có hoặc bệ cũ đã chìm vào dung nham / bị vỡ
  const hasNoTarget = !bot.targetPlatform;
  const isTargetInLava = bot.targetPlatform && bot.targetPlatform.y <= lavaY;
  const isTargetBroken = bot.targetPlatform && bot.targetPlatform.broken;

  if (hasNoTarget || isTargetInLava || isTargetBroken) {
    bot.targetPlatform = findTargetPlatform(bot, platforms, allBots);
  }

  // Di chuyển về phía bệ mục tiêu với gia tốc mượt mà BOT_ACCEL
  if (bot.targetPlatform) {
    const targetCenterX = bot.targetPlatform.x + (bot.targetOffsetX || 0);
    const botCenterX = bot.x;

    const directDx = targetCenterX - botCenterX;
    const wrapDx = directDx > 0 ? directDx - SCREEN_WIDTH : directDx + SCREEN_WIDTH;
    const chosenDx = Math.abs(directDx) <= Math.abs(wrapDx) ? directDx : wrapDx;

    const absDx = Math.abs(chosenDx);
    if (absDx > 6) {
      const speedFactor = absDx < 42 ? Math.max(0.35, absDx / 42) : 1.0;
      const targetVx = (chosenDx > 0 ? maxVx : -maxVx) * speedFactor;

      if (bot.vx < targetVx) {
        bot.vx = Math.min(targetVx, bot.vx + BOT_ACCEL * dt);
      } else if (bot.vx > targetVx) {
        bot.vx = Math.max(targetVx, bot.vx - BOT_ACCEL * dt);
      }

      if (bot.vx >= 0) {
        bot.direction = 'right';
      } else {
        bot.direction = 'left';
      }
    } else {
      if (Math.abs(bot.vx) > 20) {
        bot.vx *= 0.75;
      } else {
        bot.vx = 0;
      }
    }
  }

  // Cập nhật sprite ảnh
  bot.image = getBotSprite(bot.type, bot.direction);
}

// =============================================================================
// 4. XỬ LÝ KHI BOT TIẾP ĐẤT VÀ BẬT NẢY LÊN
// =============================================================================
export function onBotBounce(bot, platform = null) {
  if (platform) {
    bot.lastPlatformY = platform.y;
  } else {
    bot.lastPlatformY = bot.y;
  }

  bot.targetPlatform = null;
  bot.reactionTimer = bot.profile.reactionDelay || 0;

  if (bot.profile.aimOffset > 0) {
    bot.targetOffsetX = (Math.random() * 2 - 1) * bot.profile.aimOffset;
  }
}
