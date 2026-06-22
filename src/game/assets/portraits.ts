import Phaser from 'phaser';
import type { EnemyInstance } from '../types/enemy';

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

  graphics.fillStyle(0x070916, 0.96).fillRoundedRect(-86, -96, 172, 190, 6);
  graphics.lineStyle(3, primary, 0.85).strokeRoundedRect(-86, -96, 172, 190, 6);
  graphics.lineStyle(1, accent, 0.28).strokeRoundedRect(-76, -86, 152, 170, 2);
  drawPixelNoise(graphics, primary, visual.shape);

  drawSilhouette(graphics, visual, primary, secondary, accent);

  const glyph = scene.add
    .text(0, 4, visual.glyph, {
      fontFamily: 'Courier New, monospace',
      fontSize: visual.glyph.length > 2 ? '22px' : '34px',
      color: '#f8fafc',
      fontStyle: 'bold',
      align: 'center'
    })
    .setOrigin(0.5)
    .setAlpha(0.95);
  container.add(glyph);

  const scan = scene.add.rectangle(0, -5, 148, 3, primary, 0.28);
  container.add(scan);
  scene.tweens.add({
    targets: scan,
    y: 68,
    alpha: 0.06,
    yoyo: true,
    repeat: -1,
    duration: 1700,
    ease: 'Sine.easeInOut'
  });

  return container;
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
