import Phaser from 'phaser';
import { getSkillById } from '../data/skills';
import { AnimationSystem } from '../systems/AnimationSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { gameStore } from '../systems/GameStore';
import { BoardSystem } from '../systems/BoardSystem';
import { createEnemyPortrait, playEnemyPortraitAnimation } from '../assets/portraits';
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
  private backdropGraphics!: Phaser.GameObjects.Graphics;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private enemyContainer!: Phaser.GameObjects.Container;
  private tileViews = new Map<string, TileView>();
  private selectingSkillId: string | null = null;
  private locked = false;
  private ending = false;
  private lastEnemyHpRatio = 1;
  private pointerStart: { x: number; y: number } | null = null;

  constructor() {
    super('CombatScene');
  }

  create(): void {
    autoClearUi(this);
    this.cameras.main.setBackgroundColor('#080816');
    this.combat = gameStore.startCombat();
    this.lastEnemyHpRatio = this.combat.enemy.hp / this.combat.enemy.maxHp;
    this.backdropGraphics = this.add.graphics().setDepth(0);
    this.boardGraphics = this.add.graphics().setDepth(1);
    this.enemyContainer = this.add.container(0, 0).setDepth(2);
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
      const effectColor = merge.value >= 64 ? 0xffcc66 : 0x40f6d2;
      AnimationSystem.burst(this, center.x, center.y, effectColor);
      if (merge.value >= 64) AnimationSystem.shockwave(this, center.x, center.y, effectColor);
      if (merge.value >= 128) AnimationSystem.mergeStreak(this, center.x, center.y, effectColor);
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
      const center = this.floatingPoint(item);
      const color =
        item.tone === 'damage'
          ? '#ffcc66'
          : item.tone === 'gold'
            ? '#facc15'
            : item.tone === 'energy'
              ? '#40f6d2'
              : item.tone === 'heal'
                ? '#a3e635'
                : item.tone === 'blocked'
                  ? '#67e8f9'
                  : item.tone === 'status'
                    ? '#b388ff'
                    : '#ff4d8d';
      AnimationSystem.floatingText(this, center.x, center.y, item.text, color);
    });
    if (result.damage > 0) {
      const enemy = this.enemyContainer.getBounds();
      AnimationSystem.floatingText(this, enemy.centerX, enemy.y - 14, `-${result.damage}`, '#ffcc66');
      this.playPlayerAttack(result);
      this.flashEnemy();
      this.updateBossReaction();
      AudioSystem.play('damage');
    }
    if (result.enemyAttacked) this.playEnemyAttack();
    if (result.playerDamaged > 0) {
      const center = this.cellCenter({ row: 0, col: 0 });
      AnimationSystem.floatingText(this, center.x - 44, center.y - 46, `-${result.playerDamaged}`, '#fb7185');
      AudioSystem.play('enemyAttack');
    }
    if (result.combo >= 3) {
      const center = this.cellCenter({ row: 3, col: 3 });
      AnimationSystem.floatingText(this, center.x + 34, center.y + 42, `COMBO x${result.combo}`, '#40f6d2');
      AnimationSystem.mergeStreak(this, center.x + 34, center.y + 42, 0x40f6d2);
    }
    if (result.bigHit) {
      AnimationSystem.hitStop(this, 80);
      AnimationSystem.shake(this, 0.008, 160);
    }
  }

  private floatingPoint(item: CombatActionResult['floating'][number]): { x: number; y: number } {
    if (item.anchor === 'enemy') {
      const enemy = this.enemyContainer.getBounds();
      return { x: enemy.centerX, y: enemy.y - 14 };
    }
    if (item.anchor === 'player') {
      return {
        x: Math.max(74, this.boardLayout.x - 86),
        y: this.boardLayout.y + this.boardLayout.cell * 0.35
      };
    }
    return this.cellCenter({ row: item.y, col: item.x });
  }

  private checkEnd(): void {
    if (this.ending || this.combat.status === 'active') return;
    this.ending = true;
    if (this.combat.status === 'won') {
      playEnemyPortraitAnimation(this.enemyContainer, 'defeat');
      AnimationSystem.bossPulse(this, this.enemyContainer.x, this.enemyContainer.y, this.combat.enemy.palette.primary);
    }
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
    const topReserve = isMobile ? (width < 560 ? 348 : 236) : 176;
    const bottomReserve = isMobile ? 148 : 126;
    const availableHeight = Math.max(280, height - topReserve - bottomReserve);
    const sideReserve = isMobile ? 18 : 260;
    const availableWidth = Math.max(300, width - sideReserve);
    const size = Math.floor(Math.min(isMobile ? width * 0.92 : availableWidth * 0.58, availableHeight, 560));
    const x = (width - size) / 2;
    const y = topReserve + availableHeight / 2 - size / 2;
    const gap = Math.max(6, Math.floor(size * 0.018));
    const cell = (size - gap * 5) / 4;
    this.boardLayout = { x, y, size, cell, gap };
    this.drawBackdrop();
    this.drawBoard();

    const enemyX = isMobile ? width / 2 : Math.max(250, width / 2 - 380);
    const enemyY = isMobile ? (width < 560 ? 232 : 178) : 118;
    this.enemyContainer.setPosition(enemyX, enemyY);
    this.enemyContainer.setScale(this.enemyScale());
    this.syncBoardViews();
  }

  private drawBackdrop(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const actColor = this.combat.rank === 'boss' ? 0xff4d8d : this.combat.enemy.palette.primary;
    this.backdropGraphics.clear();
    this.backdropGraphics.fillStyle(0x080816, 1).fillRect(0, 0, width, height);
    this.backdropGraphics.fillStyle(0xffffff, 0.025);
    for (let x = 0; x < width; x += 28) this.backdropGraphics.fillRect(x, 0, 1, height);
    for (let y = 0; y < height; y += 28) this.backdropGraphics.fillRect(0, y, width, 1);
    this.backdropGraphics.fillStyle(actColor, 0.08).fillCircle(width / 2, 130, Math.min(width, 760) * 0.36);
    this.backdropGraphics.lineStyle(2, actColor, this.combat.rank === 'boss' ? 0.22 : 0.12);
    this.backdropGraphics.strokeCircle(width / 2, 130, Math.min(width, 760) * 0.22);
    this.backdropGraphics.strokeCircle(width / 2, 130, Math.min(width, 760) * 0.31);
    this.backdropGraphics.lineStyle(1, 0xffcc66, 0.09);
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      const radius = Math.min(width, 760) * 0.31;
      this.backdropGraphics.lineBetween(width / 2, 130, width / 2 + Math.cos(angle) * radius, 130 + Math.sin(angle) * radius);
    }
    if (this.boardLayout) {
      const centerX = this.boardLayout.x + this.boardLayout.size / 2;
      const centerY = this.boardLayout.y + this.boardLayout.size / 2;
      this.backdropGraphics.lineStyle(1, actColor, 0.16);
      this.backdropGraphics.lineBetween(width / 2, 130, centerX, centerY);
      this.backdropGraphics.fillStyle(actColor, 0.06).fillCircle(centerX, centerY, this.boardLayout.size * 0.58);
    }
    this.backdropGraphics.fillStyle(0x000000, 0.28).fillRect(0, height - 150, width, 150);
  }

  private drawBoard(): void {
    const { x, y, size, cell, gap } = this.boardLayout;
    this.boardGraphics.clear();
    this.boardGraphics.fillStyle(0x050712, 0.5).fillRoundedRect(x - 14, y - 14, size + 28, size + 28, 18);
    this.boardGraphics.fillStyle(0x0d1126, 0.9).fillRoundedRect(x, y, size, size, 12);
    this.boardGraphics.lineStyle(3, 0x40f6d2, 0.24).strokeRoundedRect(x, y, size, size, 12);
    this.boardGraphics.lineStyle(1, 0xffcc66, 0.14).strokeRoundedRect(x + 8, y + 8, size - 16, size - 16, 7);
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const cx = x + gap + col * (cell + gap);
        const cy = y + gap + row * (cell + gap);
        this.boardGraphics.fillStyle(0xffffff, 0.052).fillRoundedRect(cx, cy, cell, cell, 8);
        this.boardGraphics.lineStyle(1, 0xffffff, 0.045).strokeRoundedRect(cx + 3, cy + 3, cell - 6, cell - 6, 6);
      }
    }
  }

  private buildEnemy(): void {
    this.enemyContainer.removeAll(true);
    if (this.combat.rank === 'boss') this.enemyContainer.add(this.createBossAura());
    this.enemyContainer.add(createEnemyPortrait(this, this.combat.enemy));
    if (!gameStore.profile.settings.reducedMotion) {
      this.tweens.add({
        targets: this.enemyContainer,
        y: '+=8',
        yoyo: true,
        repeat: -1,
        duration: 1300,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private createBossAura(): Phaser.GameObjects.Graphics {
    const aura = this.add.graphics();
    const primary = this.combat.enemy.palette.primary;
    const accent = this.combat.enemy.palette.accent;
    aura.lineStyle(2, primary, 0.52).strokeCircle(0, -10, 118);
    aura.lineStyle(1, accent, 0.34).strokeCircle(0, -10, 94);
    aura.fillStyle(primary, 0.22);
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const inner = 94;
      const outer = i % 2 === 0 ? 126 : 112;
      aura.fillTriangle(
        Math.cos(angle - 0.08) * inner,
        -10 + Math.sin(angle - 0.08) * inner,
        Math.cos(angle) * outer,
        -10 + Math.sin(angle) * outer,
        Math.cos(angle + 0.08) * inner,
        -10 + Math.sin(angle + 0.08) * inner
      );
    }
    aura.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.78);
    if (!gameStore.profile.settings.reducedMotion) {
      this.tweens.add({
        targets: aura,
        angle: 360,
        repeat: -1,
        duration: 9000,
        ease: 'Linear'
      });
    }
    return aura;
  }

  private playBossEntrance(): void {
    this.enemyContainer.setScale(0.2).setAlpha(0);
    this.tweens.add({
      targets: this.enemyContainer,
      scale: this.enemyScale(),
      alpha: 1,
      duration: AnimationSystem.duration(520),
      ease: 'Back.easeOut'
    });
    AnimationSystem.shake(this, 0.012, 260);
    AnimationSystem.shockwave(this, this.scale.width / 2, 116, 0xff4d8d);
  }

  private enemyScale(): number {
    if (this.scale.width < 560) return 0.5;
    if (this.scale.width < 760) return 0.52;
    return 0.64;
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
    playEnemyPortraitAnimation(this.enemyContainer, 'hit');
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

  private playPlayerAttack(result: CombatActionResult): void {
    const source = result.floating.find((item) => item.tone === 'damage' && item.anchor !== 'enemy');
    const start = source ? this.cellCenter({ row: source.y, col: source.x }) : this.boardCenter();
    const enemy = this.enemyContainer.getBounds();
    const color = result.bigHit ? 0xffcc66 : this.combat.enemy.palette.primary;
    AnimationSystem.energyBolt(this, start.x, start.y, enemy.centerX, enemy.centerY, color, result.bigHit);
  }

  private updateBossReaction(): void {
    if (this.combat.rank !== 'boss') {
      this.lastEnemyHpRatio = this.combat.enemy.hp / this.combat.enemy.maxHp;
      return;
    }
    const currentRatio = this.combat.enemy.hp / this.combat.enemy.maxHp;
    const crossedPhase = (this.lastEnemyHpRatio > 0.66 && currentRatio <= 0.66) || (this.lastEnemyHpRatio > 0.33 && currentRatio <= 0.33);
    this.lastEnemyHpRatio = currentRatio;
    if (!crossedPhase || this.combat.enemy.hp <= 0) return;
    const enemy = this.enemyContainer.getBounds();
    playEnemyPortraitAnimation(this.enemyContainer, 'phase');
    AnimationSystem.floatingText(this, enemy.centerX, enemy.y - 42, 'Furia', '#ff4d8d');
    AnimationSystem.bossPulse(this, enemy.centerX, enemy.centerY, this.combat.enemy.palette.primary);
    AnimationSystem.shake(this, 0.01, 220);
    this.tweens.add({
      targets: this.enemyContainer,
      scale: this.enemyScale() * 1.16,
      yoyo: true,
      duration: AnimationSystem.duration(130),
      ease: 'Quad.easeOut'
    });
  }

  private playEnemyAttack(): void {
    playEnemyPortraitAnimation(this.enemyContainer, 'attack');
    const originX = this.enemyContainer.x;
    const targetY = this.boardLayout.y + this.boardLayout.size * 0.2;
    const center = this.boardCenter();
    AnimationSystem.attackSlash(this, this.enemyContainer.x, this.enemyContainer.y, center.x, center.y, this.combat.enemy.palette.primary);
    this.tweens.add({
      targets: this.enemyContainer,
      x: this.scale.width / 2 + (this.enemyContainer.x < this.scale.width / 2 ? 18 : -18),
      y: targetY,
      scale: this.enemyScale() * 1.08,
      duration: AnimationSystem.duration(120),
      yoyo: true,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.enemyContainer.x = originX;
        this.layout();
      }
    });
    AnimationSystem.hitSparks(this, center.x, center.y, this.combat.enemy.palette.primary, false);
    AnimationSystem.shake(this, 0.006, 120);
  }

  private boardCenter(): { x: number; y: number } {
    return {
      x: this.boardLayout.x + this.boardLayout.size / 2,
      y: this.boardLayout.y + this.boardLayout.size / 2
    };
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }
}
