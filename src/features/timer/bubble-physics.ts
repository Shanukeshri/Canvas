export interface PhysicsBubble {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  radius: number;
  isDragging?: boolean;
}

export interface PhysicsWorldConfig {
  centerX: number;
  centerY: number;
  orbitRadius: number;
  springStrength: number; // e.g. 0.05
  damping: number; // e.g. 0.85
  collisionRepulsion: number; // e.g. 0.5
  centerRepulsionRadius: number; // Central timer avoidance radius
}

/**
 * Calculates target orbital positions for N participant bubbles distributed symmetrically around center
 */
export function calculateTargetOrbitPositions(
  count: number,
  centerX: number,
  centerY: number,
  orbitRadius: number
): { targetX: number; targetY: number }[] {
  if (count === 0) return [];
  const angleStep = (2 * Math.PI) / count;
  // Offset start angle to start at top-right (-PI/4)
  const baseAngle = -Math.PI / 4;

  return Array.from({ length: count }, (_, i) => {
    const angle = baseAngle + i * angleStep;
    return {
      targetX: centerX + Math.cos(angle) * orbitRadius,
      targetY: centerY + Math.sin(angle) * orbitRadius,
    };
  });
}

/**
 * Advances physics world by one delta tick (pure, mutate in-place or return updated)
 */
export function stepPhysicsWorld(
  bubbles: PhysicsBubble[],
  config: PhysicsWorldConfig,
  reducedMotion: boolean = false
): PhysicsBubble[] {
  if (reducedMotion) {
    // Snap instantly to targets without simulation
    for (const b of bubbles) {
      if (!b.isDragging) {
        b.x = b.targetX;
        b.y = b.targetY;
        b.vx = 0;
        b.vy = 0;
      }
    }
    return bubbles;
  }

  // 1. Spring forces toward target orbital positions
  for (const b of bubbles) {
    if (b.isDragging) continue;

    const dx = b.targetX - b.x;
    const dy = b.targetY - b.y;

    b.vx += dx * config.springStrength;
    b.vy += dy * config.springStrength;

    // Center repulsion (avoid colliding into the main user timer)
    const distToCenter = Math.hypot(b.x - config.centerX, b.y - config.centerY);
    if (distToCenter < config.centerRepulsionRadius && distToCenter > 0.001) {
      const repelForce = (config.centerRepulsionRadius - distToCenter) * 0.1;
      const nx = (b.x - config.centerX) / distToCenter;
      const ny = (b.y - config.centerY) / distToCenter;
      b.vx += nx * repelForce;
      b.vy += ny * repelForce;
    }
  }

  // 2. Collision avoidance between bubbles
  for (let i = 0; i < bubbles.length; i++) {
    for (let j = i + 1; j < bubbles.length; j++) {
      const b1 = bubbles[i];
      const b2 = bubbles[j];

      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const dist = Math.hypot(dx, dy);
      const minDist = b1.radius + b2.radius + 12; // with padding

      if (dist < minDist && dist > 0.001) {
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        const force = overlap * config.collisionRepulsion;

        if (!b1.isDragging) {
          b1.vx -= nx * force * 0.5;
          b1.vy -= ny * force * 0.5;
        }
        if (!b2.isDragging) {
          b2.vx += nx * force * 0.5;
          b2.vy += ny * force * 0.5;
        }
      }
    }
  }

  // 3. Apply velocity and damping
  for (const b of bubbles) {
    if (!b.isDragging) {
      b.vx *= config.damping;
      b.vy *= config.damping;

      b.x += b.vx;
      b.y += b.vy;
    }
  }

  return bubbles;
}
