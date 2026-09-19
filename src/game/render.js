// frontend/src/game/render.js
// MODULE VẼ VÀ HIỂN THỊ ĐỒ HỌA TRÊN CANVAS (RENDER ENGINE)

import {
  DISAPPEAR_DELAY,
  BOT_COLORS,
  GRID_SIZE,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  ORIGIN_SCREEN_X,
  ORIGIN_SCREEN_Y,
} from './index.js';

// =============================================================================
// HÀM BỔ TRỢ: VẼ HÌNH CHỮ NHẬT BO GÓC AN TOÀN TRÊN MỌI TRÌNH DUYỆT
// =============================================================================
function drawRoundedRect(ctx, x, y, width, height, radius = 6) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
}

// =============================================================================
// 0. CHUYỂN ĐỔI TỌA ĐỘ THẾ GIỚI -> TỌA ĐỘ CANVAS MÀN HÌNH
// Điểm gốc (0,0) là vị trí ban đầu của Player.
// Trục Y thế giới hướng lên trên: wy > 0 bay lên -> sy giảm dần (lên phía trên Canvas).
// =============================================================================
export function worldToScreenX(worldX, width = 0) {
  return (ORIGIN_SCREEN_X || 480) + worldX - width / 2;
}

export function worldToScreenY(worldY, cameraY = 0, height = 0) {
  return (ORIGIN_SCREEN_Y || 460) - (worldY - cameraY) - height;
}

// =============================================================================
// 1. TẢI TÀI NGUYÊN HÌNH ẢNH SPRITE
// =============================================================================
const imgLeft = new Image();
imgLeft.src = 'assets/doodler-left.png';

const imgRight = new Image();
imgRight.src = 'assets/doodler-right.png';

export function getPlayerSprite(direction) {
  if (direction === 'left') {
    return imgLeft;
  }
  return imgRight;
}

export function getBotSprite(typeKey, direction) {
  if (direction === 'left') {
    return imgLeft;
  }
  return imgRight;
}

// =============================================================================
// 2. VẼ NHÂN VẬT NGƯỜI CHƠI (DRAW PLAYER)
// =============================================================================
export function drawPlayer(ctx, player, cameraY = 0) {
  const drawX = worldToScreenX(player.x, player.width);
  const drawY = worldToScreenY(player.y, cameraY, player.height);

  const hasLoadedImage = (
    player.image && 
    player.image.complete && 
    player.image.naturalWidth !== 0
  );

  if (hasLoadedImage) {
    ctx.drawImage(player.image, drawX, drawY, player.width, player.height);
  } else {
    // Dự phòng: Vẽ nhân vật vector vàng cam sắc nét nếu ảnh chưa tải xong
    ctx.save();
    ctx.fillStyle = '#e8ad48';
    drawRoundedRect(ctx, drawX, drawY, player.width, player.height, 14);
    ctx.fill();

    // Mắt
    ctx.fillStyle = '#17352e';
    let eyeX = drawX + player.width - 16;
    if (player.direction === 'left') {
      eyeX = drawX + 8;
    }
    ctx.fillRect(eyeX, drawY + 12, 6, 8);

    // Mũi / Vòi
    ctx.fillStyle = '#d48b28';
    let noseX = drawX + player.width;
    if (player.direction === 'left') {
      noseX = drawX - 8;
    }
    ctx.fillRect(noseX, drawY + 20, 8, 8);

    // Chân
    ctx.fillStyle = '#a66b1a';
    ctx.fillRect(drawX + 8, drawY + player.height - 4, 8, 6);
    ctx.fillRect(drawX + player.width - 16, drawY + player.height - 4, 8, 6);

    ctx.restore();
  }
}

