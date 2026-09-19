// frontend/src/game/ranking.js
// MODULE BẢNG XẾP HẠNG THỜI GIAN THỰC (REAL-TIME RANKING)

/**
 * Tính toán thứ hạng thời gian thực của Người chơi và các Bot
 * Điểm xếp hạng tính chính xác theo vị trí độ cao hiện tại của nhân vật
 */
export function getRanking(player, bots = []) {
  // 1. Tập hợp người chơi vào danh sách tham gia
  const playerProgress = player.progress !== undefined 
    ? player.progress 
    : Math.max(0, Math.floor(player.y || 0));

  const participants = [
    {
      id: player.id || 'player',
      name: player.name || 'Bạn',
      progress: playerProgress,
      isDead: Boolean(player.isDead),
    },
  ];

  // 2. Thêm các bot vào danh sách tham gia
  for (let i = 0; i < bots.length; i++) {
    const bot = bots[i];
    const botProgress = bot.progress !== undefined 
      ? bot.progress 
      : Math.max(0, Math.floor(bot.y || 0));

    participants.push({
      id: bot.id || bot.type || `bot_${i}`,
      name: bot.profile?.name || bot.id || `Bot ${i + 1}`,
      progress: botProgress,
      isDead: Boolean(bot.isDead),
    });
  }

  // 3. Sắp xếp thứ hạng:
  // - Điểm độ cao cao hơn đứng trước
  // - Bằng điểm thì sắp xếp theo ID để thứ tự luôn ổn định
  participants.sort((a, b) => {
    if (b.progress !== a.progress) {
      return b.progress - a.progress;
    }
    return String(a.id).localeCompare(String(b.id));
  });

  return participants;
}
