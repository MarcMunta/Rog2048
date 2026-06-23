import Phaser from 'phaser';
import type { EnemyInstance } from '../../../types/enemy';
import type { EnemyVisualDefinition, PortraitShape } from '../../portraits';

export type EnemySpriteAnimation = 'idle' | 'hit' | 'attack' | 'phase' | 'defeat';

const FRAME_SIZE = 128;
const FRAMES_PER_ANIM = 4;
const ANIM_ORDER: Exclude<EnemySpriteAnimation, 'defeat'>[] = ['idle', 'hit', 'attack', 'phase'];

interface DrawPalette {
  primary: string;
  secondary: string;
  accent: string;
  shadow: string;
  bone: string;
}

export function createEnemySprite(
  scene: Phaser.Scene,
  enemy: EnemyInstance,
  visual: EnemyVisualDefinition
): Phaser.GameObjects.Sprite {
  const textureKey = `generated-enemy-${enemy.id}`;
  ensureEnemySheet(scene, textureKey, enemy, visual);
  ensureEnemyAnimations(scene, textureKey);
  const sprite = scene.add.sprite(0, -12, textureKey, 'idle-0').setOrigin(0.5).setScale(enemy.rank === 'boss' ? 1.16 : 1.05);
  sprite.setData('generatedEnemyTexture', textureKey);
  sprite.play(animKey(textureKey, 'idle'));
  return sprite;
}

export function playEnemySpriteAnimation(sprite: Phaser.GameObjects.Sprite | null, animation: EnemySpriteAnimation): void {
  if (!sprite) return;
  const textureKey = sprite.getData('generatedEnemyTexture') as string | undefined;
  if (!textureKey) return;
  const key = animKey(textureKey, animation === 'defeat' ? 'phase' : animation);
  if (!sprite.scene.anims.exists(key)) return;
  sprite.play(key, true);
  if (animation !== 'idle') {
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (sprite.active) sprite.play(animKey(textureKey, 'idle'), true);
    });
  }
}

function ensureEnemySheet(scene: Phaser.Scene, textureKey: string, enemy: EnemyInstance, visual: EnemyVisualDefinition): void {
  if (scene.textures.exists(textureKey)) return;
  const texture = scene.textures.createCanvas(textureKey, FRAME_SIZE * FRAMES_PER_ANIM * ANIM_ORDER.length, FRAME_SIZE);
  if (!texture) return;
  const canvas = texture.getSourceImage() as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const palette = paletteFor(enemy);
  ANIM_ORDER.forEach((animation, animIndex) => {
    for (let frame = 0; frame < FRAMES_PER_ANIM; frame += 1) {
      const absolute = animIndex * FRAMES_PER_ANIM + frame;
      const offsetX = absolute * FRAME_SIZE;
      drawFrame(ctx, offsetX, enemy, visual, palette, animation, frame);
      texture.add(`${animation}-${frame}`, 0, offsetX, 0, FRAME_SIZE, FRAME_SIZE);
    }
  });
  texture.refresh();
}

function ensureEnemyAnimations(scene: Phaser.Scene, textureKey: string): void {
  ANIM_ORDER.forEach((animation) => {
    const key = animKey(textureKey, animation);
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: frameKeys(textureKey, animation),
      frameRate: animation === 'idle' ? 5 : 12,
      repeat: animation === 'idle' || animation === 'phase' ? -1 : 0
    });
  });
}

function frameKeys(textureKey: string, animation: Exclude<EnemySpriteAnimation, 'defeat'>): Phaser.Types.Animations.AnimationFrame[] {
  return [0, 1, 2, 3].map((frame) => ({ key: textureKey, frame: `${animation}-${frame}` }));
}

