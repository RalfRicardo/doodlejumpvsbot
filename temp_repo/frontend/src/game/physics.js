// frontend/src/game/physics.js
import { GRAVITY, MAX_VY, JUMP_VELOCITY, SCREEN_WIDTH, SCREEN_HEIGHT, BREAKABLE_COUNTDOWN } from './index.js';
import { checkAABB, isLandingOnPlatform } from './collision.js';

export const Kinematics = {
    velocityAt: (v0, g, t) => v0 - g * t,
    positionAt: (y0, v0, g, t) => y0 + v0 * t - 0.5 * g * t * t,
    peakTime: (v0, g) => v0 / g,
    maxHeight: (v0, g) => (v0 * v0) / (2 * g),
    airTime: (v0, g) => (2 * v0) / g,
    range: (vx, v0, g) => vx * ((2 * v0) / g)
};

export function applyPhysics(body, dt) {
    body.vy += GRAVITY * dt;
    if (body.vy > MAX_VY) {
        body.vy = MAX_VY;
    }
    body.x += body.vx * dt;
    body.y += body.vy * dt;
}

// =============================================================================
// 1. XỬ LÝ XUYÊN MÀN HÌNH (SCREEN WRAP-AROUND)
// =============================================================================
// Khi nhân vật bay ra khỏi mép trái sẽ xuất hiện lại ở mép phải và ngược lại.
export function handleScreenWrap(body, screenWidth = SCREEN_WIDTH) {
    const width = body.width || 44;
    if (body.x > screenWidth) {
        body.x = -width;
    } else if (body.x + width < 0) {
        body.x = screenWidth;
    }
}

// Wrapper phát hiện va chạm AABB
export function detectCollision(a, b) {
    return checkAABB(a, b);
}

// =============================================================================
// 2. XỬ LÝ TIẾP ĐẤT & BẬT NẢY TRÊN BỆ (PLATFORM COLLISIONS)
// =============================================================================
// - Sử dụng isLandingOnPlatform từ collision.js để kiểm tra tiếp đất khi rơi xuống.
// - Bệ vỡ: có thể nhảy được, khi chạm chân sẽ bắt đầu đếm ngược BREAKABLE_COUNTDOWN (2s) rồi mới vỡ.
export function handlePlatformCollisions(entity, platforms, onBounce = null, maxFallY = SCREEN_HEIGHT) {
    if (entity.y >= maxFallY) return;
    if (!Array.isArray(platforms)) return;

    for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];

        // Bỏ qua bệ ngoài vùng giới hạn hoặc bệ đã vỡ vụn
        if (p.broken) continue;
        if (p.y >= maxFallY) continue;

        // Điều kiện tiếp đất an toàn
        const isLanding = isLandingOnPlatform(entity, p) || (
            entity.vy > 0 &&
            entity.prevBottom !== undefined &&
            entity.prevBottom <= p.y + 12 &&
            entity.y + entity.height >= p.y - 2 &&
            entity.x + entity.width - 4 > p.x &&
            entity.x + 4 < p.x + p.width
        );

        if (isLanding) {
            // Nảy cao bổng bằng vận tốc JUMP_VELOCITY chuẩn cấu hình ở index.js
            entity.y = p.y - entity.height;
            entity.vy = -Math.abs(JUMP_VELOCITY);

            // Bệ vỡ: Đạp trúng bắt đầu kích hoạt đếm ngược
            if (p.type === 'breakable' && !p.isTriggered) {
                p.isTriggered = true;
                p.countdown = BREAKABLE_COUNTDOWN; // Đếm ngược thời gian từ index.js
            }

            if (typeof onBounce === 'function') {
                onBounce(entity, p);
            }
            break;
        }
    }
}
