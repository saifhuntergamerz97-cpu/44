
export const MODEL_NAME = 'veo-3.1-fast-generate-preview';

export const LOADING_MESSAGES = [
  "Initializing neural engines...",
  "Synthesizing visual fragments...",
  "Rendering cinematic lighting...",
  "Applying temporal consistency...",
  "Enhancing motion dynamics...",
  "Finalizing high-definition output...",
  "Almost there! Reframing scenes..."
];

export const ASPECT_RATIOS = [
  { label: 'Landscape (16:9)', value: '16:9' },
  { label: 'Portrait (9:16)', value: '9:16' }
] as const;

export const RESOLUTIONS = [
  { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' }
] as const;
