import Phaser from 'phaser';
import { gameStore } from '../systems/GameStore';
import type { EnemyInstance } from '../types/enemy';
import {
  createEnemySprite,
  playEnemySpriteAnimation,
  type EnemySpriteAnimation
} from './generated/characters/EnemySpriteFactory';

export type PortraitShape = 'mask' | 'beast' | 'imp' | 'mirror' | 'thief' | 'hex' | 'armor' | 'dealer' | 'specter' | 'calc' | 'jaw' | 'nun' | 'crown' | 'oracle' | 'core';

export interface EnemyVisualDefinition {
  shape: PortraitShape;
  glyph: string;
  eyeCount: 1 | 2 | 3;
  horns: boolean;
  crown: boolean;
}

export const ENEMY_VISUALS: Record<string, EnemyVisualDefinition> = {
  hollowClerk: { shape: 'mask', glyph: '∑', eyeCount: 2, horns: false, crown: false },
  rustRat: { shape: 'beast', glyph: '¢', eyeCount: 2, horns: false, crown: false },
  numberImp: { shape: 'imp', glyph: '≡', eyeCount: 2, horns: true, crown: false },
  mirrorMouth: { shape: 'mirror', glyph: '◊', eyeCount: 1, horns: false, crown: false },
  cellThief: { shape: 'thief', glyph: '⌁', eyeCount: 2, horns: false, crown: false },
  hexWeaver: { shape: 'hex', glyph: '✶', eyeCount: 3, horns: false, crown: false },
  ironAccount: { shape: 'armor', glyph: '▣', eyeCount: 2, horns: false, crown: false },
  ashDealer: { shape: 'dealer', glyph: '♢', eyeCount: 2, horns: false, crown: false },
  titheSpecter: { shape: 'specter', glyph: '%', eyeCount: 1, horns: false, crown: false },
  graveCalculator: { shape: 'calc', glyph: '⌘', eyeCount: 2, horns: true, crown: false },
  lockjawPrime: { shape: 'jaw', glyph: '◆', eyeCount: 2, horns: true, crown: true },
  entropyNun: { shape: 'nun', glyph: '☿', eyeCount: 3, horns: false, crown: true },
  bossAct1: { shape: 'crown', glyph: '16', eyeCount: 2, horns: true, crown: true },
  bossAct2: { shape: 'oracle', glyph: '∞', eyeCount: 3, horns: false, crown: true },
  bossAct3: { shape: 'core', glyph: '2048', eyeCount: 3, horns: true, crown: true }
};

export function createEnemyPortrait(scene: Phaser.Scene, enemy: EnemyInstance): Phaser.GameObjects.Container {
  const visual = ENEMY_VISUALS[enemy.id] ?? ENEMY_VISUALS.hollowClerk;
  const container = scene.add.container(0, 0);
  const graphics = scene.add.graphics();
  container.add(graphics);

  const primary = enemy.palette.primary;
  const secondary = enemy.palette.secondary;
  const accent = enemy.palette.accent;

  const aura = scene.add.ellipse(0, -8, enemy.rank === 'boss' ? 210 : 184, enemy.rank === 'boss' ? 232 : 206, primary, enemy.rank === 'boss' ? 0.13 : 0.08);
  aura.setBlendMode(Phaser.BlendModes.ADD);
  container.add(aura);
  if (!gameStore.profile.settings.reducedMotion) {
    scene.tweens.add({
      targets: aura,
      alpha: enemy.rank === 'boss' ? { from: 0.08, to: 0.2 } : { from: 0.04, to: 0.12 },
      scaleX: { from: 0.94, to: 1.06 },
      scaleY: { from: 0.98, to: 1.04 },
      yoyo: true,
      repeat: -1,
      duration: enemy.rank === 'boss' ? 1100 : 1700,
      ease: 'Sine.easeInOut'
    });
  }

  graphics.fillStyle(0x070916, 0.96).fillRoundedRect(-86, -96, 172, 190, 6);
  graphics.lineStyle(3, primary, 0.85).strokeRoundedRect(-86, -96, 172, 190, 6);
  graphics.lineStyle(1, accent, 0.28).strokeRoundedRect(-76, -86, 152, 170, 2);
  if (enemy.rank !== 'normal') {
    graphics.lineStyle(enemy.rank === 'boss' ? 3 : 2, accent, enemy.rank === 'boss' ? 0.62 : 0.44);
    graphics.strokeRoundedRect(-96, -106, 192, 210, enemy.rank === 'boss' ? 2 : 4);
    graphics.fillStyle(primary, 0.18);
    graphics.fillTriangle(-96, -106, -68, -106, -96, -78);
    graphics.fillTriangle(96, 104, 68, 104, 96, 76);
  }
  drawPixelNoise(graphics, primary, visual.shape);

  const sprite = createEnemySprite(scene, enemy, visual);
  container.add(sprite);
  container.add(createEyePulse(scene, visual.eyeCount, primary, accent));
  container.setData('enemySprite', sprite);

  const scan = scene.add.rectangle(0, -5, 148, 3, primary, 0.28);
  container.add(scan);
  if (!gameStore.profile.settings.reducedMotion) {
    scene.tweens.add({
      targets: scan,
      y: 68,
      alpha: 0.06,
      yoyo: true,
      repeat: -1,
      duration: 1700,
      ease: 'Sine.easeInOut'
    });
  }

  return container;
}

