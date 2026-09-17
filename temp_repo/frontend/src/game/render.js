// frontend/src/game/render.js
import {
  DISAPPEAR_DELAY,
  BREAKABLE_COUNTDOWN,
  BOT_COLORS,
  GRID_SIZE,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from './index.js';

// =============================================================================
// 1. TẢI TÀI NGUYÊN HÌNH ẢNH SPRITE
// =============================================================================
const imgLeft = new Image();
imgLeft.src = 'assets/doodler-left.png';

const imgRight = new Image();
imgRight.src = 'assets/doodler-right.png';

export function getPlayerSprite(direction) {
  return direction === 'left' ? imgLeft : imgRight;
}

export function getBotSprite(typeKey, direction) {
  return direction === 'left' ? imgLeft : imgRight;
}

// =============================================================================
// 2. VẼ NHÂN VẬT NGƯỜI CHƠI (DRAW PLAYER)
// =============================================================================
export function drawPlayer(ctx, player) {
  if (player.image && player.image.complete && player.image.naturalWidth !== 0) {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
  } else {
    // Dự phòng: Vẽ nhân vật vector vàng cam sắc nét nếu ảnh chưa tải xong
    ctx.save();
    ctx.fillStyle = '#e8ad48';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(player.x, player.y, player.width, player.height, 14);
    } else {
      ctx.rect(player.x, player.y, player.width, player.height);
    }
    ctx.fill();

    // Mắt
    ctx.fillStyle = '#17352e';
    const eyeX = player.direction === 'left' ? player.x + 8 : player.x + player.width - 16;
    ctx.fillRect(eyeX, player.y + 12, 6, 8);

    // Mũi / Vòi
    ctx.fillStyle = '#d48b28';
    const noseX = player.direction === 'left' ? player.x - 8 : player.x + player.width;
    ctx.fillRect(noseX, player.y + 20, 8, 8);

    // Chân
    ctx.fillStyle = '#a66b1a';
    ctx.fillRect(player.x + 8, player.y + player.height - 4, 8, 6);
    ctx.fillRect(player.x + player.width - 16, player.y + player.height - 4, 8, 6);

    ctx.restore();
  }
}

// =============================================================================
// 3. VẼ BOT ĐỐI THỦ (DRAW BOT)
// =============================================================================
export function drawBot(ctx, bot) {
  if (bot.isDead) return;
  const color = BOT_COLORS[bot.type] || '#8e44ad';
  ctx.save();

  // Nếu bot ở ngoài mép đáy màn hình (đang leo lên theo sau): Hiển thị chỉ báo bám đuổi
  if (bot.y > SCREEN_HEIGHT) {
    const indicatorX = Math.max(45, Math.min(SCREEN_WIDTH - 45, bot.x + bot.width / 2));
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

  if (bot.image && bot.image.complete && bot.image.naturalWidth !== 0) {
    ctx.globalAlpha = 0.9;
    ctx.drawImage(bot.image, bot.x, bot.y, bot.width, bot.height);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bot.x, bot.y, bot.width, bot.height, 12);
    } else {
      ctx.rect(bot.x, bot.y, bot.width, bot.height);
    }
    ctx.fill();

    // Mắt bot
    ctx.fillStyle = '#ffffff';
    const eyeX = bot.direction === 'left' ? bot.x + 6 : bot.x + bot.width - 14;
    ctx.fillRect(eyeX, bot.y + 10, 8, 8);
    ctx.fillStyle = '#000000';
    ctx.fillRect(eyeX + 2, bot.y + 12, 4, 4);
  }

  // Tên Bot trên đầu
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(bot.profile?.name || bot.type, bot.x + bot.width / 2, bot.y - 6);

  ctx.restore();
}