// =============================================================================
// 3. VẼ BOT ĐỐI THỦ (DRAW BOT)
// =============================================================================
export function drawBot(ctx, bot, cameraY = 0) {
  if (bot.isDead) {
    return;
  }

  const color = BOT_COLORS[bot.type] || '#8e44ad';
  const drawX = worldToScreenX(bot.x, bot.width);
  const drawY = worldToScreenY(bot.y, cameraY, bot.height);

  ctx.save();

  // Nếu bot ở ngoài mép đáy màn hình (đang leo lên theo sau): Hiển thị chỉ báo bám đuổi
  if (drawY > SCREEN_HEIGHT) {
    const indicatorX = Math.max(45, Math.min(SCREEN_WIDTH - 45, drawX + bot.width / 2));
    const indicatorY = SCREEN_HEIGHT - 16;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲', indicatorX, indicatorY + 3);

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(bot.profile?.name || bot.type, indicatorX, indicatorY - 12);
    ctx.restore();
    return;
  }

  // Nếu bot ở phía trên màn hình (đang dẫn trước): Hiển thị mũi tên chỉ báo
  if (drawY < -bot.height) {
    const indicatorX = Math.max(35, Math.min(SCREEN_WIDTH - 35, drawX + bot.width / 2));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(indicatorX, 6);
    ctx.lineTo(indicatorX - 6, 16);
    ctx.lineTo(indicatorX + 6, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${bot.profile?.name || bot.type}`, indicatorX, 28);
    ctx.restore();
    return;
  }

  const hasLoadedImage = (
    bot.image && 
    bot.image.complete && 
    bot.image.naturalWidth !== 0
  );

  if (hasLoadedImage) {
    ctx.globalAlpha = 0.9;
    ctx.drawImage(bot.image, drawX, drawY, bot.width, bot.height);
  } else {
    ctx.fillStyle = color;
    drawRoundedRect(ctx, drawX, drawY, bot.width, bot.height, 12);
    ctx.fill();

    // Mắt bot
    ctx.fillStyle = '#ffffff';
    let eyeX = drawX + bot.width - 14;
    if (bot.direction === 'left') {
      eyeX = drawX + 6;
    }
    ctx.fillRect(eyeX, drawY + 10, 8, 8);

    ctx.fillStyle = '#000000';
    ctx.fillRect(eyeX + 2, drawY + 12, 4, 4);
  }

  // Tên Bot trên đầu
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(bot.profile?.name || bot.type, drawX + bot.width / 2, drawY - 6);

  ctx.restore();
}

// =============================================================================
// 4. VẼ 3 LOẠI BỆ ĐỠ (DRAW PLATFORMS)
// =============================================================================
export function drawPlatforms(ctx, platforms, cameraY = 0) {
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    const currY = (p.broken && p.brokenY !== undefined) ? p.brokenY : p.y;
    const drawX = worldToScreenX(p.x, p.width);
    const drawY = worldToScreenY(currY, cameraY, 0);

    // --- LOẠI 1: BỆ VỠ ĐƯỢC (BREAKABLE) ---
    // Chạm vào là gãy đôi vỡ vụn ngay lập tức, KHÔNG thể bật nảy lên!
    if (p.type === 'breakable') {
      ctx.save();

      if (p.broken) {
        // Đang vỡ vụn: 2 nửa tách rời dạt ra hai bên và rơi nhanh xuống vực
        const elapsed = p.brokenTimer || 0;
        const alpha = Math.max(0, 1 - elapsed / DISAPPEAR_DELAY);
        ctx.globalAlpha = alpha;

        const splitDist = Math.min(24, elapsed * 0.05);
        const halfW = p.width / 2 - 2;

        // Nửa bên trái (nghiêng và dạt sang trái)
        ctx.save();
        ctx.translate(drawX + halfW / 2 - splitDist, drawY + p.height / 2 + splitDist * 0.8);
        ctx.rotate(-splitDist * 0.02);
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-halfW / 2, -p.height / 2, halfW, p.height);
        ctx.fillStyle = '#a16207';
        ctx.fillRect(-halfW / 2, -p.height / 2, halfW, 3);
        ctx.restore();

        // Nửa bên phải (nghiêng và dạt sang phải)
        ctx.save();
        ctx.translate(drawX + halfW + halfW / 2 + splitDist + 4, drawY + p.height / 2 + splitDist * 1.1);
        ctx.rotate(splitDist * 0.025);
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-halfW / 2, -p.height / 2, halfW, p.height);
        ctx.fillStyle = '#a16207';
        ctx.fillRect(-halfW / 2, -p.height / 2, halfW, 3);
        ctx.restore();

        // Vụn gỗ bay ra
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(drawX + p.width / 2 - splitDist * 0.5, drawY + splitDist * 1.5, 3, 3);
        ctx.fillRect(drawX + p.width / 2 + splitDist * 0.6, drawY + splitDist * 1.2, 4, 2);
      } else {
        // Bệ chưa vỡ: Màu nâu nứt gỗ đặc trưng của Doodle Jump
        ctx.fillStyle = '#92400e';
        drawRoundedRect(ctx, drawX, drawY, p.width, p.height, 4);
        ctx.fill();

        // Viền trên bệ
        ctx.fillStyle = '#b45309';
        ctx.fillRect(drawX + 2, drawY, p.width - 4, 3);

        // Vết nứt toác đôi ở giữa
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const midX = drawX + p.width / 2;
        ctx.moveTo(midX - 3, drawY);
        ctx.lineTo(midX + 4, drawY + 5);
        ctx.lineTo(midX - 4, drawY + 9);
        ctx.lineTo(midX + 3, drawY + p.height);
        ctx.stroke();

        // Điểm nứt phụ
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX + 4, drawY + 5);
        ctx.lineTo(midX + 11, drawY + 8);
        ctx.stroke();
      }

      ctx.restore();
      continue;
    }

    // --- LOẠI 2: BỆ DI CHUYỂN (MOVING) ---
    if (p.type === 'moving') {
      ctx.save();
      ctx.fillStyle = '#2980b9';
      drawRoundedRect(ctx, drawX, drawY, p.width, p.height, 6);
      ctx.fill();

      // Viền trên xanh sáng
      ctx.fillStyle = '#5dade2';
      ctx.fillRect(drawX + 2, drawY, p.width - 4, 3);

      // Ký hiệu 2 mũi tên di chuyển trái phải ◄ ► ở giữa bệ
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◄  ►', drawX + p.width / 2, drawY + p.height / 2 + 1);

      ctx.restore();
      continue;
    }

    // --- LOẠI 3: BỆ THƯỜNG (NORMAL) ---
    ctx.fillStyle = '#43765c';
    drawRoundedRect(ctx, drawX, drawY, p.width, p.height, 6);
    ctx.fill();

    // Viền trên sáng
    ctx.fillStyle = '#6bb38a';
    ctx.fillRect(drawX + 2, drawY, p.width - 4, 3);
  }
}

// =============================================================================
// 4.5. BẢNG HUD HIỂN THỊ ĐỘ CAO & XẾP HẠNG TRỰC TIẾP (LIVE HUD)
// =============================================================================
function drawHUD(ctx, player, ranking, width, highScore = 0) {
  ctx.save();

  // --- GÓC TRÁI: ĐIỂM CAO NHẤT GIỮA CÁC LẦN CHƠI & ĐIỂM HIỆN TẠI ---
  const leftBoxW = 145;
  const leftBoxH = 48;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, 12, 10, leftBoxW, leftBoxH, 8);
  ctx.fill();
  ctx.stroke();

  // Điểm cao nhất giữa các lần chơi (High Score)
  ctx.fillStyle = '#d97706';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🏆 Kỷ lục: ${highScore || 0}m`, 20, 28);

  // Điểm hiện tại của người chơi
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`🚀 Hiện tại: ${player.progress || 0}m`, 20, 47);

  // --- GÓC PHẢI: BẢNG XẾP HẠNG CUỘC ĐUA (5 TAY ĐUA) ---
  const boardW = 180;
  const rowH = 19;
  const boardH = 26 + ranking.length * rowH;
  const boardX = width - boardW - 12;
  const boardY = 10;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
  ctx.strokeStyle = '#cbd5e1';
  drawRoundedRect(ctx, boardX, boardY, boardW, boardH, 8);
  ctx.fill();
  ctx.stroke();

  // Tiêu đề bảng
  const aliveBots = ranking.filter((r) => r.id !== 'player' && !r.isDead);
  const aliveBotsCount = aliveBots.length;

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🏁 ĐUA TOP (Còn ${aliveBotsCount} bot)`, boardX + 8, boardY + 16);

  // Danh sách tay đua
  ranking.forEach((r, idx) => {
    const y = boardY + 34 + idx * rowH;
    const isPlayer = (r.id === 'player');

    if (isPlayer) {
      if (r.isDead) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`#${idx + 1} Bạn`, boardX + 10, y);

        ctx.textAlign = 'right';
        ctx.font = '9px sans-serif';
        ctx.fillText(`💀 Loại (${r.progress}m)`, boardX + boardW - 8, y);
        ctx.textAlign = 'left';
      } else {
        ctx.fillStyle = '#16a085';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`#${idx + 1} Bạn`, boardX + 10, y);

        ctx.textAlign = 'right';
        ctx.fillText(`${r.progress}m`, boardX + boardW - 8, y);
        ctx.textAlign = 'left';
      }
    } else {
      if (r.isDead) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText(`#${idx + 1} ${r.name}`, boardX + 10, y);

        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'right';
        ctx.font = '9px sans-serif';
        ctx.fillText(`💀 Loại (${r.progress}m)`, boardX + boardW - 8, y);
        ctx.textAlign = 'left';
      } else {
        ctx.fillStyle = '#475569';
        ctx.font = '11px sans-serif';
        ctx.fillText(`#${idx + 1} ${r.name}`, boardX + 10, y);

        ctx.textAlign = 'right';
        ctx.fillText(`${r.progress}m`, boardX + boardW - 8, y);
        ctx.textAlign = 'left';
      }
    }
  });

  ctx.restore();
}

