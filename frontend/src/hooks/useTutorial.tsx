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
    title: '⚡ Operator Briefing',
    description: 'Welcome to PostmanChat — the ranked arena where every message earns XP, every quest builds coins, and Igris AI has your back. Let\'s run through your command deck.',
    targetViewOrAction: 'chat',
    position: 'center',
    buttonLabel: 'Deploy',
  },
  {
    id: 'rooms',
    title: '💬 Rooms & Direct Lines',
    description: 'Your squad lives here. Slide into group rooms or open a direct line with any operator. Rooms you create yourself cost coins — keep grinding.',
    targetViewOrAction: 'chat',
    targetElement: '.room-stack',
    position: 'right',
    buttonLabel: 'Got it',
  },
  {
    id: 'quests',
    title: '🎯 Daily Missions',
    description: 'Hit "New Quest" to get a mission. Verified actions — posting, uploading proof, creating rooms — auto-complete quests and drop XP and coins directly into your account.',
    targetViewOrAction: 'quests',
    targetElement: '.quest-panel',
    position: 'left',
    buttonLabel: 'Understood',
  },
  {
    id: 'igris',
    title: '🤖 Igris AI Online',
    description: 'Igris unlocks at 5 coins. Once active, tap the Igris button bottom-right to open your AI companion — comeback coach, chaos planner, and the most unhinged advisor you\'ll meet.',
    targetViewOrAction: 'igris',
    position: 'left',
    buttonLabel: 'Noted',
  },
  {
    id: 'coins',
    title: '🪙 Coins & XP System',
    description: 'XP levels you up and upgrades your rank title. Coins unlock features: 5 for Igris, 10 for friend challenges, 20 for group room creation. Every chat session is progress.',
    targetViewOrAction: 'profile',
    targetElement: '.stat-card',
    position: 'left',
    buttonLabel: 'Clear',
  },
  {
    id: 'levels',
    title: '📈 Rank Progression',
    description: 'Your Levels tab shows your full rank roadmap. Newbie → Explorer → Social Ninja → Quest Master → Legend. Each rank changes how the app sees you. Go climb.',
    targetViewOrAction: 'levels',
    position: 'center',
    buttonLabel: 'Let\'s go 🚀',
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
  const [initialized, setInitialized] = useState(false);
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
        setInitialized(true);
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
      setInitialized(true);
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

  const currentStep = initialized && !isSkipped && !isCompleted ? TUTORIAL_STEPS[currentStepIndex] : null;

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
