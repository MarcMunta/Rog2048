import Phaser from 'phaser';
import { gameStore } from '../systems/GameStore';
import type { BoardTile } from '../types/board';

interface TileTheme {
  fill: number;
  accent: number;
  text: string;
}

const TILE_THEMES: Record<number, TileTheme> = {
  2: { fill: 0x13213a, accent: 0x40f6d2, text: '#f8fafc' },
  4: { fill: 0x0f3342, accent: 0x67e8f9, text: '#f8fafc' },
  8: { fill: 0x0f5b55, accent: 0xa3e635, text: '#f8fafc' },
  16: { fill: 0x0e7490, accent: 0x40f6d2, text: '#f8fafc' },
  32: { fill: 0x5b21b6, accent: 0xb388ff, text: '#f8fafc' },
  64: { fill: 0xa21caf, accent: 0xff4d8d, text: '#f8fafc' },
  128: { fill: 0xc2410c, accent: 0xffcc66, text: '#fff7ed' },
  256: { fill: 0xb91c1c, accent: 0xff4d8d, text: '#fff7ed' },
  512: { fill: 0xfacc15, accent: 0xffcc66, text: '#080816' },
  1024: { fill: 0xf8fafc, accent: 0x67e8f9, text: '#080816' },
  2048: { fill: 0x67e8f9, accent: 0xffcc66, text: '#080816' }
};

const CURSED_THEME: TileTheme = { fill: 0x4c0519, accent: 0xff4d8d, text: '#fff1f2' };

export class TileView extends Phaser.GameObjects.Container {
  readonly tileId: string;
  private readonly glow: Phaser.GameObjects.Rectangle;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly sheen: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly lockLabel: Phaser.GameObjects.Text;
  private shimmerTween: Phaser.Tweens.Tween | null = null;
  private shimmerValue = 0;

  constructor(scene: Phaser.Scene, tile: BoardTile, size: number) {
    super(scene, 0, 0);
    this.tileId = tile.id;
    const theme = this.themeFor(tile);
    this.glow = scene.add.rectangle(0, 0, size + 18, size + 18, theme.accent, 0);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.background = scene.add.rectangle(0, 0, size, size, theme.fill, 1);
    this.frame = scene.add.graphics();
    this.sheen = scene.add.rectangle(-size * 0.18, -size * 0.34, size * 0.48, Math.max(2, size * 0.025), 0xffffff, 0.18);
    this.sheen.setAngle(-18);
    this.label = scene.add
      .text(0, -2, String(tile.value), {
        fontFamily: 'Courier New, monospace',
        fontSize: `${Math.max(18, size * 0.3)}px`,
        color: theme.text,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.lockLabel = scene.add
      .text(size * 0.31, -size * 0.32, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: `${Math.max(12, size * 0.18)}px`,
        color: '#fef3c7',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.add([this.glow, this.background, this.frame, this.sheen, this.label, this.lockLabel]);
    scene.add.existing(this);
    this.updateTile(tile, size);
  }

  updateTile(tile: BoardTile, size: number): void {
    const theme = this.themeFor(tile);
    const glowAlpha = this.glowAlpha(tile);
    this.glow.setSize(size + 20, size + 20).setFillStyle(theme.accent, glowAlpha);
    this.background.setSize(size - 3, size - 3).setFillStyle(theme.fill, 0.98);
    this.sheen
      .setPosition(-size * 0.2, -size * 0.34)
      .setSize(size * 0.52, Math.max(2, size * 0.024))
      .setFillStyle(0xffffff, tile.value >= 64 ? 0.24 : 0.14);
    this.drawFrame(tile, size, theme);

    const valueText = String(tile.value);
    this.label.setText(valueText);
    this.label.setFontSize(Math.max(18, size * (valueText.length > 3 ? 0.21 : 0.31)));
    this.label.setColor(theme.text);
    this.label.setShadow(0, 0, this.hex(theme.accent), tile.value >= 64 ? 9 : 3, true, true);

    this.lockLabel.setPosition(size * 0.31, -size * 0.32);
    this.lockLabel.setFontSize(Math.max(12, size * 0.18));
    this.lockLabel.setColor(tile.cursed ? '#ff4d8d' : '#fef3c7');
    this.lockLabel.setText(tile.lockedTurns > 0 ? '#' : tile.cursed ? '!' : '');
    this.updateShimmer(tile);
  }

  override destroy(fromScene?: boolean): void {
    this.shimmerTween?.stop();
    this.shimmerTween = null;
    super.destroy(fromScene);
  }

  private drawFrame(tile: BoardTile, size: number, theme: TileTheme): void {
    const half = size / 2;
    const cut = Math.max(7, size * 0.09);
    this.frame.clear();
    this.frame.lineStyle(tile.lockedTurns > 0 ? 4 : 2, tile.lockedTurns > 0 ? 0xfef3c7 : theme.accent, tile.value >= 64 ? 0.82 : 0.42);
    this.frame.beginPath();
    this.frame.moveTo(-half + cut, -half);
    this.frame.lineTo(half - cut, -half);
    this.frame.lineTo(half, -half + cut);
    this.frame.lineTo(half, half - cut);
    this.frame.lineTo(half - cut, half);
    this.frame.lineTo(-half + cut, half);
    this.frame.lineTo(-half, half - cut);
    this.frame.lineTo(-half, -half + cut);
    this.frame.closePath();
    this.frame.strokePath();
    this.frame.fillStyle(0xffffff, tile.value >= 128 ? 0.08 : 0.045);
    this.frame.fillRect(-half + cut, -half + 7, size * 0.28, Math.max(2, size * 0.025));
    if (tile.cursed) {
      this.frame.lineStyle(2, 0xff4d8d, 0.7);
      this.frame.strokeLineShape(new Phaser.Geom.Line(-half + 9, half - 9, half - 9, -half + 9));
    }
  }

  private updateShimmer(tile: BoardTile): void {
    if (tile.value < 128 || gameStore.profile.settings.reducedMotion) {
      this.shimmerTween?.stop();
      this.shimmerTween = null;
      this.shimmerValue = 0;
      this.glow.setScale(1);
      return;
    }
    if (this.shimmerTween && this.shimmerValue === tile.value) return;
    this.shimmerTween?.stop();
    this.shimmerValue = tile.value;
    this.shimmerTween = this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: this.glowAlpha(tile) * 0.65, to: Math.min(0.55, this.glowAlpha(tile) + 0.16) },
      scale: { from: 1, to: 1.06 },
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: 'Sine.easeInOut'
    });
  }

  private themeFor(tile: BoardTile): TileTheme {
    if (tile.cursed) return CURSED_THEME;
    return TILE_THEMES[tile.value] ?? { fill: 0xf8fafc, accent: 0xffcc66, text: '#080816' };
  }

  private glowAlpha(tile: BoardTile): number {
    if (tile.cursed) return 0.22;
    if (tile.value >= 512) return 0.4;
    if (tile.value >= 128) return 0.28;
    if (tile.value >= 64) return 0.18;
    return 0.07;
  }

  private hex(value: number): string {
    return `#${value.toString(16).padStart(6, '0')}`;
  }
}
