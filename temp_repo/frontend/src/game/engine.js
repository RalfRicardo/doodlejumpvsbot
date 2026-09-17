// frontend/src/game/engine.js
import { createPlayer, updateHorizontal } from './player.js';
import { createWorld, scrollWorld, ensurePlatformsAhead, updateWorldPlatforms } from './world.js';
import { createInput } from './input.js';
import { applyPhysics, handleScreenWrap, handlePlatformCollisions } from './physics.js';
import { createBot, updateBotAI, onBotBounce } from './bots.js';
import { render } from './render.js';
import { getRanking } from './ranking.js';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  BOT_WIDTH,
  BOT_HEIGHT,
  BOT_PROFILES,
  PLATFORM_START_Y,
  PLATFORM_START_WIDTH,
  PLATFORM_CLEANUP_OFFSET,
  OUTPACED_DISTANCE,
  JUMP_VELOCITY,
} from './index.js';

// =============================================================================
// 1. KHỞI TẠO CÁC BOT XUẤT PHÁT CÙNG LÚC VỚI NGƯỜI CHƠI
// =============================================================================
function setupBots(platforms) {
  const pLeft = platforms[0];
  const pCenter = platforms[1];
  const pRight = platforms[2];

  const botConfigs = [
    { type: 'NOVICE', x: pCenter.x + 8, y: pCenter.y - BOT_HEIGHT },
    { type: 'STANDARD', x: pCenter.x + pCenter.width - BOT_WIDTH - 8, y: pCenter.y - BOT_HEIGHT },
    { type: 'PERFECT', x: pLeft.x + Math.floor((pLeft.width - BOT_WIDTH) / 2), y: pLeft.y - BOT_HEIGHT },
    { type: 'SPEEDRUNNER', x: pRight.x + Math.floor((pRight.width - BOT_WIDTH) / 2), y: pRight.y - BOT_HEIGHT },
  ];

  return botConfigs.map(cfg => {
    const bot = createBot(cfg.type, cfg.x, cfg.y);
    bot.isDead = false;
    bot.lastPlatformY = cfg.y + BOT_HEIGHT;
    bot.progress = Math.max(0, Math.floor(PLATFORM_START_Y - cfg.y));
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
    highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10) || 0;
  } catch (e) {
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
    if (!isRunning) return;

    let dt = (currentTime - lastTime) / 1000;
    if (dt > 1 / 30) dt = 1 / 30;
    if (dt < 0) dt = 0;
    lastTime = currentTime;

    if (!state.isGameOver) {
      state.elapsedMs = (state.elapsedMs || 0) + dt * 1000;

      // BƯỚC 0: Cập nhật vị trí bệ di chuyển và bộ đếm ngược bệ vỡ
      updateWorldPlatforms(world, dt);

      // BƯỚC 1: Luôn sinh bệ mới đón đầu đối thủ dẫn đầu
      const activeEntities = [player, ...bots.filter(b => !b.isDead)];
      const topEntityY = Math.min(...activeEntities.map(e => e.y));
      ensurePlatformsAhead(world, topEntityY - 650);

      // BƯỚC 2: Cập nhật Người chơi (Điều khiển ngang -> Vật lý -> Xuyên màn hình -> Tiếp đất bệ)
      const direction = Number(input.state.right) - Number(input.state.left);
      updateHorizontal(player, direction, dt);
      player.prevBottom = player.y + player.height;
      applyPhysics(player, dt);
      handleScreenWrap(player);
      handlePlatformCollisions(player, world.platforms);

      // Cập nhật điểm độ cao người chơi đạt được
      const baseFloorY = PLATFORM_START_Y - 30;
      player.progress = Math.max(player.progress || 0, Math.floor(world.score + Math.max(0, baseFloorY - player.y)));
      if (player.progress > highScore) {
        highScore = player.progress;
        state.highScore = highScore;
        try {
          localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        } catch (e) {}
      }

      // BƯỚC 3: Cuộn màn hình (Camera) khi người chơi nhảy cao vượt qua tầm nhìn sightLine
      if (player.y < world.sightLine && player.vy < 0) {
        const scrollAmount = -player.vy * dt;
        player.y += scrollAmount;
        scrollWorld(world, scrollAmount);

        // Cuộn các Bot theo chuyển động của Camera
        for (const bot of bots) {
          if (!bot.isDead) {
            bot.y += scrollAmount;
          }
        }
      }

      // BƯỚC 4: Cập nhật AI và Vật lý cho các Bot (Luật Hardcore & Luật Bỏ Xa)
      const screenH = canvas.height || SCREEN_HEIGHT;
      for (const bot of bots) {
        if (!bot.isDead) {
          updateBotAI(bot, world.platforms, dt, bots, player);

          bot.prevBottom = bot.y + bot.height;
          applyPhysics(bot, dt);
          handleScreenWrap(bot);

          // Bot tiếp đất các bệ trên màn hình
          handlePlatformCollisions(bot, world.platforms, (b, p) => onBotBounce(b, p), screenH + 15);

          // Cập nhật điểm độ cao của bot
          const currentHeight = Math.floor(world.score + Math.max(0, baseFloorY - bot.y));
          bot.progress = Math.max(bot.progress || 0, currentHeight);

          // XỬ LÝ SỐNG/CHẾT CỦA BOT (PHƯƠNG ÁN 2 HARDCORE & LUẬT BỎ XA):
          // 1. Rơi khỏi đáy màn hình: Bot rớt đài -> CHẾT VĨNH VIỄN, KHÔNG CỨU HỘ!
          const isFallen = bot.y >= screenH + 20;
          // 2. Luật bỏ xa: Bị người chơi bỏ xa >= OUTPACED_DISTANCE -> BỊ LOẠI NGAY LẬP TỨC!
          const isOutpaced = (bot.y - player.y) >= OUTPACED_DISTANCE;

          if (isFallen || isOutpaced) {
            bot.isDead = true;
            bot.vx = 0;
            bot.vy = 0;
          }
        }
      }

      // BƯỚC 5: Kiểm tra Thua Cuộc nếu Người chơi rơi khỏi đáy màn hình
      if (player.y >= screenH) {
        state.isGameOver = true;
        state.phase = 'finished';
        state.finalScore = player.progress;
      }

      // BƯỚC 6: Cập nhật bảng xếp hạng thời gian thực
      state.ranking = getRanking(player, bots);
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
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      input.destroy();
      canvas.removeEventListener('click', handleCanvasClick);
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
