// src/types/artTypes.ts

export type LayoutMode = 'fullscreen' | 'split' | 'quad';

export type ModuleType = 
  | 'chat'
  | 'coding' // Added to support CodingModule
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
  | 'scanner'
  | 'executor-chat'; // Added to support ExecutorChatModule

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

// Added CodeSnippet interface to support code sharing between ChatModule and CodingModule
export interface CodeSnippet {
  id: string; // Matches usage in CodingModule and ChatModule
  content: string;
  language: string;
  title: string;
  timestamp: Date;
}
