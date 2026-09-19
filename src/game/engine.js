// frontend/src/game/engine.js
// TRỤC ĐIỀU PHỐI CHÍNH CỦA GAME (MAIN GAME ENGINE & LOOP)

import { createPlayer, updateHorizontal } from './player.js';
import { 
  createWorld, 
  scrollWorld, 
  ensurePlatformsAhead, 
  updateWorldPlatforms, 
  updateLava 
} from './world.js';
import { createInput } from './input.js';
import { 
  applyPhysics, 
  handleScreenWrap, 
  handlePlatformCollisions 
} from './physics.js';
import { 
  createBot, 
  updateBotAI, 
  onBotBounce 
} from './bots.js';
import { render } from './render.js';
import { getRanking } from './ranking.js';

// =============================================================================
// 1. KHỞI TẠO CÁC BOT XUẤT PHÁT CÙNG LÚC VỚI NGƯỜI CHƠI
// Hệ tọa độ: Điểm gốc (0, 0) tại vị trí xuất phát.
// vy dương (> 0) là bay lên, vy âm (< 0) là rơi xuống.
// =============================================================================
function setupBots(platforms) {
  const botConfigs = [
    { type: 'NOVICE', x: -40, y: 0 },
    { type: 'STANDARD', x: 40, y: 0 },
    { type: 'PERFECT', x: -280, y: 0 },
    { type: 'SPEEDRUNNER', x: 280, y: 0 },
  ];

  return botConfigs.map((cfg) => {
    const bot = createBot(cfg.type, cfg.x, cfg.y);
    bot.isDead = false;
    bot.lastPlatformY = cfg.y;
    bot.progress = 0;
    return bot;
  });
}

