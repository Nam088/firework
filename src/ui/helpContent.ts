/**
 * Help modal content for the settings menu
 */

import type { HelpContentMap } from '../config';

export const helpContent: HelpContentMap = {
  shellType: {
    header: 'Firework Type',
    body: "The type of firework you want to launch. Select 'Random' for the best experience!",
  },
  shellSize: {
    header: 'Firework Size',
    body: 'Larger fireworks have a bigger bloom area, but require more device performance. Large fireworks may cause your device to lag.',
  },
  quality: {
    header: 'Quality',
    body: "If the animation isn't running smoothly, try lowering the quality. Higher quality means more sparks after fireworks bloom, but may cause lag.",
  },
  skyLighting: {
    header: 'Sky Lighting',
    body: "The background lights up when fireworks explode. If your screen looks too bright, change it to 'Dim' or 'None'.",
  },
  scaleFactor: {
    header: 'Scale',
    body: 'Makes you closer or farther from the fireworks. For larger fireworks, you may want a smaller scale value, especially on mobile devices.',
  },
  wordShell: {
    header: 'Text Fireworks',
    body: 'When enabled, text-shaped fireworks will appear.',
  },
  autoLaunch: {
    header: 'Auto Launch',
    body: 'When enabled, you can sit back and enjoy the firework show. You can turn it off, but then you can only launch fireworks by clicking.',
  },
  finaleMode: {
    header: 'Launch More Fireworks',
    body: "Automatically launch more fireworks at the same time (requires 'Auto Launch' to be enabled).",
  },
  hideControls: {
    header: 'Hide Controls',
    body: 'Hide the buttons at the top of the screen. Useful for screenshots. You can still access settings in the top right corner.',
  },
  fullscreen: {
    header: 'Fullscreen',
    body: 'Toggle fullscreen mode',
  },
  longExposure: {
    header: 'Preserve Sparks',
    body: 'Keep the trails left by fireworks',
  },
};

export const nodeKeyToHelpKey: Record<string, string> = {
  shellTypeLabel: 'shellType',
  shellSizeLabel: 'shellSize',
  qualityLabel: 'quality',
  skyLightingLabel: 'skyLighting',
  scaleFactorLabel: 'scaleFactor',
  wordShellLabel: 'wordShell',
  autoLaunchLabel: 'autoLaunch',
  finaleModeLabel: 'finaleMode',
  hideControlsLabel: 'hideControls',
  fullscreenLabel: 'fullscreen',
  longExposureLabel: 'longExposure',
};
