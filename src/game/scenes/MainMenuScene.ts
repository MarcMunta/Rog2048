import Phaser from 'phaser';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { bindClick, setUi } from '../utils/dom';
import { pixelButton } from '../ui/PixelButton';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    gameStore.reload();
    const hasRun = gameStore.run !== null;
    const root = setUi(`<main class="screen">
      <section class="screen-inner menu-grid">
        <div class="title-stack">
          <h1>Núcleo 2048</h1>
          <p>Roguelike de fusiones, objetivos letales y talismanes que rompen reglas.</p>
        </div>
        <div class="button-column">
          ${pixelButton({ id: 'new-run', label: 'Nueva partida', icon: '▶' })}
          ${pixelButton({ id: 'continue-run', label: 'Continuar', icon: '↻', disabled: !hasRun })}
          ${pixelButton({ id: 'collection', label: 'Colección', icon: '□', variant: 'ghost' })}
          ${pixelButton({ id: 'settings', label: 'Ajustes', icon: '⚙', variant: 'ghost' })}
        </div>
      </section>
    </main>`);

    bindClick(root, '#new-run', () => {
      AudioSystem.unlock();
      AudioSystem.play('button');
      transitionTo(this, 'ClassSelectScene');
    });
    bindClick(root, '#continue-run', () => {
      AudioSystem.unlock();
      AudioSystem.play('button');
      if (gameStore.continueRun()) transitionTo(this, 'MapScene');
    });
    bindClick(root, '#collection', () => {
      AudioSystem.play('button');
      transitionTo(this, 'CollectionScene');
    });
    bindClick(root, '#settings', () => {
      AudioSystem.play('button');
      transitionTo(this, 'SettingsScene');
    });
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }
}
