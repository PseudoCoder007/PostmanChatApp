import { useTutorial } from '@/hooks/useTutorial';

export function TutorialOverlay() {
  const { currentStep, nextStep, skipTutorial } = useTutorial();

  if (!currentStep) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={skipTutorial}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          backgroundColor: '#0a0a0a',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          border: '1px solid #333',
          animation: 'slideUp 0.4s ease-out',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>
          {currentStep.title.split(' ')[0]}
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', color: '#fff' }}>
          {currentStep.title.split(' ').slice(1).join(' ')}
        </h2>
        <p style={{ color: '#999', lineHeight: 1.6, marginBottom: '24px', fontSize: '14px' }}>
          {currentStep.description}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={skipTutorial}
            style={{
              padding: '10px 16px',
              backgroundColor: '#1a1a1a',
              color: '#999',
              border: '1px solid #333',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.backgroundColor = '#222';
              el.style.color = '#ccc';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.backgroundColor = '#1a1a1a';
              el.style.color = '#999';
            }}
          >
            Skip
          </button>
          <button
            onClick={nextStep}
            style={{
              padding: '10px 16px',
              backgroundColor: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.backgroundColor = '#6366f1';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.backgroundColor = '#4f46e5';
            }}
          >
            {currentStep.buttonLabel || 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
