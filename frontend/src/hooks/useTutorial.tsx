import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetViewOrAction: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  buttonLabel?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '🎮 Welcome to PostmanChat',
    description: 'A gamified messaging app where you earn XP and coins through quests and conversations. Let\'s get you started!',
    targetViewOrAction: 'chat',
    position: 'center',
    buttonLabel: 'Next →',
  },
  {
    id: 'rooms',
    title: '💬 Chat in Rooms',
    description: 'Click on rooms to chat with friends. You can create group rooms (costs 20 coins) or start direct messages.',
    targetViewOrAction: 'chat',
    targetElement: '.room-stack',
    position: 'right',
    buttonLabel: 'Next →',
  },
  {
    id: 'quests',
    title: '🎯 Complete Quests',
    description: 'Quests give you XP and coins. Generate AI-powered missions from Igris or complete specific actions like uploading photos.',
    targetViewOrAction: 'quests',
    targetElement: '.quest-panel',
    position: 'left',
    buttonLabel: 'Next →',
  },
  {
    id: 'igris',
    title: '🤖 Chat with Igris',
    description: 'Igris is your AI sidekick! Chat with them for support, funny quest ideas, or emotional advice. Unlocks at 5 coins.',
    targetViewOrAction: 'igris',
    position: 'left',
    buttonLabel: 'Next →',
  },
  {
    id: 'coins',
    title: '💰 Earn Coins & XP',
    description: 'Coins unlock features (profile photo at 5 coins, friend quests at 10, group rooms at 20). XP determines your level and title.',
    targetViewOrAction: 'profile',
    targetElement: '.stat-card',
    position: 'left',
    buttonLabel: 'Next →',
  },
  {
    id: 'profile',
    title: '👤 Customize Your Profile',
    description: 'Add a profile photo, set your username, and display name. Your profile represents you in the community.',
    targetViewOrAction: 'profile',
    targetElement: '.chat-input',
    position: 'left',
    buttonLabel: 'Next →',
  },
  {
    id: 'levels',
    title: '📈 Track Your Progress',
    description: 'Watch your level progression as you earn XP. Higher levels unlock new titles and prestige.',
    targetViewOrAction: 'levels',
    position: 'center',
    buttonLabel: 'Let\'s Go! 🚀',
  },
];

interface TutorialContextType {
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  isCompleted: boolean;
  isSkipped: boolean;
  nextStep: () => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSkipped, setIsSkipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('postmanchat.tutorial.completed');
      if (stored === 'true') {
        setIsCompleted(true);
        setIsSkipped(true);
      }
    } catch {}
  }, []);

  const nextStep = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    setIsCompleted(true);
    try {
      localStorage.setItem('postmanchat.tutorial.completed', 'true');
    } catch {}
  };

  const resetTutorial = () => {
    setCurrentStepIndex(0);
    setIsCompleted(false);
    setIsSkipped(false);
    try {
      localStorage.removeItem('postmanchat.tutorial.completed');
    } catch {}
  };

  const currentStep = !isSkipped && !isCompleted ? TUTORIAL_STEPS[currentStepIndex] : null;

  return (
    <TutorialContext.Provider value={{ currentStepIndex, currentStep, isCompleted, isSkipped, nextStep, skipTutorial, resetTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}
