import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, Loader2, Activity } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

export const LiveVoice = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');

  const connect = async () => {
    setIsConnecting(true);
    // This is a simplified version for the UI. 
    // Real implementation would use Web Audio API and ai.live.connect
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
    }, 1500);
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto psp-glass rounded-2xl overflow-hidden border border-white/10 p-8 items-center justify-center space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 clip-hexagon bg-orange-500/20 flex items-center justify-center border border-orange-500/30 mx-auto mb-4">
          <Mic className="text-orange-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold tracking-widest uppercase text-orange-100">Voice::Link</h2>
        <p className="text-[10px] font-mono text-orange-400/50 uppercase tracking-widest">Establishing neural audio bridge...</p>
      </div>

      <div className="relative">
        <motion.div
          animate={{
            scale: isConnected ? [1, 1.1, 1] : 1,
            opacity: isConnected ? [0.5, 1, 0.5] : 0.5,
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-orange-500/20 clip-hexagon blur-3xl"
        />
        
        <button
          onClick={isConnected ? disconnect : connect}
          disabled={isConnecting}
          className={cn(
            "relative w-32 h-32 clip-hexagon flex items-center justify-center transition-all shadow-2xl sao-glow",
            isConnected ? "bg-red-500 hover:bg-red-600" : "bg-orange-600 hover:bg-orange-500",
            isConnecting && "opacity-50 cursor-not-allowed"
          )}
        >
          {isConnecting ? (
            <Loader2 size={48} className="animate-spin" />
          ) : isConnected ? (
            <MicOff size={48} />
          ) : (
            <Mic size={48} />
          )}
        </button>
      </div>

      <div className="w-full space-y-4">
        <div className="h-12 flex items-center justify-center gap-1">
          {isConnected ? (
            [...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [8, Math.random() * 40 + 10, 8] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                className="w-1.5 bg-orange-400 rounded-full"
              />
            ))
          ) : (
            <div className="text-white/20 text-xs uppercase tracking-widest font-bold">Microphone Offline</div>
          )}
        </div>

        <div className="p-4 bg-white/5 rounded-xl border border-white/5 min-h-[100px] flex items-center justify-center text-center">
          <p className="text-sm text-white/60 italic">
            {isConnected 
              ? "Listening... Try saying 'Tell me about the history of jazz'" 
              : "Click the button above to start a voice session."}
          </p>
        </div>
      </div>

      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-orange-400 text-xs font-mono font-bold uppercase tracking-tighter"
        >
          <div className="w-2 h-2 bg-orange-400 clip-hexagon animate-pulse" />
          Live Session Active
        </motion.div>
      )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
