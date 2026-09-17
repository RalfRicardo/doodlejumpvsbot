// frontend/src/game/index.js
// TRUNG TÂM CẤU HÌNH HẰNG SỐ VẬT LÝ & GAMEPLAY
// 👉 TẤT CẢ CÁC THÔNG SỐ ĐƯỢC QUẢN LÝ TẬP TRUNG TẠI ĐÂY
// 👉 KHI CHỈNH SỬA Ở ĐÂY, TOÀN BỘ GAME (BOTS, WORLD, PHYSICS, RENDER...) SẼ TỰ ĐỘNG THAY ĐỔI THEO

// =============================================================================
// 1. CẤU HÌNH MÀN HÌNH & GIAO DIỆN (SCREEN CONFIGURATION)
// =============================================================================
export const SCREEN_WIDTH = 960;         // Chiều rộng khung hình game (px)
export const SCREEN_HEIGHT = 540;        // Chiều cao khung hình game (px)
export const TARGET_HEIGHT = 3000;       // Độ cao mục tiêu (m)
export const MAX_TIME = 180;             // Thời gian tối đa (giây)
export const HUD_SNAPSHOT = 100;
export const FIXED_DT = 1 / 60;          // Bước thời gian chuẩn 60 FPS
export const CAMERA_SIGHT_RATIO = 0.45;  // Vạch cuộn camera (45% chiều cao màn hình từ trên xuống)
export const GRID_SIZE = 32;             // Kích thước ô vuông sổ kẻ caro nền

// =============================================================================
// 2. HỆ VẬT LÝ & CHUYỂN ĐỘNG (PHYSICS & KINEMATICS)
// =============================================================================
export const GRAVITY = 850;              // Trọng lực rơi tự do (px/s^2)
export const JUMP_VELOCITY = 560;        // Vận tốc nảy chuẩn khi dẫm lên bệ (px/s)
export const SPRING_JUMP_VELOCITY = 850; // Vận tốc nảy cực đại khi dẫm lò xo (px/s)
export const ACCE = 1800;                // Gia tốc tăng tốc di chuyển ngang (px/s^2)
export const MASATTRUOT = 2000;          // Ma sát trượt hãm phanh khi nhả phím (px/s^2)
export const MAX_VX = 420;               // Vận tốc ngang tối đa của người chơi (px/s)
export const MAX_VY = 950;               // Vận tốc rơi tối đa (px/s)

// =============================================================================
// 3. THÔNG SỐ NGƯỜI CHƠI (PLAYER CONFIGURATION)
// =============================================================================
export const PLAYER_WIDTH = 46;          // Chiều rộng nhân vật người chơi (px)
export const PLAYER_HEIGHT = 46;         // Chiều cao nhân vật người chơi (px)

// =============================================================================
// 4. THÔNG SỐ BỆ ĐỠ & THUẬT TOÁN SINH BỆ (PLATFORM CONFIGURATION)
// =============================================================================
export const P_HEIGHT = 14;              // Chiều dày bệ đỡ (px)
export const P_WIDTH_MIN = 64;           // Chiều rộng bệ tối thiểu (px)
export const P_WIDTH_MAX = 82;           // Chiều rộng bệ tối đa (px)
export const P_MOVING_SPEED = 70;        // Vận tốc di chuyển tuần tra của bệ di chuyển (px/s)
export const PLATFORM_SAFE_GAP = 12;     // Khoảng cách an toàn tối thiểu chống đè bệ (px)

// Bước nhảy cao giữa các tầng bệ
export const STEP_Y_MIN = 72;            // Khoảng cách cao tối thiểu giữa 2 tầng bệ (px)
export const STEP_Y_MAX = 92;            // Khoảng cách cao tối đa giữa 2 tầng bệ (px)

// Bệ xuất phát đáy màn hình
export const PLATFORM_START_WIDTH = 180; // Chiều rộng bệ xuất phát ở đáy (px)
export const PLATFORM_START_Y = 460;     // Tọa độ Y bệ xuất phát ở đáy (px)

// Cơ chế bệ vỡ
export const BREAKABLE_COUNTDOWN = 1.2;  // Thời gian đếm ngược sau khi dẫm vào bệ vỡ (1.2 giây theo yêu cầu)
export const BREAKABLE_DELAY = 200;      // Thời gian trễ kích hoạt
export const DISAPPEAR_DELAY = 800;      // Thời gian mảnh vỡ tan biến hoàn toàn (ms)
export const PLATFORM_CLEANUP_OFFSET = 50; // Khoảng đệm dọn dẹp bệ trôi khỏi đáy màn hình (px)
export const OUTPACED_DISTANCE = 380;    // LUẬT BỎ XA (HARDCORE): Bị người chơi bỏ xa >= 380px là bị loại ngay (px)

// =============================================================================
// 5. THÔNG SỐ VÀ CẤU HÌNH 4 CÁ TÍNH BOT (BOT CONFIGURATION)
// =============================================================================
export const BOT_WIDTH = 44;             // Chiều rộng Bot (px)
export const BOT_HEIGHT = 44;            // Chiều cao Bot (px)
export const BOT_ACCEL = 1800;           // Gia tốc di chuyển ngang mượt mà của Bot (px/s^2)

// Bảng màu nhận diện 4 loại Bot
export const BOT_COLORS = {
  NOVICE: '#3498db',      // Xanh dương
  STANDARD: '#9b59b6',    // Tím
  SPEEDRUNNER: '#e67e22', // Cam
  PERFECT: '#e74c3c',     // Đỏ
};

// Hồ sơ chi tiết 4 cá tính Bot (Nhạy bén, leo tốt cùng người chơi, có cơ chế cân bằng bắt kịp)
export const BOT_PROFILES = {
  // THẦY SƠN (NOVICE): Tốc độ ổn định (72%), chủ yếu nhảy từng bậc gần
  NOVICE: {
    name: 'Thầy Sơn',
    speedMultiplier: 0.72,
    maxJumpReach: 170,
    reactionDelay: 0.08,
    aimOffset: 16,
    strategy: 'nearest_wide',
    skipJumpChance: 0.0,
  },

  // THẦY VIỆT (STANDARD): Nhanh nhẹn (80%), thỉnh thoảng ngập ngừng
  STANDARD: {
    name: 'Thầy Việt',
    speedMultiplier: 0.80,
    maxJumpReach: 175,
    reactionDelay: 0.06,
    aimOffset: 10,
    strategy: 'safe_balanced',
    skipJumpChance: 0.05,
  },

  // THẦY HIỆP (SPEEDRUNNER): Rất nhanh (90%) và quyết đoán, chọn bệ cao nhưng có tính toán
  SPEEDRUNNER: {
    name: 'Thầy Hiệp',
    speedMultiplier: 0.90,
    maxJumpReach: 170,
    reactionDelay: 0.04,
    aimOffset: 5,
    strategy: 'highest_aggressive',
    skipJumpChance: 0.12,
  },

  // THẦY NAM (PERFECT): Bay cực chuẩn, tốc độ cao (86%), né tranh chấp bệ
  PERFECT: {
    name: 'Thầy Nam',
    speedMultiplier: 0.86,
    maxJumpReach: 180,
    reactionDelay: 0.03,
    aimOffset: 2,
    strategy: 'optimal_uncontested',
    skipJumpChance: 0.10,
  },
};
