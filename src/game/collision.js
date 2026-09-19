// frontend/src/game/collision.js
// MODULE PHÁT HIỆN VA CHẠM (COLLISION DETECTION)
// Hệ tọa độ: Điểm gốc (0,0) tại vị trí xuất phát của player.
// Trục Y hướng lên: vy > 0 là bay lên, vy < 0 là rơi xuống.

/**
 * Kiểm tra va chạm giữa 2 hình chữ nhật theo thuật toán AABB
 */
export function checkAABB(rect1, rect2) {
  const r1Left = rect1.x - (rect1.width || 0) / 2;
  const r1Right = rect1.x + (rect1.width || 0) / 2;
  const r1Bottom = rect1.y;
  const r1Top = rect1.y + (rect1.height || 0);

  const r2Left = rect2.x - (rect2.width || 0) / 2;
  const r2Right = rect2.x + (rect2.width || 0) / 2;
  const r2Bottom = rect2.y - (rect2.height || 14);
  const r2Top = rect2.y;

  const isOverlapX = (r1Left < r2Right) && (r1Right > r2Left);
  const isOverlapY = (r1Bottom < r2Top) && (r1Top > r2Bottom);

  return isOverlapX && isOverlapY;
}

/**
 * Kiểm tra xem nhân vật (người chơi hoặc bot) có tiếp đất thành công lên mặt bệ hay không
 */
export function isLandingOnPlatform(player, platform) {
  // Chỉ tiếp đất khi nhân vật đang RƠI XUỐNG (vy < 0)
  if (player.vy >= 0) {
    return false;
  }

  // Tọa độ mép trái và phải của bệ đỡ
  const platformHalfWidth = (platform.width || 75) / 2;
  const platformLeft = platform.x - platformHalfWidth;
  const platformRight = platform.x + platformHalfWidth;

  // Tọa độ mép trái và phải của nhân vật (thu gọn 4px mép để va chạm tự nhiên hơn)
  const playerHalfWidth = (player.width || 46) / 2;
  const playerLeft = player.x - playerHalfWidth + 4;
  const playerRight = player.x + playerHalfWidth - 4;

  // Nếu trượt hẳn ra ngoài mép bệ theo chiều ngang thì không tiếp đất
  if (playerRight <= platformLeft) {
    return false;
  }
  if (playerLeft >= platformRight) {
    return false;
  }

  // Kiểm tra chân chạm mặt bệ theo trục Y
  // platform.y là cao độ mặt trên của bệ đỡ
  const previousY = player.prevY !== undefined 
    ? player.prevY 
    : (player.y - player.vy * 0.016);

  const isFallingThroughTop = previousY >= platform.y - 6;
  const isWithinTopThreshold = player.y <= platform.y + 16;
  const isAboveBottomThreshold = player.y >= platform.y - 28;

  if (isFallingThroughTop && isWithinTopThreshold && isAboveBottomThreshold) {
    return true;
  }

  return false;
}
