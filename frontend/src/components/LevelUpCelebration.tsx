import { useEffect, useState } from 'react';

interface LevelUpCelebrationProps {
  oldLevel: number;
  newLevel: number;
  newTitle: string;
  onComplete: () => void;
}

export function LevelUpCelebration({ oldLevel, newLevel, newTitle, onComplete }: LevelUpCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  useEffect(() => {
    // Generate confetti pieces
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.2,
    }));
    setConfetti(pieces);

    // Auto-dismiss after 3 seconds
    const timeout = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        pointerEvents: 'none',
        animation: isVisible ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.5s ease-out forwards',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(60px) scale(0.3);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(600px) rotate(720deg);
          }
        }
        @keyframes levelFlip {
          0% {
            transform: rotateX(0) scale(1);
          }
          50% {
            transform: rotateX(90deg) scale(0.8);
          }
          100% {
            transform: rotateX(0) scale(1);
          }
        }
        .level-flip {
          display: inline-block;
          animation: levelFlip 0.6s ease-in-out;
          perspective: 1000px;
        }
      `}</style>

      {/* Confetti pieces */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'fixed',
            left: `${piece.left}%`,
            top: '-10px',
            width: '10px',
            height: '10px',
            backgroundColor: ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'][piece.id % 5],
            borderRadius: '50%',
            animation: `confettiFall ${2 + Math.random()}s ease-in forwards`,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}

      {/* Center celebration card */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          animation: 'slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Stars/sparkles around the celebration */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const distance = 120;
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;
          return (
            <div
              key={`star-${i}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                width: '12px',
                height: '12px',
                fontSize: '20px',
                pointerEvents: 'none',
                animation: `pulse ${1.5 + (i % 3) * 0.2}s ease-in-out infinite`,
                animationDelay: `${(i / 12) * 0.5}s`,
              }}
            >
              ✨
            </div>
          );
        })}

        {/* Main level-up display */}
        <div
          style={{
            backgroundColor: 'rgba(10, 10, 10, 0.95)',
            borderRadius: '16px',
            padding: '40px 60px',
            border: '2px solid #4f46e5',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 60px rgba(79, 70, 229, 0.5), 0 20px 60px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px', animation: 'pulse 0.6s ease-out' }}>
            🎉
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
            Level Up!
          </h1>

          {/* Level progression display */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '24px 0' }}>
            <div
              style={{
                fontSize: '56px',
                fontWeight: 700,
                color: '#888',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              }}
            >
              {oldLevel}
            </div>

            <div style={{ fontSize: '28px', color: '#4f46e5', animation: 'pulse 0.8s ease-out' }}>
              →
            </div>

            <div
              className="level-flip"
              style={{
                fontSize: '56px',
                fontWeight: 700,
                color: '#4f46e5',
                textShadow: '0 0 20px rgba(79, 70, 229, 0.6)',
              }}
            >
              {newLevel}
            </div>
          </div>

          {/* Title */}
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#4f46e5', marginBottom: '16px' }}>
            {newTitle}
          </div>

          {/* Congratulations message */}
          <p style={{ fontSize: '14px', color: '#999', marginTop: '12px' }}>
            Keep earning XP to reach the next milestone!
          </p>

          {/* Progress bar animation */}
          <div
            style={{
              marginTop: '20px',
              height: '4px',
              backgroundColor: '#1a1a1a',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: '#4f46e5',
                animation: 'slideRight 1.5s ease-out',
                width: '100%',
                boxShadow: '0 0 10px rgba(79, 70, 229, 0.8)',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideRight {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
