// frontend/src/game/collision.js
// MODULE PHÁT HIỆN VA CHẠM (COLLISION DETECTION)

export function checkAABB(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

export function isLandingOnPlatform(player, platform) {
  if (player.vy <= 0) return false;
  if (!checkAABB(player, platform)) return false;
  const playerBottom = player.y + player.height;
  const platformCenterY = platform.y + platform.height / 2;
  return playerBottom <= platformCenterY;
}
