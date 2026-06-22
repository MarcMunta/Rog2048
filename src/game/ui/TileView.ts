import Phaser from 'phaser';
import type { BoardTile } from '../types/board';

const TILE_COLORS: Record<number, number> = {
  2: 0x16243a,
  4: 0x12363f,
  8: 0x0f5b55,
  16: 0x0e7490,
  32: 0x7c3aed,
  64: 0xdb2777,
  128: 0xf59e0b,
  256: 0xef4444,
  512: 0xfacc15,
  1024: 0xf8fafc,
  2048: 0x67e8f9
};

export class TileView extends Phaser.GameObjects.Container {
  readonly tileId: string;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly lockLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, tile: BoardTile, size: number) {
    super(scene, 0, 0);
    this.tileId = tile.id;
    this.background = scene.add.rectangle(0, 0, size, size, this.colorFor(tile), 1).setStrokeStyle(3, 0xffffff, 0.18);
    this.label = scene.add
      .text(0, -2, String(tile.value), {
        fontFamily: 'Courier New, monospace',
        fontSize: `${Math.max(18, size * 0.3)}px`,
        color: tile.value >= 512 ? '#080816' : '#f8fafc',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.lockLabel = scene.add
      .text(size * 0.3, -size * 0.32, tile.lockedTurns > 0 ? '×' : tile.cursed ? '!' : '', {
        fontFamily: 'Courier New, monospace',
        fontSize: `${Math.max(12, size * 0.18)}px`,
        color: tile.cursed ? '#ff4d8d' : '#fef3c7',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.add([this.background, this.label, this.lockLabel]);
    scene.add.existing(this);
  }

  updateTile(tile: BoardTile, size: number): void {
    this.background.setSize(size, size).setFillStyle(this.colorFor(tile)).setStrokeStyle(3, tile.lockedTurns > 0 ? 0xfef3c7 : 0xffffff, tile.lockedTurns > 0 ? 0.7 : 0.18);
    this.label.setText(String(tile.value));
    this.label.setFontSize(Math.max(18, size * (String(tile.value).length > 3 ? 0.22 : 0.3)));
    this.label.setColor(tile.value >= 512 ? '#080816' : '#f8fafc');
    this.lockLabel.setPosition(size * 0.3, -size * 0.32);
    this.lockLabel.setFontSize(Math.max(12, size * 0.18));
    this.lockLabel.setText(tile.lockedTurns > 0 ? '×' : tile.cursed ? '!' : '');
  }

  private colorFor(tile: BoardTile): number {
    if (tile.cursed) return 0x4c0519;
    return TILE_COLORS[tile.value] ?? 0xf8fafc;
  }
}