// =============================================================================
// 4. VẼ 3 LOẠI BỆ ĐỠ (DRAW PLATFORMS)
// =============================================================================
export function drawPlatforms(ctx, platforms, cameraY = 0) {
  for (const p of platforms) {
    const drawY = (p.broken && p.brokenY !== undefined ? p.brokenY : p.y) - cameraY;

    // --- LOẠI 1: BỆ VỠ ĐƯỢC (BREAKABLE) ---
    if (p.type === 'breakable') {
      ctx.save();

      if (p.broken) {
        // Đang vỡ vụn: 2 mảnh vỡ tách đôi rơi xuống và mờ dần theo DISAPPEAR_DELAY từ index.js
        const alpha = Math.max(0, 1 - (p.brokenTimer || 0) / DISAPPEAR_DELAY);
        ctx.globalAlpha = alpha;

        const halfW = p.width / 2 - 2;
        // Mảnh trái
        ctx.fillStyle = '#965b32';
        ctx.fillRect(p.x - 3, drawY, halfW, p.height);
        ctx.fillStyle = '#b57444';
        ctx.fillRect(p.x - 3, drawY, halfW, 3);

        // Mảnh phải
        ctx.fillStyle = '#965b32';
        ctx.fillRect(p.x + halfW + 5, drawY + 4, halfW, p.height);
        ctx.fillStyle = '#b57444';
        ctx.fillRect(p.x + halfW + 5, drawY + 4, halfW, 3);
      } else {
        // Bệ vỡ: có thể nhảy được, đếm ngược BREAKABLE_COUNTDOWN khi chạm vào
        const isCountingDown = p.isTriggered && p.countdown !== undefined;
        const shakeX = isCountingDown && p.countdown < 0.8 ? (Math.random() * 3 - 1.5) : 0;
        const finalX = p.x + shakeX;

        ctx.fillStyle = isCountingDown ? '#b05326' : '#965b32';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(finalX, drawY, p.width, p.height, 5);
        } else {
          ctx.rect(finalX, drawY, p.width, p.height);
        }
        ctx.fill();

        // Viền trên
        ctx.fillStyle = isCountingDown ? '#e67e22' : '#ba7c4e';
        ctx.fillRect(finalX + 2, drawY, p.width - 4, 3);

        // Vết nứt zigzag ở giữa
        ctx.strokeStyle = isCountingDown ? '#e74c3c' : '#4a2508';
        ctx.lineWidth = isCountingDown ? 3 : 2;
        ctx.beginPath();
        const midX = finalX + p.width / 2;
        ctx.moveTo(midX - 3, drawY);
        ctx.lineTo(midX + 3, drawY + 5);
        ctx.lineTo(midX - 3, drawY + 9);
        ctx.lineTo(midX + 4, drawY + p.height);
        ctx.stroke();

        // Nếu đang đếm ngược: Hiển thị đồng hồ và thanh tiến trình
        if (isCountingDown) {
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = p.countdown < 0.7 ? '#e74c3c' : '#d35400';
          ctx.fillText(`⏱ ${p.countdown.toFixed(1)}s`, finalX + p.width / 2, drawY - 3);

          // Thanh tiến trình đếm ngược thu hẹp dần
          const barW = Math.max(0, (p.width - 4) * (p.countdown / BREAKABLE_COUNTDOWN));
          ctx.fillStyle = p.countdown < 0.7 ? '#e74c3c' : '#f39c12';
          ctx.fillRect(finalX + 2, drawY + p.height - 3, barW, 2);
        }
      }

      ctx.restore();
      continue;
    }

    // --- LOẠI 2: BỆ DI CHUYỂN (MOVING) ---
    if (p.type === 'moving') {
      ctx.save();
      ctx.fillStyle = '#2980b9'; // Xanh dương
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(p.x, drawY, p.width, p.height, 6);
      } else {
        ctx.rect(p.x, drawY, p.width, p.height);
      }
      ctx.fill();

      // Viền trên xanh sáng
      ctx.fillStyle = '#5dade2';
      ctx.fillRect(p.x + 2, drawY, p.width - 4, 3);

      // Ký hiệu 2 mũi tên di chuyển trái phải ◄ ► ở giữa bệ
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◄  ►', p.x + p.width / 2, drawY + p.height / 2 + 1);

      ctx.restore();
      continue;
    }

    // --- LOẠI 3: BỆ THƯỜNG (NORMAL) ---
    ctx.fillStyle = '#43765c'; // Xanh lá cây chuẩn
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(p.x, drawY, p.width, p.height, 6);
    } else {
      ctx.rect(p.x, drawY, p.width, p.height);
    }
    ctx.fill();

    // Viền trên sáng
    ctx.fillStyle = '#6bb38a';
    ctx.fillRect(p.x + 2, drawY, p.width - 4, 3);
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
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(12, 10, leftBoxW, leftBoxH, 8);
  } else {
    ctx.rect(12, 10, leftBoxW, leftBoxH);
  }
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
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(boardX, boardY, boardW, boardH, 8);
  } else {
    ctx.rect(boardX, boardY, boardW, boardH);
  }
  ctx.fill();
  ctx.stroke();

  // Tiêu đề bảng
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🏁 BẢNG ĐUA TOP', boardX + 10, boardY + 16);

  // Danh sách tay đua
  ranking.forEach((r, idx) => {
    const y = boardY + 34 + idx * rowH;
    const isPlayer = r.id === 'player';

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
        // Hiển thị phần dead kèm điểm số bé bé
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
// 5. RENDER TOÀN BỘ KHUNG HÌNH (MAIN RENDER FUNCTION)
// =============================================================================
export function render(ctx, state) {
  const { player, world, bots = [], ranking = [], isGameOver, finalScore } = state;
  const { width, height } = ctx.canvas;

  // 1. Nền sổ kẻ ô caro theo GRID_SIZE từ index.js
  ctx.fillStyle = '#edf2e9';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#d6ded1';
  ctx.lineWidth = 1;
  const gridSize = GRID_SIZE || 32;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Vẽ Bệ đỡ
  if (world?.platforms) {
    drawPlatforms(ctx, world.platforms, world.cameraY || 0);
  }

  // 3. Vẽ Bot (chỉ vẽ các bot còn sống)
  for (const bot of bots) {
    if (!bot.isDead) {
      if (bot.y >= -bot.height) {
        drawBot(ctx, bot);
      } else {
        // Vẽ mũi tên chỉ báo vị trí bot đang dẫn trước ở phía trên màn hình
        ctx.save();
        ctx.fillStyle = BOT_COLORS[bot.type] || '#8e44ad';
        ctx.beginPath();
        const indicatorX = Math.max(35, Math.min(width - 35, bot.x + bot.width / 2));
        ctx.moveTo(indicatorX, 6);
        ctx.lineTo(indicatorX - 6, 16);
        ctx.lineTo(indicatorX + 6, 16);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${bot.profile?.name || bot.type}`, indicatorX, 28);
        ctx.restore();
      }
    }
  }

  // 4. Vẽ Người chơi
  if (player && !isGameOver) {
    drawPlayer(ctx, player);
  }

  // 5. Bảng thông số & Xếp hạng Realtime HUD khi đang chơi
  if (!isGameOver) {
    drawHUD(ctx, player, ranking, width, state.highScore);
  }

  // 6. Màn hình Game Over khi rơi xuống vực
  if (isGameOver) {
    ctx.save();
    ctx.fillStyle = 'rgba(23, 53, 46, 0.85)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THUA CUỘC!', width / 2, height / 2 - 60);

    ctx.fillStyle = '#edf2e9';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Độ cao đạt được: ${finalScore || 0}m`, width / 2, height / 2 - 10);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`🏆 Kỷ lục cao nhất: ${state.highScore || finalScore || 0}m`, width / 2, height / 2 + 25);

    const playerRank = ranking.findIndex(r => r.id === 'player') + 1;
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`Thứ hạng trong cuộc đua: #${playerRank || ranking.length}`, width / 2, height / 2 + 58);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText('👉 Bấm vào màn hình hoặc nút Chơi Lại để thử lại 👈', width / 2, height / 2 + 105);

    ctx.restore();
  }
}
