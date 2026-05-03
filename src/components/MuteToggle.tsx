import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudio } from './AudioProvider';

export const MuteToggle: React.FC = () => {
  const { isMuted, toggleMute } = useAudio();
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show tooltip after a short delay if still muted
    const timer = setTimeout(() => {
      if (isMuted) setShowTooltip(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isMuted]);

  return (
    <div className="fixed top-4 left-4 z-50 flex items-start gap-3">
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            toggleMute();
            setShowTooltip(false);
          }}
          className="bg-background/80 backdrop-blur-sm border-white/20 hover:bg-white/10 shadow-lg"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>

        {showTooltip && isMuted && (
          <div className="absolute left-0 top-14 w-48 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg shadow-xl text-xs relative border border-primary-foreground/20">
              <div className="absolute -top-1.5 left-4 w-3 h-3 bg-primary rotate-45 border-l border-t border-primary-foreground/20" />
              <button 
                onClick={() => setShowTooltip(false)}
                className="absolute top-1 right-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
              <p className="pr-4 leading-relaxed font-medium">
                Click here to enable the cozy fireplace and forest sounds! 🕯️🌲
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
