/**
 * UIController - DOM binding and UI updates
 */

import { configManager } from '../config';
import { QUALITY_LOW, QUALITY_NORMAL, QUALITY_HIGH, SKY_LIGHT_NONE, SKY_LIGHT_DIM, SKY_LIGHT_NORMAL, getDefaultScaleFactor } from '../config/defaults';
import { fscreen } from '../fscreen';
import { shellSystem } from '../simulation/ShellSystem';

// Help content
const helpContent: Record<string, { header: string; body: string }> = {
  shellType: {
    header: 'Shell Type',
    body: 'The type of firework shell to launch. "Random" will select a different type for each shell.',
  },
  shellSize: {
    header: 'Shell Size',
    body: 'The size of the firework shells. Larger shells have bigger and longer-lasting bursts.',
  },
  quality: {
    header: 'Quality',
    body: 'Overall quality of the effects. Lower quality uses fewer particles and simpler effects, improving performance on slower devices.',
  },
  skyLighting: {
    header: 'Sky Lighting',
    body: 'How much the sky lights up with the color of fireworks. Set to "None" for a pure black sky.',
  },
  scaleFactor: {
    header: 'Scale',
    body: 'Makes the simulation area smaller, improving performance. Use this if the animation is running slowly.',
  },
  autoLaunch: {
    header: 'Auto Fire',
    body: 'Automatically launches fireworks. Disable for a more relaxed experience where you control the show.',
  },
  finaleMode: {
    header: 'Finale Mode',
    body: 'Rapidly launches many shells for a grand finale effect.',
  },
  hideControls: {
    header: 'Hide Controls',
    body: 'Hides the control buttons at the top of the screen for a cleaner view.',
  },
  fullscreen: {
    header: 'Fullscreen',
    body: 'Expands the simulation to fill your entire screen.',
  },
  longExposure: {
    header: 'Long Exposure',
    body: 'Simulates a long camera exposure, creating light trails and a "painting with light" effect.',
  },
};

// Node key to help key mapping
const nodeKeyToHelpKey: Record<string, string> = {
  shellTypeLabel: 'shellType',
  shellSizeLabel: 'shellSize',
  qualityLabel: 'quality',
  skyLightingLabel: 'skyLighting',
  scaleFactorLabel: 'scaleFactor',
  autoLaunchLabel: 'autoLaunch',
  finaleModeLabel: 'finaleMode',
  hideControlsLabel: 'hideControls',
  fullscreenLabel: 'fullscreen',
  longExposureLabel: 'longExposure',
};

export class UIController {
  private nodes: Record<string, HTMLElement | null> = {};
  
  constructor() {
    this.initNodes();
    this.setupEventListeners();
    this.setupConfigSubscription();
    this.populateDropdowns();
  }
  
  /**
   * Initialize DOM node references
   */
  private initNodes(): void {
    this.nodes = {
      stageContainer: document.querySelector('.stage-container'),
      canvasContainer: document.querySelector('.canvas-container'),
      controls: document.querySelector('.controls'),
      menu: document.querySelector('.menu'),
      pauseBtn: document.querySelector('.pause-btn'),
      pauseBtnSVG: document.querySelector('.pause-btn use'),
      soundBtn: document.querySelector('.sound-btn'),
      soundBtnSVG: document.querySelector('.sound-btn use'),
      menuBtn: document.querySelector('.menu-btn'),
      shellType: document.querySelector('.shell-type'),
      shellSize: document.querySelector('.shell-size'),
      quality: document.querySelector('.quality-ui'),
      skyLighting: document.querySelector('.sky-lighting'),
      scaleFactor: document.querySelector('.scaleFactor'),
      autoLaunch: document.querySelector('.auto-launch'),
      finaleMode: document.querySelector('.finale-mode'),
      hideControls: document.querySelector('.hide-controls'),
      fullscreen: document.querySelector('.fullscreen'),
      longExposure: document.querySelector('.long-exposure'),
      wordShell: document.querySelector('.word-shell'),
      fullscreenFormOption: document.querySelector('.fullscreen-form-option'),
      finaleModeFormOption: document.querySelector('.finale-mode-form-option'),
      helpModal: document.querySelector('.help-modal'),
      helpModalOverlay: document.querySelector('.help-modal__overlay'),
      helpModalHeader: document.querySelector('.help-modal__header'),
      helpModalBody: document.querySelector('.help-modal__body'),
      helpModalCloseBtn: document.querySelector('.help-modal__close-btn'),
      // Labels for help
      shellTypeLabel: document.querySelector('label[for="shell-type"]'),
      shellSizeLabel: document.querySelector('label[for="shell-size"]'),
      qualityLabel: document.querySelector('label[for="quality"]'),
      skyLightingLabel: document.querySelector('label[for="sky-lighting"]'),
      scaleFactorLabel: document.querySelector('label[for="scale-factor"]'),
      autoLaunchLabel: document.querySelector('label[for="auto-launch"]'),
      finaleModeLabel: document.querySelector('label[for="finale-mode"]'),
      hideControlsLabel: document.querySelector('label[for="hide-controls"]'),
      fullscreenLabel: document.querySelector('label[for="fullscreen"]'),
      longExposureLabel: document.querySelector('label[for="long-exposure"]'),
    };
  }
  
