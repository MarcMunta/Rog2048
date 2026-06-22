import Phaser from 'phaser';
import { getSkillById } from '../data/skills';
import { AnimationSystem } from '../systems/AnimationSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { gameStore } from '../systems/GameStore';
import { BoardSystem } from '../systems/BoardSystem';
import type { BoardMoveResult, Direction, Position } from '../types/board';
import type { CombatActionResult, CombatState } from '../types/combat';
import { TileView } from '../ui/TileView';
import { combatHud } from '../ui/Hud';
import { bindClick, setUi, showToast } from '../utils/dom';
import { autoClearUi, transitionTo } from './sceneHelpers';

interface BoardLayout {
  x: number;
  y: number;
  size: number;
  cell: number;
  gap: number;
}

export class CombatScene extends Phaser.Scene {
  private combat!: CombatState;
  private boardLayout!: BoardLayout;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private enemyContainer!: Phaser.GameObjects.Container;
  private enemyBody!: Phaser.GameObjects.Graphics;
  private tileViews = new Map<string, TileView>();
  private selectingSkillId: string | null = null;
  private locked = false;
  private ending = false;
  private pointerStart: { x: number; y: number } | null = null;

  constructor() {
    super('CombatScene');
  }

  create(): void {
    autoClearUi(this);
    this.cameras.main.setBackgroundColor('#080816');
    this.combat = gameStore.startCombat();
    this.boardGraphics = this.add.graphics().setDepth(1);
    this.enemyContainer = this.add.container(0, 0).setDepth(2);
    this.enemyBody = this.add.graphics();
    this.enemyContainer.add(this.enemyBody);
    this.buildEnemy();
    this.layout();
    this.renderBoardInstant();
    this.refreshHud();
    this.installInput();
    if (this.combat.rank === 'boss') this.playBossEntrance();
    this.cameras.main.fadeIn(180, 8, 8, 22);
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
  }

