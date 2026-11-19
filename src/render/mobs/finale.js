// Monster art: the finale's boss (Chapter 10, docs/design/main-story.md):
//   alarm   The Alarm: the Queen's golden alarm clock grown huge and cross, the Big Ring
//           (alarmrig.js).

import { alarmRig, alarmStill } from './alarmrig.js';

export const ART = {
  alarm: { pad: 14, walk: 8, idle: 8, attack: 5, stride: 8, atkMs: [110, 180, 340, 240], draw: alarmStill, rig: alarmRig },
};

export const INFO = {
  alarm: { name: 'The Alarm', w: 100, h: 130 },
};