  /**
   * Get a DOM node
   */
  getNode(name: string): HTMLElement | null {
    return this.nodes[name] || null;
  }
  
  /**
   * Set up event listeners for form controls
   */
  private setupEventListeners(): void {
    // Form controls
    this.addInputListener('shellType', 'shell');
    this.addInputListener('shellSize', 'size', parseInt);
    this.addInputListener('quality', 'quality', parseInt);
    this.addInputListener('skyLighting', 'skyLighting', parseInt);
    this.addInputListener('scaleFactor', 'scaleFactor', parseFloat);
    
    this.addCheckboxListener('autoLaunch', 'autoLaunch');
    this.addCheckboxListener('finaleMode', 'finale');
    this.addCheckboxListener('hideControls', 'hideControls');
    this.addCheckboxListener('longExposure', 'longExposure');
    this.addCheckboxListener('wordShell', 'wordShell');
    
    // Fullscreen
    this.nodes.fullscreen?.addEventListener('click', () => {
      this.toggleFullscreen();
    });
    
    // Help modal handlers
    Object.keys(nodeKeyToHelpKey).forEach((nodeKey) => {
      const helpKey = nodeKeyToHelpKey[nodeKey];
      this.nodes[nodeKey]?.addEventListener('click', () => {
        configManager.setHelpTopic(helpKey);
      });
    });
    
    this.nodes.helpModalCloseBtn?.addEventListener('click', () => {
      configManager.setHelpTopic(null);
    });
    
    this.nodes.helpModalOverlay?.addEventListener('click', () => {
      configManager.setHelpTopic(null);
    });
    
    // Scale factor also triggers resize
    this.nodes.scaleFactor?.addEventListener('input', () => {
      window.dispatchEvent(new Event('resize'));
    });
  }
  
  private addInputListener(nodeName: string, configKey: string, parser?: (v: string) => any): void {
    const node = this.nodes[nodeName] as HTMLInputElement | null;
    node?.addEventListener('input', () => {
      const value = parser ? parser(node.value) : node.value;
      configManager.set(configKey as any, value);
    });
  }
  
  private addCheckboxListener(nodeName: string, configKey: string): void {
    const node = this.nodes[nodeName] as HTMLInputElement | null;
    node?.addEventListener('click', () => {
      setTimeout(() => {
        configManager.set(configKey as any, node.checked);
      }, 0);
    });
  }
  
  /**
   * Subscribe to config changes
   */
  private setupConfigSubscription(): void {
    configManager.subscribe((state, prevState) => {
      this.render(state);
    });
  }
  
  /**
   * Populate dropdown options
   */
  private populateDropdowns(): void {
    // Shell types
    const shellTypeNode = this.nodes.shellType as HTMLSelectElement;
    if (shellTypeNode) {
      let options = '';
      shellSystem.getTypeNames().forEach((name) => {
        options += `<option value="${name}">${name}</option>`;
      });
      shellTypeNode.innerHTML = options;
    }
    
    // Shell sizes
    const shellSizeNode = this.nodes.shellSize as HTMLSelectElement;
    if (shellSizeNode) {
      let options = '';
      ['3"', '4"', '6"', '8"', '12"', '16"'].forEach((opt, i) => {
        options += `<option value="${i}">${opt}</option>`;
      });
      shellSizeNode.innerHTML = options;
    }
    
    // Quality
    const qualityNode = this.nodes.quality as HTMLSelectElement;
    if (qualityNode) {
      qualityNode.innerHTML = `
        <option value="${QUALITY_LOW}">Low</option>
        <option value="${QUALITY_NORMAL}">Normal</option>
        <option value="${QUALITY_HIGH}">High</option>
      `;
    }
    
    // Sky lighting
    const skyLightingNode = this.nodes.skyLighting as HTMLSelectElement;
    if (skyLightingNode) {
      skyLightingNode.innerHTML = `
        <option value="${SKY_LIGHT_NONE}">None</option>
        <option value="${SKY_LIGHT_DIM}">Dim</option>
        <option value="${SKY_LIGHT_NORMAL}">Normal</option>
      `;
    }
    
    // Scale factor
    const scaleFactorNode = this.nodes.scaleFactor as HTMLSelectElement;
    if (scaleFactorNode) {
      let options = '';
      [0.5, 0.62, 0.75, 0.9, 1.0, 1.5, 2.0].forEach((value) => {
        options += `<option value="${value.toFixed(2)}">${value * 100}%</option>`;
      });
      scaleFactorNode.innerHTML = options;
    }
  }
  
