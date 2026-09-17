// frontend/src/game/bots.js
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  MAX_VX,
  JUMP_VELOCITY,
  BOT_WIDTH,
  BOT_HEIGHT,
  BOT_ACCEL,
  BOT_PROFILES,
} from './index.js';
import { getBotSprite } from './render.js';

// Tái xuất khẩu BOT_PROFILES để các module khác nếu cần vẫn import được từ bots.js
export { BOT_PROFILES };

// =============================================================================
// 1. KHỞI TẠO BOT - XUẤT PHÁT CÙNG LÚC VỚI NGƯỜI CHƠI
// =============================================================================
export function createBot(typeKey, startX, startY) {
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
    vy: -JUMP_VELOCITY, // Xuất phát bật nhảy ngay lập tức cùng lúc với người chơi!
    isDead: false,
    direction: 'right',
    image: getBotSprite(typeKey, 'right'),
    progress: 0,

    // Trạng thái AI
    profile,
    targetPlatform: null,
    targetOffsetX: currentAimOffset,
    lastPlatformY: startY + BOT_HEIGHT,
    reactionTimer: profile.reactionDelay || 0,
  };
}

// =============================================================================
// 2. TÌM KIẾM BỆ ĐỠ MỤC TIÊU TRÊN KHUNG HÌNH (DỰA THEO SCREEN_WIDTH TỪ INDEX.JS)
// =============================================================================
export function findTargetPlatform(bot, platforms, allBots = []) {
  const botCenterX = bot.x + bot.width / 2;
  const currentY = bot.lastPlatformY || (bot.y + bot.height);
  const maxReach = bot.profile.maxJumpReach || 178;

  // Ưu tiên 1: Nếu bot đang rơi xuống (vy > 0), tìm ngay bệ đỡ khả thi phía dưới chân để tiếp đất an toàn
  if (bot.vy > 0) {
    const catchPlatforms = platforms.filter(p => !p.broken && p.y >= bot.y + bot.height - 15 && p.y <= bot.y + bot.height + 180);
    if (catchPlatforms.length > 0) {
      catchPlatforms.sort((a, b) => {
        const aDx = Math.min(Math.abs(a.x + a.width / 2 - botCenterX), SCREEN_WIDTH - Math.abs(a.x + a.width / 2 - botCenterX));
        const bDx = Math.min(Math.abs(b.x + b.width / 2 - botCenterX), SCREEN_WIDTH - Math.abs(b.x + b.width / 2 - botCenterX));
        return aDx - bDx;
      });
      return catchPlatforms[0];
    }
  }

  // Lấy tất cả bệ chưa bị vỡ trong tầm nảy tối đa (bệ vỡ chưa gãy coi như bệ thường)
  const reachableAbove = platforms.filter(p => {
    if (p.broken) return false;
    const dy = currentY - p.y;
    if (dy < 30 || dy > maxReach) return false;

    // Tính khoảng cách ngang ngắn nhất (tính cả cơ chế wrap hai mép màn hình)
    const directDx = (p.x + p.width / 2) - botCenterX;
    const wrapDx = directDx > 0 ? directDx - SCREEN_WIDTH : directDx + SCREEN_WIDTH;
    const chosenDx = Math.min(Math.abs(directDx), Math.abs(wrapDx));

    // Bệ càng cao (dy lớn) thì khoảng cách ngang chosenDx phải càng nằm trong giới hạn thực tế có thể bay tới được
    const maxAllowedDx = Math.max(65, SCREEN_WIDTH * 0.44 - (Math.max(0, dy - 110) * 0.9));
    return chosenDx <= maxAllowedDx;
  });

  if (reachableAbove.length > 0) {
    // Tách các bệ bậc 2 (nhảy vượt 2 bậc)
    const tier2Platforms = reachableAbove.filter(p => {
      const dy = currentY - p.y;
      if (dy < 110) return false;

      // Khoảng cách ngang ngắn nhất (có tính xuyên màn hình SCREEN_WIDTH)
      const directDx = (p.x + p.width / 2) - botCenterX;
      const wrapDx = directDx > 0 ? directDx - SCREEN_WIDTH : directDx + SCREEN_WIDTH;
      const chosenDx = Math.min(Math.abs(directDx), Math.abs(wrapDx));
      return chosenDx <= SCREEN_WIDTH * 0.32;
    });

    // Chỉ nhảy vượt 2 bậc khi đã rời khỏi bệ xuất phát và có trớn (không nhảy ẩu lúc vừa vào game)
    const isPastStart = currentY < 430;
    const shouldAttemptSkipJump = isPastStart && tier2Platforms.length > 0 && Math.random() < (bot.profile.skipJumpChance || 0);

    // Chiến lược nhảy vượt 2 bậc
    if (shouldAttemptSkipJump) {
      if (bot.profile.strategy === 'highest_aggressive') {
        tier2Platforms.sort((a, b) => {
          const aDx = Math.min(Math.abs(a.x + a.width / 2 - botCenterX), SCREEN_WIDTH - Math.abs(a.x + a.width / 2 - botCenterX));
          const bDx = Math.min(Math.abs(b.x + b.width / 2 - botCenterX), SCREEN_WIDTH - Math.abs(b.x + b.width / 2 - botCenterX));
          const scoreA = (currentY - a.y) - (aDx * 0.30);
          const scoreB = (currentY - b.y) - (bDx * 0.30);
          return scoreB - scoreA;
        });
        return tier2Platforms[0];
      }

      return tier2Platforms.reduce((best, curr) => {
        const cDx = Math.min(
          Math.abs(curr.x + curr.width / 2 - botCenterX),
          SCREEN_WIDTH - Math.abs(curr.x + curr.width / 2 - botCenterX)
        );
        const bDx = Math.min(
          Math.abs(best.x + best.width / 2 - botCenterX),
          SCREEN_WIDTH - Math.abs(best.x + best.width / 2 - botCenterX)
        );
        return cDx < bDx ? curr : best;
      });
    }

    // Chiến lược nhảy 1 bậc tiêu chuẩn
    if (bot.profile.strategy === 'highest_aggressive') {
      reachableAbove.sort((a, b) => {
        const aDx = Math.min(Math.abs(a.x + a.width / 2 - botCenterX), SCREEN_WIDTH - Math.abs(a.x + a.width / 2 - botCenterX));
        const bDx = Math.min(Math.abs(b.x + b.width / 2 - botCenterX), SCREEN_WIDTH - Math.abs(b.x + b.width / 2 - botCenterX));
        const scoreA = (currentY - a.y) - (aDx * 0.30);
        const scoreB = (currentY - b.y) - (bDx * 0.30);
        return scoreB - scoreA;
      });
      return reachableAbove[0];
    }

    if (bot.profile.strategy === 'optimal_uncontested' && reachableAbove.length > 1) {
      const otherTargets = new Set(
        allBots
          .filter(b => b !== bot && b.targetPlatform)
          .map(b => b.targetPlatform)
      );
      const uncontested = reachableAbove.filter(p => !otherTargets.has(p));
      const pool = uncontested.length > 0 ? uncontested : reachableAbove;

      return pool.reduce((best, curr) => {
        const cDx = Math.min(
          Math.abs(curr.x + curr.width / 2 - botCenterX),
          SCREEN_WIDTH - Math.abs(curr.x + curr.width / 2 - botCenterX)
        );
        const bDx = Math.min(
          Math.abs(best.x + best.width / 2 - botCenterX),
          SCREEN_WIDTH - Math.abs(best.x + best.width / 2 - botCenterX)
        );
        return cDx < bDx ? curr : best;
      });
    }

    if (bot.profile.strategy === 'nearest_wide') {
      reachableAbove.sort((a, b) => {
        const aDx = Math.abs(a.x + a.width / 2 - botCenterX);
        const bDx = Math.abs(b.x + b.width / 2 - botCenterX);
        return (aDx - a.width * 0.4) - (bDx - b.width * 0.4);
      });
      return reachableAbove[0];
    }

    return reachableAbove.reduce((best, curr) => {
      const cDx = Math.min(
        Math.abs(curr.x + curr.width / 2 - botCenterX),
        SCREEN_WIDTH - Math.abs(curr.x + curr.width / 2 - botCenterX)
      );
      const bDx = Math.min(
        Math.abs(best.x + best.width / 2 - botCenterX),
        SCREEN_WIDTH - Math.abs(best.x + best.width / 2 - botCenterX)
      );
      return cDx < bDx ? curr : best;
    });
  }

  // Dự phòng: Lấy bệ phía trên gần nhất nếu có
  const allAbove = platforms.filter(p => !p.broken && p.y < currentY - 20);
  if (allAbove.length > 0) {
    allAbove.sort((a, b) => b.y - a.y);
    return allAbove[0];
  }

  // Dự phòng: Tìm bệ bên dưới nếu đang rơi cấp cứu
  const allBelow = platforms.filter(p => !p.broken && p.y >= bot.y + bot.height);
  if (allBelow.length > 0) {
    allBelow.sort((a, b) => a.y - b.y);
    return allBelow[0];
  }

  return platforms.find(p => !p.broken) || platforms[0] || null;
}

