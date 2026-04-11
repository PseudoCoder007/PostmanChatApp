import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

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
    title: 'Welcome to PostmanChat',
    description: 'This is a gamified messaging app where chats, quests, and proof-based actions turn into XP, coins, and unlocks.',
    targetViewOrAction: 'chat',
    position: 'center',
    buttonLabel: 'Next',
  },
  {
    id: 'rooms',
    title: 'Chat in Rooms',
    description: 'Use rooms for direct messages and squad conversations. Once you have enough coins, you can also create your own group room.',
    targetViewOrAction: 'chat',
    targetElement: '.room-stack',
    position: 'right',
    buttonLabel: 'Next',
  },
  {
    id: 'quests',
    title: 'Complete Quests',
    description: 'Quests are the fastest way to earn XP and coins. The verified board rewards real in-app actions like posting, creating rooms, and uploading proof.',
    targetViewOrAction: 'quests',
    targetElement: '.quest-panel',
    position: 'left',
    buttonLabel: 'Next',
  },
  {
    id: 'igris',
    title: 'Meet Igris',
    description: 'Igris lives in the bottom-right launcher once you unlock it at 5 coins. It can explain navigation, help with group chats, and answer creator questions too.',
    targetViewOrAction: 'igris',
    position: 'left',
    buttonLabel: 'Next',
  },
  {
    id: 'feedback',
    title: 'Send Feedback',
    description: 'There is a dedicated feedback tab for bug reports, feature ideas, and support questions. If something feels confusing, this is a direct line.',
    targetViewOrAction: 'feedback',
    position: 'left',
    buttonLabel: 'Next',
  },
  {
    id: 'coins',
    title: 'Earn Coins and XP',
    description: 'Coins unlock features like Igris access and group room creation. XP raises your level and changes the title shown around the app.',
    targetViewOrAction: 'profile',
    targetElement: '.stat-card',
    position: 'left',
    buttonLabel: 'Next',
  },
  {
    id: 'settings',
    title: 'Profile and Settings',
    description: 'Your profile view now handles your identity, sound toggle, theme controls, and tutorial replay. It is the main setup space.',
    targetViewOrAction: 'profile',
    targetElement: '.panel',
    position: 'left',
    buttonLabel: 'Next',
  },
  {
    id: 'levels',
    title: 'Track Your Progress',
    description: 'Watch your level roadmap as you earn XP. Higher levels make the whole app feel more alive and rewarding over time.',
    targetViewOrAction: 'levels',
    position: 'center',
    buttonLabel: 'Let\'s go',
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
  const [storageKey, setStorageKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const userId = data.session?.user.id ?? null;
      if (!userId) {
        setStorageKey(null);
        setCurrentStepIndex(0);
        setIsCompleted(true);
        setIsSkipped(true);
        return;
      }

      const nextStorageKey = `postmanchat.tutorial.seen.${userId}`;
      setStorageKey(nextStorageKey);
      try {
        const stored = localStorage.getItem(nextStorageKey);
        if (stored === 'completed' || stored === 'skipped') {
          setIsCompleted(true);
          setIsSkipped(true);
        } else {
          setCurrentStepIndex(0);
          setIsCompleted(false);
          setIsSkipped(false);
        }
      } catch {
        setCurrentStepIndex(0);
        setIsCompleted(false);
        setIsSkipped(false);
      }
    };

    void syncSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncSession();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const completeTutorial = (state: 'completed' | 'skipped') => {
    setIsCompleted(true);
    try {
      if (storageKey) localStorage.setItem(storageKey, state);
    } catch {
      // Ignore storage failures.
    }
  };

  const nextStep = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      completeTutorial('completed');
    }
  };

  const skipTutorial = () => {
    setIsSkipped(true);
    completeTutorial('skipped');
  };

  const resetTutorial = () => {
    setCurrentStepIndex(0);
    setIsCompleted(false);
    setIsSkipped(false);
    try {
      if (storageKey) localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage failures.
    }
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