// =============================================================================
// 2. KHỞI TẠO GAME ENGINE VÀ VÒNG LẶP CHÍNH (CREATE GAME ENGINE)
// =============================================================================
export function createGame(canvas, config) {
  const context = canvas.getContext('2d');
  const input = createInput(window);

  let player = createPlayer();
  let world = createWorld();
  let bots = setupBots(world.platforms);

  const HIGH_SCORE_KEY = 'doodle_jump_high_score';
  let highScore = 0;
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    if (stored) {
      highScore = parseInt(stored, 10) || 0;
    }
  } catch (error) {
    highScore = 0;
  }

  const state = {
    player,
    world,
    bots,
    config,
    ranking: [],
    phase: 'running',
    isGameOver: false,
    isWin: false,
    finalScore: 0,
    highScore,
    elapsedMs: 0,
  };

  let lastTime = performance.now();
  let animationFrameId = null;
  let isRunning = true;

  // Khởi động lại ván chơi mới
  function restart() {
    player = createPlayer();
    world = createWorld();
    bots = setupBots(world.platforms);

    state.player = player;
    state.world = world;
    state.bots = bots;
    state.phase = 'running';
    state.isGameOver = false;
    state.isWin = false;
    state.finalScore = 0;
    state.highScore = highScore;
    state.elapsedMs = 0;

    lastTime = performance.now();
  }

  function handleCanvasClick() {
    if (state.isGameOver) {
      restart();
    }
  }

  canvas.addEventListener('click', handleCanvasClick);

  // ===========================================================================
  // VÒNG LẶP GAME LOOP (CHẠY ~60 FPS BẰNG requestAnimationFrame)
  // ===========================================================================
  function loop(currentTime) {
    if (!isRunning) {
      return;
    }

    let dt = (currentTime - lastTime) / 1000;
    if (dt > 1 / 30) {
      dt = 1 / 30;
    }
    if (dt < 0) {
      dt = 0;
    }
    lastTime = currentTime;

    if (!state.isGameOver) {
      state.elapsedMs = (state.elapsedMs || 0) + dt * 1000;

      // BƯỚC 0: Cập nhật mực Dung Nham (Lava) dâng lên và cập nhật bệ
      updateLava(world, dt);
      updateWorldPlatforms(world, dt);

      // BƯỚC 1: Luôn sinh bệ mới đón đầu đối thủ dẫn đầu lên cao
      const aliveBots = bots.filter((b) => !b.isDead);
      const activeEntities = [player, ...aliveBots];
      const topEntityY = Math.max(...activeEntities.map((e) => e.y));
      ensurePlatformsAhead(world, topEntityY + 650);

      // BƯỚC 2: Cập nhật Người chơi (Điều khiển ngang -> Vật lý -> Xuyên màn hình -> Tiếp đất bệ)
      const direction = Number(input.state.right) - Number(input.state.left);
      updateHorizontal(player, direction, dt);
      player.prevY = player.y;
      applyPhysics(player, dt);
      handleScreenWrap(player);
      handlePlatformCollisions(player, world.platforms);

      // Cập nhật điểm độ cao người chơi theo VỊ TRÍ HIỆN TẠI (Y)
      // 👉 Khi trượt chân rơi xuống, điểm độ cao và thứ hạng tụt xuống theo vị trí thực tế!
      player.progress = Math.max(0, Math.floor(player.y));
      if (player.progress > highScore) {
        highScore = player.progress;
        state.highScore = highScore;
        try {
          localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        } catch (error) {
          // Bỏ qua lỗi truy cập localStorage
        }
      }

      // BƯỚC 3: Cuộn màn hình (Camera): Bám theo người chơi khi lên cao hoặc khi rơi xuống
      const targetCameraY = player.y - world.sightLine;
      if (targetCameraY > world.cameraY) {
        const scrollAmount = targetCameraY - world.cameraY;
        scrollWorld(world, scrollAmount);
      } else if (targetCameraY < world.cameraY) {
        // Khi người chơi rơi xuống, camera hạ xuống mượt mà để luôn thấy nhân vật và thấy biển dung nham
        const lavaY = world.lava ? world.lava.y : 0;
        const minCameraY = Math.max(lavaY, 0);
        const lowerCameraY = Math.max(minCameraY, world.cameraY - 450 * dt);
        world.cameraY = Math.max(targetCameraY, lowerCameraY);
      }

      // BƯỚC 4: Cập nhật AI và Vật lý cho các Bot
      const currentLavaY = world.lava ? world.lava.y : -999;
      for (let i = 0; i < bots.length; i++) {
        const bot = bots[i];
        if (!bot.isDead) {
          updateBotAI(bot, world.platforms, dt, bots, player, world.cameraY, currentLavaY);

          bot.prevY = bot.y;
          applyPhysics(bot, dt);
          handleScreenWrap(bot);

          // Bot tiếp đất các bệ trên đường đi
          handlePlatformCollisions(bot, world.platforms, (b, p) => {
            onBotBounce(b, p);
          });

          // Cập nhật điểm độ cao của bot theo vị trí Y hiện tại
          bot.progress = Math.max(0, Math.floor(bot.y));

          // QUY TẮC SỐNG/CHẾT CỦA BOT:
          // 👉 Bot CHỈ CHẾT khi Dung Nham (Lava) dâng tới chạm vào bot!
          if (bot.y <= currentLavaY) {
            bot.isDead = true;
            bot.y = currentLavaY;
            bot.progress = Math.max(0, Math.floor(currentLavaY));
            bot.vx = 0;
            bot.vy = 0;
          }
        }
      }

      // BƯỚC 5: Kiểm tra Thua Cuộc nếu Người chơi chạm vào Dung Nham (Lava)
      // 👉 Chốt điểm và thứ hạng tại đúng vị trí Y lúc chết chạm dung nham!
      if (player.y <= currentLavaY) {
        player.isDead = true;
        player.y = currentLavaY;
        player.progress = Math.max(0, Math.floor(currentLavaY));
        state.isGameOver = true;
        state.isWin = false;
        state.phase = 'finished';
        state.finalScore = player.progress;
        state.ranking = getRanking(player, bots);
      }

      // BƯỚC 5.5: Kiểm tra CHIẾN THẮNG khi TẤT CẢ BOT ĐÃ CHẾT!
      // 👉 Nếu người chơi còn sống và tất cả bot đều đã bị dung nham loại -> THẮNG LUÔN!
      if (!state.isGameOver && bots.length > 0) {
        const allBotsDead = bots.every((b) => b.isDead);
        if (allBotsDead) {
          state.isGameOver = true;
          state.isWin = true;
          state.phase = 'won';
          state.finalScore = player.progress;
          state.ranking = getRanking(player, bots);
        }
      }

      // BƯỚC 6: Cập nhật bảng xếp hạng thời gian thực
      if (!state.isGameOver) {
        state.ranking = getRanking(player, bots);
      }
    }

    // BƯỚC 7: Render toàn bộ khung hình game lên Canvas
    render(context, state);

    animationFrameId = requestAnimationFrame(loop);
  }

  // Khởi động vòng lặp game
  animationFrameId = requestAnimationFrame(loop);

  // ===========================================================================
  // 3. CLEANUP & HỦY TÀI NGUYÊN KHI COMPONENT UNMOUNT
  // ===========================================================================
  return {
    state,
    restart,
    destroy() {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      input.destroy();
      canvas.removeEventListener('click', handleCanvasClick);
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