// =============================================================================
// 3. CẬP NHẬT AI CỦA BOT (CHẠY MỖI FRAME)
// =============================================================================
export function updateBotAI(bot, platforms, dt, allBots = [], player = null) {
  if (bot.isDead) return;

  // Tính tốc độ ngang cơ bản từ profile
  let speedMult = bot.profile.speedMultiplier;

  // Cơ chế Cân bằng đường đua (Catch-up / Rubber-banding):
  if (player && !player.isDead) {
    // 1. Khi Bot dẫn trước người chơi quá xa (> 120px): Bot thận trọng hơn, giảm tốc nhẹ để người chơi bắt kịp
    if (bot.y < player.y - 120) {
      speedMult *= 0.85;
    }
    // 2. Khi Người chơi vượt lên dẫn trước Bot (> 80px): Bot tăng tốc bám đuổi để cuộc đua luôn sát nút
    else if (bot.y > player.y + 80) {
      speedMult = Math.min(1.0, speedMult * 1.18);
    }
    // 3. Khi Bot bị đẩy xuống mép đáy màn hình: Tăng tốc cấp cứu để kịp tiếp đất
    else if (bot.y > SCREEN_HEIGHT - 100 && bot.vy > 0) {
      speedMult = Math.min(1.0, speedMult * 1.25);
    }
  }

  const maxVx = MAX_VX * speedMult;

  // Đếm ngược thời gian phản xạ / ngập ngừng
  if (bot.reactionTimer > 0) {
    bot.reactionTimer -= dt;
    if (bot.reactionTimer > 0) {
      bot.image = getBotSprite(bot.type, bot.direction);
      return;
    }
  }

  // Làm mới bệ mục tiêu nếu chưa có, hoặc bệ cũ đã trôi khỏi màn hình, hoặc bệ cũ đã bị vỡ
  if (!bot.targetPlatform || bot.targetPlatform.y > SCREEN_HEIGHT + 20 || bot.targetPlatform.broken) {
    bot.targetPlatform = findTargetPlatform(bot, platforms, allBots);
  }

  // Di chuyển về phía bệ mục tiêu với gia tốc mượt mà BOT_ACCEL
  if (bot.targetPlatform) {
    const targetCenterX = bot.targetPlatform.x + bot.targetPlatform.width / 2 + (bot.targetOffsetX || 0);
    const botCenterX = bot.x + bot.width / 2;

    const directDx = targetCenterX - botCenterX;
    const wrapDx = directDx > 0 ? directDx - SCREEN_WIDTH : directDx + SCREEN_WIDTH;
    const chosenDx = Math.abs(directDx) <= Math.abs(wrapDx) ? directDx : wrapDx;

    const absDx = Math.abs(chosenDx);
    if (absDx > 6) {
      // Khi ở xa: max ga. Khi ở gần (dưới 42px): hãm phanh tỉ lệ để bot đáp êm trúng giữa bệ, không vọt lố quán tính
      const speedFactor = absDx < 42 ? Math.max(0.35, absDx / 42) : 1.0;
      const targetVx = (chosenDx > 0 ? maxVx : -maxVx) * speedFactor;

      // Gia tốc mượt mà lấy trực tiếp từ BOT_ACCEL ở index.js
      if (bot.vx < targetVx) {
        bot.vx = Math.min(targetVx, bot.vx + BOT_ACCEL * dt);
      } else if (bot.vx > targetVx) {
        bot.vx = Math.max(targetVx, bot.vx - BOT_ACCEL * dt);
      }
      bot.direction = bot.vx >= 0 ? 'right' : 'left';
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
    bot.lastPlatformY = bot.y + bot.height;
  }

  bot.targetPlatform = null;
  bot.reactionTimer = bot.profile.reactionDelay || 0;

  if (bot.profile.aimOffset > 0) {
    bot.targetOffsetX = (Math.random() * 2 - 1) * bot.profile.aimOffset;
  }
}