  /**
   * Render UI based on state
   */
  render(state: any): void {
    const { paused, soundEnabled, menuOpen, openHelpTopic, fullscreen, ...config } = state;
    
    // Update button icons
    const pauseSvg = this.nodes.pauseBtnSVG;
    if (pauseSvg) {
      pauseSvg.setAttribute('href', `#icon-${paused ? 'play' : 'pause'}`);
      pauseSvg.setAttribute('xlink:href', `#icon-${paused ? 'play' : 'pause'}`);
    }
    
    const soundSvg = this.nodes.soundBtnSVG;
    if (soundSvg) {
      soundSvg.setAttribute('href', `#icon-sound-${soundEnabled ? 'on' : 'off'}`);
      soundSvg.setAttribute('xlink:href', `#icon-sound-${soundEnabled ? 'on' : 'off'}`);
    }
    
    // Toggle classes
    this.nodes.controls?.classList.toggle('hide', config.hideControls);
    this.nodes.menu?.classList.toggle('hide', !menuOpen);
    this.nodes.menu?.classList.toggle('hide', !menuOpen);
    
    // Fix: Blur canvas and controls separately so menu remains clear (menu is child of stageContainer)
    this.nodes.canvasContainer?.classList.toggle('blur', menuOpen);
    this.nodes.controls?.classList.toggle('blur', menuOpen);
    
    // Note: stageContainer.remove toggle removed as it hides the app on pause, which is likely incorrect.
    
    // Update form values
    this.setSelectValue('shellType', config.shell);
    this.setSelectValue('shellSize', config.size);
    this.setSelectValue('quality', config.quality);
    this.setSelectValue('skyLighting', config.skyLighting);
    this.setSelectValue('scaleFactor', config.scaleFactor?.toFixed(2));
    
    this.setCheckboxValue('autoLaunch', config.autoLaunch);
    this.setCheckboxValue('finaleMode', config.finale);
    this.setCheckboxValue('hideControls', config.hideControls);
    this.setCheckboxValue('fullscreen', fullscreen);
    this.setCheckboxValue('longExposure', config.longExposure);
    this.setCheckboxValue('wordShell', config.wordShell);
    
    // Finale mode visibility
    if (this.nodes.finaleModeFormOption) {
      (this.nodes.finaleModeFormOption as HTMLElement).style.display = config.autoLaunch ? '' : 'none';
    }
    
    // Help modal
    if (openHelpTopic && helpContent[openHelpTopic]) {
      const content = helpContent[openHelpTopic];
      if (this.nodes.helpModalHeader) {
        this.nodes.helpModalHeader.textContent = content.header;
      }
      if (this.nodes.helpModalBody) {
        this.nodes.helpModalBody.textContent = content.body;
      }
    }
    this.nodes.helpModal?.classList.toggle('active', !!openHelpTopic);
    
    // Menu open class on body
    document.body.classList.toggle('menu-open', menuOpen);
  }
  
  private setSelectValue(nodeName: string, value: any): void {
    const node = this.nodes[nodeName] as HTMLSelectElement | null;
    if (node && value !== undefined) {
      node.value = String(value);
    }
  }
  
  private setCheckboxValue(nodeName: string, value: boolean): void {
    const node = this.nodes[nodeName] as HTMLInputElement | null;
    if (node && value !== undefined) {
      node.checked = value;
    }
  }
  
  /**
   * Toggle fullscreen
   */
  toggleFullscreen(): void {
    if (fscreen.fullscreenElement) {
      fscreen.exitFullscreen();
      configManager.toggleFullscreen(false);
    } else if (this.nodes.stageContainer) {
      fscreen.requestFullscreen(this.nodes.stageContainer);
      configManager.toggleFullscreen(true);
    }
  }
  
  /**
   * Check if fullscreen is enabled
   */
  isFullscreenEnabled(): boolean {
    return fscreen.fullscreenEnabled;
  }
  
  /**
   * Remove loading state
   */
  removeLoadingState(): void {
    document.querySelector('.loading-init')?.remove();
    this.nodes.stageContainer?.classList.remove('remove');
  }
  
  /**
   * Set loading status text
   */
  setLoadingStatus(status: string): void {
    const elem = document.querySelector('.loading-init__status');
    if (elem) elem.textContent = status;
  }
}

// ============================================
// Singleton Export
// ============================================

export const uiController = new UIController();
