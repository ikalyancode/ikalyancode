export interface Experience {
  id: number;
  role: string;
  company: string;
  period: string;
  description: string[];
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface Education {
    degree: string;
    university: string;
    period: string;
    emphasis: string;
}

export interface ResumeData {
  name: string;
  title: string;
  contact: {
    linkedin: string;
    github: string;
    linkedinHandle: string;
    githubHandle: string;
  };
  summary: string;
  skills: SkillCategory[];
  experience: Experience[];
  contributions: string[];
  education: Education[];
}

// Web Speech API type definitions for TypeScript
// These are not included in default TS DOM typings.

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export interface SpeechSynthesisErrorEvent extends Event {
  readonly error: string;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;

  start(): void;
  stop(): void;
}

export interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}