function animKey(textureKey: string, animation: Exclude<EnemySpriteAnimation, 'defeat'>): string {
  return `${textureKey}-${animation}`;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  enemy: EnemyInstance,
  visual: EnemyVisualDefinition,
  palette: DrawPalette,
  animation: Exclude<EnemySpriteAnimation, 'defeat'>,
  frame: number
): void {
  ctx.save();
  ctx.translate(offsetX, 0);
  const bob = animation === 'idle' ? [0, -2, 0, 2][frame] : 0;
  const squash = animation === 'attack' ? [1, 1.04, 0.94, 1][frame] : animation === 'hit' ? [1, 0.92, 1.06, 1][frame] : 1;
  const lean = animation === 'attack' ? [0, 4, -7, 0][frame] : animation === 'hit' ? [0, -6, 5, 0][frame] : 0;
  const phase = animation === 'phase';
  const hit = animation === 'hit' && frame === 1;
  ctx.translate(64 + lean, 66 + bob);
  ctx.scale(squash, 1 / squash);
  drawAura(ctx, enemy, palette, phase, frame);
  drawSilhouette(ctx, visual.shape, palette, hit, phase);
  drawHornsAndCrown(ctx, visual, palette, phase, frame);
  drawEyes(ctx, visual.eyeCount, palette, phase, frame);
  drawMouth(ctx, visual.shape, palette, animation, frame);
  drawGlyph(ctx, visual.glyph, palette, phase);
  if (animation === 'attack') drawAttackMarks(ctx, palette, frame);
  if (animation === 'hit') drawCrack(ctx, palette, frame);
  ctx.restore();
}

function drawAura(ctx: CanvasRenderingContext2D, enemy: EnemyInstance, palette: DrawPalette, phase: boolean, frame: number): void {
  const size = enemy.rank === 'boss' ? 48 + frame * 2 : 34 + frame;
  ctx.globalAlpha = phase ? 0.28 : enemy.rank === 'boss' ? 0.16 : 0.08;
  ctx.fillStyle = palette.primary;
  blockEllipse(ctx, -size, -size - 2, size * 2, size * 2 + 12);
  ctx.globalAlpha = 1;
}

function drawSilhouette(ctx: CanvasRenderingContext2D, shape: PortraitShape, palette: DrawPalette, hit: boolean, phase: boolean): void {
  ctx.fillStyle = hit ? palette.bone : palette.secondary;
  if (shape === 'core') {
    blockEllipse(ctx, -36, -44, 72, 72);
    ctx.fillStyle = phase ? palette.accent : palette.primary;
    blockEllipse(ctx, -22, -30, 44, 44);
    ctx.fillStyle = palette.shadow;
    blockEllipse(ctx, -9, -17, 18, 18);
    return;
  }
  if (shape === 'mirror') {
    blockEllipse(ctx, -32, -48, 64, 82);
  } else if (shape === 'specter') {
    roundBlock(ctx, -30, -50, 60, 76, 12);
    ctx.fillRect(-28, 23, 14, 14);
    ctx.fillRect(-4, 25, 14, 16);
    ctx.fillRect(18, 23, 12, 14);
  } else if (shape === 'jaw') {
    roundBlock(ctx, -38, -42, 76, 76, 8);
  } else if (shape === 'armor') {
    roundBlock(ctx, -38, -44, 76, 86, 4);
    ctx.fillStyle = palette.shadow;
    ctx.fillRect(-22, -22, 44, 46);
  } else if (shape === 'beast') {
    roundBlock(ctx, -36, -40, 72, 72, 14);
    ctx.fillRect(-48, -18, 14, 28);
    ctx.fillRect(34, -18, 14, 28);
  } else {
    roundBlock(ctx, -34, -44, 68, 82, 10);
  }
  ctx.fillStyle = phase ? palette.accent : palette.primary;
  ctx.fillRect(-26, 27, 52, 7);
  ctx.fillStyle = palette.shadow;
  for (let i = 0; i < 5; i += 1) ctx.fillRect(-22 + i * 11, 27, 5, 7);
}

