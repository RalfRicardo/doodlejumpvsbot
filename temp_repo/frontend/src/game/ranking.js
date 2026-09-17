// frontend/src/game/ranking.js
// MODULE BẢNG XẾP HẠNG THỜI GIAN THỰC (REAL-TIME RANKING)

export function getRanking(player, bots = []) {
  // 1. Tập hợp người chơi và tất cả các bot vào mảng tham gia
  const participants = [
    {
      id: player.id || 'player',
      name: player.name || 'Bạn',
      progress: player.progress ?? Math.floor(player.maxScore || 0),
      isDead: !!player.isDead,
    },
    ...bots.map((b) => ({
      id: b.id || b.type || 'bot',
      name: b.profile?.name || b.id || 'Bot',
      progress: b.progress ?? Math.floor(b.score || 0),
      isDead: !!b.isDead,
    })),
  ];

  // 2. Sắp xếp thứ hạng: Điểm độ cao cao hơn đứng trước, hòa điểm thì sắp theo ID
  return participants.sort((a, b) => {
    if (b.progress !== a.progress) {
      return b.progress - a.progress;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}
