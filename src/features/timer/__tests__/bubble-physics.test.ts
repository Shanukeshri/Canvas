import { describe, it, expect } from 'vitest';
import {
  calculateTargetOrbitPositions,
  stepPhysicsWorld,
  PhysicsBubble,
  PhysicsWorldConfig,
} from '../bubble-physics';

describe('Bubble Orbit Physics Engine', () => {
  it('calculates symmetrical orbital target positions around center', () => {
    const targets = calculateTargetOrbitPositions(4, 500, 400, 200);
    expect(targets.length).toBe(4);

    // Each position should be at distance of 200 from (500, 400)
    for (const t of targets) {
      const dist = Math.hypot(t.targetX - 500, t.targetY - 400);
      expect(Math.round(dist)).toBe(200);
    }
  });

  it('applies spring forces pulling bubbles toward target coordinates', () => {
    const bubbles: PhysicsBubble[] = [
      {
        id: 'b1',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 100,
        targetY: 100,
        radius: 40,
      },
    ];

    const config: PhysicsWorldConfig = {
      centerX: 500,
      centerY: 500,
      orbitRadius: 200,
      springStrength: 0.1,
      damping: 0.8,
      collisionRepulsion: 0.5,
      centerRepulsionRadius: 150,
    };

    const updated = stepPhysicsWorld(bubbles, config, false);
    // Bubble should have positive velocity moving towards (100, 100)
    expect(updated[0].vx).toBeGreaterThan(0);
    expect(updated[0].vy).toBeGreaterThan(0);
    expect(updated[0].x).toBeGreaterThan(0);
    expect(updated[0].y).toBeGreaterThan(0);
  });

  it('snaps directly to target without simulation when reduced-motion is requested', () => {
    const bubbles: PhysicsBubble[] = [
      {
        id: 'b1',
        x: 0,
        y: 0,
        vx: 10,
        vy: 10,
        targetX: 350,
        targetY: 250,
        radius: 40,
      },
    ];

    const config: PhysicsWorldConfig = {
      centerX: 500,
      centerY: 500,
      orbitRadius: 200,
      springStrength: 0.1,
      damping: 0.8,
      collisionRepulsion: 0.5,
      centerRepulsionRadius: 150,
    };

    const updated = stepPhysicsWorld(bubbles, config, true);
    expect(updated[0].x).toBe(350);
    expect(updated[0].y).toBe(250);
    expect(updated[0].vx).toBe(0);
    expect(updated[0].vy).toBe(0);
  });
});
