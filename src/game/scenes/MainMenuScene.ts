import Phaser from 'phaser';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { iconSvg } from '../assets/icons';
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
    const root = setUi(`<main class="screen menu-screen">
      <section class="screen-inner menu-grid">
        <div class="menu-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="menu-crest" aria-hidden="true">
          <i>2</i><i>0</i><i>4</i><i>8</i>
        </div>
        <div class="title-stack">
          <h1>Rog2048</h1>
          <p>Fusiones, objetivos letales y talismanes que rompen reglas.</p>
        </div>
        <div class="button-column">
          ${pixelButton({ id: 'new-run', label: 'Nueva partida', icon: iconSvg('spark') })}
          ${pixelButton({ id: 'continue-run', label: 'Continuar', icon: iconSvg('reroll'), disabled: !hasRun })}
          ${pixelButton({ id: 'collection', label: 'Colección', icon: iconSvg('book'), variant: 'ghost' })}
          ${pixelButton({ id: 'settings', label: 'Ajustes', icon: iconSvg('forge'), variant: 'ghost' })}
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
