
export type LayoutMode = 'fullscreen' | 'split' | 'quad';

export type ModuleType = 
  | 'chat'
  | 'email'
  | 'agenda'
  | 'todo'
  | 'routeplanner'
  | 'trading'
  | 'stats'
  | 'homeassistant'
  | 'browser'
  | 'news'
  | 'blockchain'
  | 'scanner';

export interface Module {
  id: string;
  type: ModuleType;
  title: string;
  active?: boolean;
}

export interface ModuleState {
  [frameId: string]: Module;
}

export interface CommandTarget {
  targetFrame: string | null;
  command: string;
}
