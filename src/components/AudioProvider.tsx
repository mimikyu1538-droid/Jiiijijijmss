import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playClick: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(true); // Default to muted to comply with autoplay policies
  const fireplaceRef = useRef<HTMLAudioElement | null>(null);
  const forestRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fireplaceRef.current = new Audio('/audio/fireplace.mp3');
    fireplaceRef.current.loop = true;
    fireplaceRef.current.volume = 0.5;

    forestRef.current = new Audio('/audio/forest.mp3');
    forestRef.current.loop = true;
    forestRef.current.volume = 0.3;

    clickRef.current = new Audio('/audio/click.mp3');

    return () => {
      fireplaceRef.current?.pause();
      forestRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (isMuted) {
      fireplaceRef.current?.pause();
      forestRef.current?.pause();
    } else {
      fireplaceRef.current?.play().catch(e => console.error("Audio play failed:", e));
      forestRef.current?.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [isMuted]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
        playClick();
      }
    };

    document.addEventListener('click', handleGlobalClick, true); // Use capture to ensure we catch it even if bubbling is stopped
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, []);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const playClick = () => {
    if (clickRef.current) {
      clickRef.current.currentTime = 0;
      clickRef.current.play().catch(e => console.error("Click sound failed:", e));
    }
  };

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute, playClick }}>
      {children}
    </AudioContext.Provider>
  );
};