  private installInput(): void {
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.selectingSkillId = null;
        this.refreshHud();
        return;
      }
      if (this.locked || this.selectingSkillId || this.combat.status !== 'active') return;
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        w: 'up',
        W: 'up',
        ArrowDown: 'down',
        s: 'down',
        S: 'down',
        ArrowLeft: 'left',
        a: 'left',
        A: 'left',
        ArrowRight: 'right',
        d: 'right',
        D: 'right'
      };
      const direction = map[event.key];
      if (direction) void this.performMove(direction);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerStart = { x: pointer.x, y: pointer.y };
      if (pointer.rightButtonDown()) {
        this.selectingSkillId = null;
        this.refreshHud();
      }
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.locked || this.combat.status !== 'active') return;
      if (this.selectingSkillId) {
        const position = this.pointerToBoard(pointer.x, pointer.y);
        if (position) void this.activateSkill(this.selectingSkillId, position);
        return;
      }
      if (!this.pointerStart) return;
      const dx = pointer.x - this.pointerStart.x;
      const dy = pointer.y - this.pointerStart.y;
      this.pointerStart = null;
      if (Math.hypot(dx, dy) < 28) return;
      const direction: Direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      void this.performMove(direction);
    });
  }

  private refreshHud(): void {
    const run = gameStore.run;
    if (!run) return;
    const root = setUi(combatHud(run, this.combat, this.selectingSkillId));
    bindClick(root, '.skill-button', (button) => {
      const skillId = button.dataset.skillId;
      if (!skillId || this.locked || this.combat.status !== 'active') return;
      const skill = getSkillById(skillId);
      AudioSystem.play('button');
      if (skill.targetMode === 'tile') {
        this.selectingSkillId = this.selectingSkillId === skillId ? null : skillId;
        this.refreshHud();
        return;
      }
      void this.activateSkill(skillId);
    });
  }

  private async performMove(direction: Direction): Promise<void> {
    this.locked = true;
    const result = gameStore.combat!.applyMove(direction);
    if (!result.ok) {
      showToast(result.reason ?? 'Movimiento inválido.', 'bad');
      this.locked = false;
      return;
    }
    AudioSystem.play(result.move?.merges.length ? (result.bigHit ? 'bigMerge' : 'merge') : 'move');
    if (result.move) await this.animateMove(result.move);
    this.applyFeedback(result);
    this.syncBoardViews();
    this.refreshHud();
    this.locked = false;
    this.checkEnd();
  }

  private async activateSkill(skillId: string, target?: Position): Promise<void> {
    this.locked = true;
    this.selectingSkillId = null;
    const result = gameStore.combat!.useSkill(skillId, target);
    if (!result.ok) {
      showToast(result.reason ?? 'No se puede activar.', 'bad');
      this.locked = false;
      this.refreshHud();
      return;
    }
    AudioSystem.play('reward');
    if (result.move) await this.animateMove(result.move);
    this.applyFeedback(result);
    this.syncBoardViews();
    this.refreshHud();
    this.locked = false;
    this.checkEnd();
  }

  private async animateMove(move: BoardMoveResult): Promise<void> {
    const duration = AnimationSystem.duration(130);
    const tweens: Phaser.Tweens.Tween[] = [];
    for (const movement of move.movements) {
      const view = this.tileViews.get(movement.id);
      if (!view) continue;
      const target = this.cellCenter(movement.to);
      tweens.push(
        this.tweens.add({
          targets: view,
          x: target.x,
          y: target.y,
          duration,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            if (movement.kind === 'merge-source') {
              view.destroy();
              this.tileViews.delete(movement.id);
            }
          }
        })
      );
    }
    await this.wait(duration + 20);

    for (const merge of move.merges) {
      const center = this.cellCenter(merge.position);
      const view = this.createTileView(merge.createdTile, center.x, center.y);
      view.setScale(0.15);
      this.tweens.add({
        targets: view,
        scale: 1,
        duration: AnimationSystem.duration(170),
        ease: 'Back.easeOut'
      });
      AnimationSystem.burst(this, center.x, center.y, merge.value >= 64 ? 0xffcc66 : 0x40f6d2);
    }

    for (const spawn of move.spawns) {
      const center = this.cellCenter(spawn.position);
      const view = this.createTileView(spawn.tile, center.x, center.y);
      view.setAlpha(0).setScale(0.5);
      this.tweens.add({
        targets: view,
        alpha: 1,
        scale: 1,
        duration: AnimationSystem.duration(160),
        ease: 'Back.easeOut'
      });
    }
    await this.wait(AnimationSystem.duration(120));
  }

  private applyFeedback(result: CombatActionResult): void {
    result.floating.forEach((item) => {
      const center = this.cellCenter({ row: item.y, col: item.x });
      const color = item.tone === 'damage' ? '#ffcc66' : item.tone === 'gold' ? '#facc15' : item.tone === 'energy' ? '#40f6d2' : '#ff4d8d';
      AnimationSystem.floatingText(this, center.x, center.y, item.text, color);
    });
    if (result.damage > 0) {
      const enemy = this.enemyContainer.getBounds();
      AnimationSystem.floatingText(this, enemy.centerX, enemy.y - 14, `-${result.damage}`, '#ffcc66');
      this.flashEnemy();
      AudioSystem.play('damage');
    }
    if (result.playerDamaged > 0) {
      const center = this.cellCenter({ row: 0, col: 0 });
      AnimationSystem.floatingText(this, center.x - 44, center.y - 46, `-${result.playerDamaged}`, '#fb7185');
      AudioSystem.play('enemyAttack');
    }
    if (result.combo >= 3) {
      const center = this.cellCenter({ row: 3, col: 3 });
      AnimationSystem.floatingText(this, center.x + 34, center.y + 42, `COMBO x${result.combo}`, '#40f6d2');
    }
    if (result.bigHit) AnimationSystem.shake(this, 0.008, 160);
  }

  private checkEnd(): void {
    if (this.ending || this.combat.status === 'active') return;
    this.ending = true;
    this.time.delayedCall(760, () => {
      const next = gameStore.finishCombat();
      if (next === 'reward') transitionTo(this, 'RewardScene');
      if (next === 'victory') transitionTo(this, 'VictoryScene');
      if (next === 'defeat') transitionTo(this, 'GameOverScene');
    });
  }

  private layout(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const isMobile = width < 760;
    const size = Math.floor(Math.min(isMobile ? width * 0.92 : Math.min(width * 0.5, height * 0.66), 560));
    const x = isMobile ? (width - size) / 2 : width * 0.34 - size / 2;
    const y = isMobile ? Math.max(230, height * 0.5 - size / 2 + 30) : Math.max(170, height * 0.54 - size / 2);
    const gap = Math.max(6, Math.floor(size * 0.018));
    const cell = (size - gap * 5) / 4;
    this.boardLayout = { x, y, size, cell, gap };
    this.drawBoard();

    const enemyX = isMobile ? width / 2 : width * 0.76;
    const enemyY = isMobile ? Math.min(height - 95, y + size + 62) : height * 0.55;
    this.enemyContainer.setPosition(enemyX, enemyY);
    this.enemyContainer.setScale(isMobile ? 0.62 : 1);
    this.syncBoardViews();
  }

  private drawBoard(): void {
    const { x, y, size, cell, gap } = this.boardLayout;
    this.boardGraphics.clear();
    this.boardGraphics.fillStyle(0x0d1126, 0.88).fillRoundedRect(x, y, size, size, 12);
    this.boardGraphics.lineStyle(2, 0x40f6d2, 0.18).strokeRoundedRect(x, y, size, size, 12);
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const cx = x + gap + col * (cell + gap);
        const cy = y + gap + row * (cell + gap);
        this.boardGraphics.fillStyle(0xffffff, 0.055).fillRoundedRect(cx, cy, cell, cell, 8);
      }
    }
  }

  private buildEnemy(): void {
    const palette = this.combat.enemy.palette;
    this.enemyBody.clear();
    this.enemyBody.fillStyle(0x0d1126, 0.92).fillRoundedRect(-92, -116, 184, 232, 10);
    this.enemyBody.lineStyle(3, palette.primary, 0.85).strokeRoundedRect(-92, -116, 184, 232, 10);
    this.enemyBody.fillStyle(palette.secondary, 1).fillCircle(0, -18, 58);
    this.enemyBody.fillStyle(palette.primary, 1).fillTriangle(-52, -62, -22, -98, -10, -54);
    this.enemyBody.fillTriangle(52, -62, 22, -98, 10, -54);
    this.enemyBody.fillStyle(palette.accent, 1).fillRect(-30, -30, 20, 14);
    this.enemyBody.fillRect(10, -30, 20, 14);
    this.enemyBody.fillStyle(0x080816, 1).fillRect(-28, -27, 14, 8);
    this.enemyBody.fillRect(14, -27, 14, 8);
    this.enemyBody.fillStyle(palette.primary, 0.8).fillRect(-42, 34, 84, 12);
    const name = this.add
      .text(0, 78, this.combat.enemy.name, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#f8fafc',
        align: 'center',
        wordWrap: { width: 150 }
      })
      .setOrigin(0.5);
    this.enemyContainer.add(name);
    this.tweens.add({
      targets: this.enemyContainer,
      y: '+=8',
      yoyo: true,
      repeat: -1,
      duration: 1300,
      ease: 'Sine.easeInOut'
    });
  }

  private playBossEntrance(): void {
    this.enemyContainer.setScale(0.2).setAlpha(0);
    this.tweens.add({
      targets: this.enemyContainer,
      scale: this.scale.width < 760 ? 0.62 : 1,
      alpha: 1,
      duration: AnimationSystem.duration(520),
      ease: 'Back.easeOut'
    });
    AnimationSystem.shake(this, 0.012, 260);
  }

  private renderBoardInstant(): void {
    this.tileViews.forEach((view) => view.destroy());
    this.tileViews.clear();
    this.combat.board.cells.forEach((tile, index) => {
      if (!tile) return;
      const position = BoardSystem.indexToPosition(this.combat.board, index);
      const center = this.cellCenter(position);
      this.createTileView(tile, center.x, center.y);
    });
  }

  private syncBoardViews(): void {
    if (!this.boardLayout || !this.combat) return;
    const liveIds = new Set<string>();
    this.combat.board.cells.forEach((tile, index) => {
      if (!tile) return;
      liveIds.add(tile.id);
      const position = BoardSystem.indexToPosition(this.combat.board, index);
      const center = this.cellCenter(position);
      let view = this.tileViews.get(tile.id);
      if (!view) view = this.createTileView(tile, center.x, center.y);
      view.updateTile(tile, this.boardLayout.cell);
      view.setPosition(center.x, center.y);
    });
    this.tileViews.forEach((view, id) => {
      if (liveIds.has(id)) return;
      view.destroy();
      this.tileViews.delete(id);
    });
  }

  private createTileView(tile: import('../types/board').BoardTile, x: number, y: number): TileView {
    const existing = this.tileViews.get(tile.id);
    if (existing) {
      existing.setPosition(x, y);
      existing.updateTile(tile, this.boardLayout.cell);
      return existing;
    }
    const view = new TileView(this, tile, this.boardLayout.cell).setPosition(x, y).setDepth(10);
    this.tileViews.set(tile.id, view);
    return view;
  }

  private cellCenter(position: Position): { x: number; y: number } {
    const { x, y, cell, gap } = this.boardLayout;
    return {
      x: x + gap + position.col * (cell + gap) + cell / 2,
      y: y + gap + position.row * (cell + gap) + cell / 2
    };
  }

  private pointerToBoard(x: number, y: number): Position | null {
    const layout = this.boardLayout;
    if (x < layout.x || y < layout.y || x > layout.x + layout.size || y > layout.y + layout.size) return null;
    const col = Math.floor((x - layout.x - layout.gap) / (layout.cell + layout.gap));
    const row = Math.floor((y - layout.y - layout.gap) / (layout.cell + layout.gap));
    if (row < 0 || col < 0 || row >= 4 || col >= 4) return null;
    return { row, col };
  }

  private flashEnemy(): void {
    const flash = this.add.rectangle(0, -12, 176, 220, 0xffffff, 0.7);
    this.enemyContainer.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: AnimationSystem.duration(160),
      onComplete: () => flash.destroy()
    });
    this.tweens.add({
      targets: this.enemyContainer,
      x: this.enemyContainer.x + 10,
      yoyo: true,
      duration: AnimationSystem.duration(70)
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }
}
