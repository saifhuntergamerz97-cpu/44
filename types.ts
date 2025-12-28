
export type AspectRatio = '16:9' | '9:16';
export type Resolution = '720p' | '1080p';

export interface VideoProject {
  id: string;
  prompt: string;
  videoUrl: string | null;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  config: {
    aspectRatio: AspectRatio;
    resolution: Resolution;
  };
  operationId?: string;
  error?: string;
}

// Fixed: Renamed to AIStudio to match the global type expected by the environment and resolve naming conflicts
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // Fixed: Updated property type to AIStudio and ensured it matches global modifiers to prevent redeclaration errors
    aistudio: AIStudio;
  }
}