function drawHornsAndCrown(ctx: CanvasRenderingContext2D, visual: EnemyVisualDefinition, palette: DrawPalette, phase: boolean, frame: number): void {
  if (visual.horns) {
    ctx.fillStyle = phase ? palette.bone : palette.primary;
    ctx.beginPath();
    ctx.moveTo(-34, -34);
    ctx.lineTo(-22, -61 - frame);
    ctx.lineTo(-10, -34);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(34, -34);
    ctx.lineTo(22, -61 - frame);
    ctx.lineTo(10, -34);
    ctx.closePath();
    ctx.fill();
  }
  if (visual.crown) {
    ctx.fillStyle = phase ? palette.accent : palette.bone;
    ctx.fillRect(-28, -53, 56, 7);
    ctx.beginPath();
    ctx.moveTo(-28, -53);
    ctx.lineTo(-18, -74 - frame);
    ctx.lineTo(-8, -53);
    ctx.lineTo(0, -79 - frame);
    ctx.lineTo(8, -53);
    ctx.lineTo(18, -74 - frame);
    ctx.lineTo(28, -53);
    ctx.closePath();
    ctx.fill();
  }
}

function drawEyes(ctx: CanvasRenderingContext2D, count: number, palette: DrawPalette, phase: boolean, frame: number): void {
  const positions = count === 1 ? [0] : count === 2 ? [-17, 17] : [-24, 0, 24];
  positions.forEach((x, index) => {
    const open = phase || frame % 3 !== 2 || index === 0;
    ctx.fillStyle = phase ? palette.bone : palette.accent;
    ctx.fillRect(x - 7, -21, 14, open ? 8 : 3);
    ctx.fillStyle = palette.primary;
    ctx.fillRect(x - 3, -19, 6, open ? 4 : 2);
  });
}

function drawMouth(
  ctx: CanvasRenderingContext2D,
  shape: PortraitShape,
  palette: DrawPalette,
  animation: Exclude<EnemySpriteAnimation, 'defeat'>,
  frame: number
): void {
  ctx.fillStyle = palette.shadow;
  const open = animation === 'attack' && frame >= 1;
  ctx.fillRect(-16, 8, 32, open ? 12 : 5);
  ctx.fillStyle = palette.bone;
  for (let i = 0; i < 4; i += 1) ctx.fillRect(-13 + i * 8, 8, 4, open ? 8 : 5);
  if (shape === 'jaw' && open) {
    ctx.fillStyle = palette.primary;
    ctx.fillRect(-28, 19, 56, 5);
  }
}

function drawGlyph(ctx: CanvasRenderingContext2D, glyph: string, palette: DrawPalette, phase: boolean): void {
  ctx.fillStyle = phase ? palette.shadow : palette.bone;
  ctx.font = glyph.length > 2 ? 'bold 13px monospace' : 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, 0, -1);
}

function drawAttackMarks(ctx: CanvasRenderingContext2D, palette: DrawPalette, frame: number): void {
  if (frame === 0) return;
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(34, -28 + frame * 4);
  ctx.lineTo(56, -8 + frame * 3);
  ctx.moveTo(-38, -26 + frame * 3);
  ctx.lineTo(-56, -4 + frame * 2);
  ctx.stroke();
}

function drawCrack(ctx: CanvasRenderingContext2D, palette: DrawPalette, frame: number): void {
  if (frame === 0) return;
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, -42);
  ctx.lineTo(-6, -26);
  ctx.lineTo(-14, -13);
  ctx.lineTo(2, 7);
  ctx.stroke();
}

function roundBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.lineTo(x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.lineTo(x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.lineTo(x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.closePath();
  ctx.fill();
}

function blockEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function paletteFor(enemy: EnemyInstance): DrawPalette {
  return {
    primary: hex(enemy.palette.primary),
    secondary: hex(enemy.palette.secondary),
    accent: hex(enemy.palette.accent),
    shadow: '#070916',
    bone: '#f8fafc'
  };
}

function hex(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`;
}