export function playEnemyPortraitAnimation(container: Phaser.GameObjects.Container, animation: EnemySpriteAnimation): void {
  playEnemySpriteAnimation((container.getData('enemySprite') as Phaser.GameObjects.Sprite | undefined) ?? null, animation);
}

function createEyePulse(scene: Phaser.Scene, count: number, primary: number, accent: number): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0);
  const positions = count === 1 ? [0] : count === 2 ? [-24, 24] : [-32, 0, 32];
  positions.forEach((x, index) => {
    const eye = scene.add.rectangle(x, -22, 18, 3, accent, 0.78).setBlendMode(Phaser.BlendModes.ADD);
    const core = scene.add.rectangle(x, -22, 8, 2, primary, 0.88).setBlendMode(Phaser.BlendModes.ADD);
    layer.add([eye, core]);
    if (!gameStore.profile.settings.reducedMotion) {
      scene.tweens.add({
        targets: [eye, core],
        alpha: { from: 0.32, to: 0.98 },
        scaleX: { from: 0.72, to: 1.18 },
        yoyo: true,
        repeat: -1,
        delay: index * 140,
        duration: 620,
        ease: 'Sine.easeInOut'
      });
    }
  });
  return layer;
}

function drawSilhouette(
  graphics: Phaser.GameObjects.Graphics,
  visual: EnemyVisualDefinition,
  primary: number,
  secondary: number,
  accent: number
): void {
  graphics.fillStyle(secondary, 1);
  if (visual.shape === 'core') {
    graphics.fillCircle(0, -18, 64);
    graphics.fillStyle(primary, 0.42).fillCircle(0, -18, 44);
    graphics.lineStyle(3, primary, 0.95).strokeCircle(0, -18, 66);
    graphics.lineStyle(2, accent, 0.65).strokeCircle(0, -18, 28);
  } else if (visual.shape === 'jaw') {
    graphics.fillRoundedRect(-58, -60, 116, 112, 12);
    graphics.fillStyle(0x070916, 1).fillTriangle(-52, 18, -28, 48, -4, 18);
    graphics.fillTriangle(4, 18, 28, 48, 52, 18);
  } else if (visual.shape === 'mirror') {
    graphics.fillEllipse(0, -18, 104, 128);
    graphics.lineStyle(4, primary, 0.9).strokeEllipse(0, -18, 104, 128);
  } else if (visual.shape === 'specter') {
    graphics.fillRoundedRect(-46, -66, 92, 114, 28);
    graphics.fillTriangle(-46, 35, -24, 66, -2, 35);
    graphics.fillTriangle(0, 35, 22, 66, 44, 35);
  } else if (visual.shape === 'armor') {
    graphics.fillRoundedRect(-58, -62, 116, 128, 8);
    graphics.lineStyle(3, primary, 0.7).strokeRect(-36, -38, 72, 76);
  } else {
    graphics.fillRoundedRect(-54, -64, 108, 124, 18);
  }

  if (visual.horns) {
    graphics.fillStyle(primary, 1).fillTriangle(-52, -50, -30, -92, -16, -50);
    graphics.fillTriangle(52, -50, 30, -92, 16, -50);
  }
  if (visual.crown) {
    graphics.fillStyle(accent, 0.92).fillTriangle(-36, -72, -22, -102, -8, -72);
    graphics.fillTriangle(-10, -72, 0, -112, 10, -72);
    graphics.fillTriangle(8, -72, 22, -102, 36, -72);
  }

  drawEyes(graphics, visual.eyeCount, primary, accent);

  graphics.fillStyle(primary, 0.82).fillRect(-42, 42, 84, 10);
  graphics.fillStyle(0x070916, 1);
  for (let i = 0; i < 6; i += 1) {
    graphics.fillRect(-34 + i * 14, 42, 7, 10);
  }
}

function drawEyes(graphics: Phaser.GameObjects.Graphics, count: number, primary: number, accent: number): void {
  const positions = count === 1 ? [0] : count === 2 ? [-24, 24] : [-32, 0, 32];
  positions.forEach((x) => {
    graphics.fillStyle(accent, 1).fillRect(x - 9, -28, 18, 12);
    graphics.fillStyle(primary, 1).fillRect(x - 5, -25, 10, 6);
    graphics.fillStyle(0x070916, 1).fillRect(x - 2, -24, 4, 4);
  });
}

function drawPixelNoise(graphics: Phaser.GameObjects.Graphics, color: number, shape: PortraitShape): void {
  const seed = shape.length * 17;
  for (let i = 0; i < 18; i += 1) {
    const x = -72 + ((i * 37 + seed) % 144);
    const y = -82 + ((i * 29 + seed) % 164);
    graphics.fillStyle(color, i % 2 === 0 ? 0.14 : 0.08).fillRect(x, y, 4, 4);
  }
}
