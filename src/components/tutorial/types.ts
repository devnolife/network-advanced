// Tutorial Mode Types

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content?: string;
  targetElement?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: TutorialAction;
  validation?: TutorialValidation;
  hints?: string[];
  completedMessage?: string;
}

export interface TutorialAction {
  type: 'click' | 'input' | 'command' | 'wait' | 'navigate' | 'configure';
  target?: string;
  value?: string;
  timeout?: number;
}

export interface TutorialValidation {
  type: 'element-exists' | 'element-value' | 'command-output' | 'config-check' | 'manual';
  condition?: string;
  expectedValue?: string;
  errorMessage?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  objectives: string[];
  prerequisites?: string[];
  steps: TutorialStep[];
  rewards?: TutorialReward[];
}

export interface TutorialReward {
  type: 'badge' | 'points' | 'unlock';
  value: string | number;
  description: string;
}

export interface TutorialProgress {
  tutorialId: string;
  currentStepIndex: number;
  completedSteps: string[];
  startedAt: number;
  lastActivityAt: number;
  hintsUsed: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'abandoned';
}

export interface TutorialContextType {
  activeTutorial: Tutorial | null;
  progress: TutorialProgress | null;
  isPlaying: boolean;
  currentStep: TutorialStep | null;
  startTutorial: (tutorialId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  completeTutorial: () => void;
  exitTutorial: () => void;
  showHint: () => void;
  markStepComplete: (stepId: string) => void;
}

export interface TutorialOverlayProps {
  step: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onExit: () => void;
  onShowHint: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  hintsAvailable: number;
}

export interface TutorialStepIndicatorProps {
  steps: TutorialStep[];
  currentStepIndex: number;
  completedSteps: string[];
  onStepClick?: (index: number) => void;
}

export interface TutorialWelcomeProps {
  tutorial: Tutorial;
  onStart: () => void;
  onClose: () => void;
}

export interface TutorialCompleteProps {
  tutorial: Tutorial;
  progress: TutorialProgress;
  onRestart: () => void;
  onClose: () => void;
}

// Difficulty colors
export const DIFFICULTY_COLORS: Record<Tutorial['difficulty'], string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444'
};

// Difficulty labels (Indonesian)
export const DIFFICULTY_LABELS: Record<Tutorial['difficulty'], string> = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  advanced: 'Lanjutan'
};