// =============================================================================
// 4.6. VẼ DUNG NHAM ĐUỔI THEO (DRAW LAVA)
// =============================================================================
export function drawLava(ctx, lava, cameraY, width, height, elapsedMs = 0) {
  if (!lava) {
    return;
  }

  const lavaY = lava.y;
  const surfaceY = worldToScreenY(lavaY, cameraY, 0);

  ctx.save();

  if (surfaceY < height + 40) {
    // Dung nham đã dâng vào trong tầm nhìn màn hình
    const waveFreq = 0.014;
    const waveSpeed = elapsedMs * 0.004;

    // 1. Ánh sáng nhiệt tỏa lên trên mặt dung nham
    const glowH = Math.min(50, Math.max(20, surfaceY));
    const glowGrad = ctx.createLinearGradient(0, surfaceY - glowH, 0, surfaceY);
    glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    glowGrad.addColorStop(1, 'rgba(249, 115, 22, 0.35)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, surfaceY - glowH, width, glowH);

    // 2. Vùng dung nham nóng chảy dâng cuồn cuộn
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, surfaceY);

    for (let x = 0; x <= width; x += 15) {
      const yOffset = Math.sin(x * waveFreq + waveSpeed) * 5 + Math.cos(x * 0.028 - waveSpeed * 1.4) * 3;
      ctx.lineTo(x, surfaceY + yOffset);
    }
    ctx.lineTo(width, height);
    ctx.closePath();

    // Gradient màu nham thạch rực lửa từ vàng cam đến đỏ sẫm
    const lavaGrad = ctx.createLinearGradient(0, surfaceY, 0, height);
    lavaGrad.addColorStop(0, '#fffbeb');
    lavaGrad.addColorStop(0.08, '#f97316');
    lavaGrad.addColorStop(0.35, '#dc2626');
    lavaGrad.addColorStop(0.75, '#991b1b');
    lavaGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = lavaGrad;
    ctx.fill();

    // 3. Đường viền bọt sóng sáng chói trên mặt dung nham
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 15) {
      const yOffset = Math.sin(x * waveFreq + waveSpeed) * 5 + Math.cos(x * 0.028 - waveSpeed * 1.4) * 3;
      if (x === 0) {
        ctx.moveTo(x, surfaceY + yOffset);
      } else {
        ctx.lineTo(x, surfaceY + yOffset);
      }
    }
    ctx.stroke();

    // 4. Bong bóng dung nham sôi lục bục
    const bubbleSeed = elapsedMs * 0.003;
    for (let i = 0; i < 7; i++) {
      const bx = (i * 149 + elapsedMs * 0.04) % width;
      const by = surfaceY + 12 + ((i * 41) % 40);
      if (by < height) {
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        const r = 3 + (Math.sin(bubbleSeed + i * 1.7) + 1) * 2;
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Dung nham còn ở bên dưới đáy màn hình -> Hiển thị dải cảnh báo khoảng cách ở mép đáy
    const distanceM = Math.max(0, Math.round(surfaceY - height));

    // Ánh đỏ rực từ mép đáy
    const bottomGlow = ctx.createLinearGradient(0, height - 32, 0, height);
    bottomGlow.addColorStop(0, 'rgba(239, 68, 68, 0)');
    bottomGlow.addColorStop(1, 'rgba(239, 68, 68, 0.4)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, height - 32, width, 32);

    // Huy hiệu cảnh báo khoảng cách dung nham
    const badgeW = 210;
    const badgeH = 24;
    const badgeX = (width - badgeW) / 2;
    const badgeY = height - 28;

    ctx.fillStyle = 'rgba(127, 29, 29, 0.88)';
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🔥 Dung nham dâng: cách ${distanceM}m`, width / 2, badgeY + badgeH / 2);
  }

  ctx.restore();
}

// =============================================================================
// 5. RENDER TOÀN BỘ KHUNG HÌNH (MAIN RENDER FUNCTION)
// =============================================================================
export function render(ctx, state) {
  const { 
    player, 
    world, 
    bots = [], 
    ranking = [], 
    isGameOver, 
    finalScore, 
    elapsedMs = 0 
  } = state;

  const { width, height } = ctx.canvas;
  const cameraY = world?.cameraY || 0;

  // 1. Nền sổ kẻ ô caro theo GRID_SIZE, cuộn mượt theo cameraY
  ctx.fillStyle = '#edf2e9';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#d6ded1';
  ctx.lineWidth = 1;
  const gridSize = GRID_SIZE || 32;
  const offsetY = (cameraY % gridSize);

  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = offsetY - gridSize; y < height + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Vẽ Bệ đỡ
  if (world?.platforms) {
    drawPlatforms(ctx, world.platforms, cameraY);
  }

  // 3. Vẽ Bot (chỉ vẽ các bot còn sống)
  for (let i = 0; i < bots.length; i++) {
    const bot = bots[i];
    if (!bot.isDead) {
      drawBot(ctx, bot, cameraY);
    }
  }

  // 4. Vẽ Người chơi
  if (player && !isGameOver) {
    drawPlayer(ctx, player, cameraY);
  }

  // 5. Vẽ Dung Nham (Lava) đuổi theo
  if (world?.lava) {
    drawLava(ctx, world.lava, cameraY, width, height, elapsedMs);
  }

  // 6. Bảng thông số & Xếp hạng Realtime HUD khi đang chơi
  if (!isGameOver) {
    drawHUD(ctx, player, ranking, width, state.highScore);
  }

  // 7. Màn hình Kết Thúc Trận Đấu
  if (isGameOver) {
    ctx.save();

    if (state.isWin) {
      // ===== MÀN HÌNH CHIẾN THẮNG TUYỆT ĐỐI =====
      ctx.fillStyle = 'rgba(10, 37, 24, 0.90)';
      ctx.fillRect(0, 0, width, height);

      // Hiệu ứng ánh sáng vàng lấp lánh
      const sparkleSeed = elapsedMs * 0.003;
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 137 + elapsedMs * 0.08) % width);
        const sy = (height * 0.15 + (i * 47) % (height * 0.7));
        const r = 2 + Math.sin(sparkleSeed + i) * 1.5;

        if (i % 2 === 0) {
          ctx.fillStyle = '#fef08a';
        } else {
          ctx.fillStyle = '#86efac';
        }

        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(1, r), 0, Math.PI * 2);
        ctx.fill();
      }

      // Banner hào quang chiến thắng
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑 BẠN ĐÃ CHIẾN THẮNG! 👑', width / 2, height / 2 - 75);

      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Tất cả đối thủ đã bị Dung Nham nuốt chửng!', width / 2, height / 2 - 32);

      ctx.fillStyle = '#f0fdf4';
      ctx.font = '16px sans-serif';
      ctx.fillText('Bạn là người sống sót duy nhất & Giành ngôi Vô Địch!', width / 2, height / 2 - 8);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText(`🏆 Hạng: #1 VÔ ĐỊCH  •  Độ cao: ${finalScore || 0}m`, width / 2, height / 2 + 28);

      ctx.fillStyle = '#93c5fd';
      ctx.font = '15px sans-serif';
      const survivalTime = ((elapsedMs || 0) / 1000).toFixed(1);
      ctx.fillText(`⏱️ Thời gian sinh tồn: ${survivalTime}s  |  Kỷ lục: ${state.highScore || finalScore || 0}m`, width / 2, height / 2 + 58);

      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#4ade80';
      ctx.fillText('👉 Bấm vào màn hình hoặc nút Chơi Lại để bắt đầu ván mới 👈', width / 2, height / 2 + 105);
    } else {
      // ===== MÀN HÌNH THUA CUỘC DO CHẠM DUNG NHAM =====
      ctx.fillStyle = 'rgba(23, 53, 46, 0.88)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔥 BỊ DUNG NHAM THIÊU RỤI! 🔥', width / 2, height / 2 - 60);

      ctx.fillStyle = '#edf2e9';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Độ cao đạt được: ${finalScore || 0}m`, width / 2, height / 2 - 10);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`🏆 Kỷ lục cao nhất: ${state.highScore || finalScore || 0}m`, width / 2, height / 2 + 25);

      const playerRank = ranking.findIndex((r) => r.id === 'player') + 1;
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText(`Thứ hạng trong cuộc đua: #${playerRank || ranking.length}`, width / 2, height / 2 + 58);

      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#2ecc71';
      ctx.fillText('👉 Bấm vào màn hình hoặc nút Chơi Lại để thử lại 👈', width / 2, height / 2 + 105);
    }

    ctx.restore();
  }
}
