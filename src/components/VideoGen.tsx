import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Sparkles, Loader2, Download, AlertCircle } from 'lucide-react';
import { videoService } from '../services/geminiService';

export const VideoGen = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatus('Initializing Veo 3...');

    try {
      let operation = await videoService.generateVideo(prompt);
      setStatus('Generating cinematic frames...');

      // Polling
      const pollInterval = setInterval(async () => {
        try {
          operation = await videoService.pollOperation(operation);
          if (operation.done) {
            clearInterval(pollInterval);
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
              const response = await fetch(downloadLink, {
                method: 'GET',
                headers: {
                  'x-goog-api-key': process.env.GEMINI_API_KEY as string,
                },
              });
              const blob = await response.blob();
              setVideoUrl(URL.createObjectURL(blob));
              setIsGenerating(false);
              setStatus('Generation complete!');
            } else {
              throw new Error('No video URI found');
            }
          } else {
            setStatus('Still working on your masterpiece...');
          }
        } catch (err) {
          clearInterval(pollInterval);
          setError('Polling failed. Please try again.');
          setIsGenerating(false);
        }
      }, 10000);

    } catch (err: any) {
      console.error("Video generation failed:", err.message || err);
      setError(err.message || 'Failed to start generation.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto psp-glass rounded-2xl overflow-hidden border border-white/10 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 clip-hexagon bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
          <Video className="text-orange-400" size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-orange-100">Visualizer::Engine</h2>
          <p className="text-[10px] font-mono text-orange-400/50">Synthesizing cinematic data streams...</p>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter visualization parameters..."
          className="w-full h-32 bg-white/5 border border-orange-500/20 rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500/50 transition-all resize-none font-mono"
        />
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20 uppercase tracking-widest sao-glow"
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{status}</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Generate Visualizer</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 min-h-[200px] bg-black/40 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {videoUrl ? (
            <motion.div key="video-container" className="relative w-full h-full">
              <motion.video
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={videoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = videoUrl;
                  link.download = `VibeStation_Video_${Date.now()}.mp4`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="absolute bottom-4 right-4 p-3 bg-orange-600 hover:bg-orange-500 rounded-full shadow-lg transition-all flex items-center gap-2 text-sm font-bold sao-glow"
                title="Download MP4"
              >
                <Download size={20} />
                <span>Download MP4</span>
              </button>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 text-red-400"
            >
              <AlertCircle size={32} />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          ) : isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <Loader2 size={48} className="animate-spin text-purple-400 opacity-20" />
                <Sparkles size={24} className="absolute inset-0 m-auto text-purple-400 animate-pulse" />
              </div>
              <p className="text-xs text-white/40 animate-pulse">This may take a few minutes...</p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/20 flex flex-col items-center gap-2"
            >
              <Video size={48} className="opacity-10" />
              <p className="text-xs">Your generated video will appear here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
