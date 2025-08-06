"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipForward, 
  SkipBack,
  Settings,
  Download,
  RotateCcw,
  Loader2,
  PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./VideoPlayer.module.css";

interface VideoPlayerProps {
  src: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  className?: string;
}

export default function VideoPlayer({ src, onProgress, onComplete, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying && !isHovering && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, isHovering, showSettings]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const currentTime = video.currentTime;
      setProgress(currentTime);
      setCurrentTime(currentTime);
      onProgress?.(currentTime / video.duration);
    };
    
    const updateDuration = () => {
      setDuration(video.duration);
      setIsLoaded(true);
    };
    
    const updateBuffered = () => {
      if (video.buffered.length > 0) {
        setBufferedTime(video.buffered.end(video.buffered.length - 1));
      }
    };
    
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    // Event listeners
    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("progress", updateBuffered);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("progress", updateBuffered);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [onProgress, onComplete]);

  // Mouse movement detection
  useEffect(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Enhanced keyboard controls
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      
      // Only handle if video is focused or container is focused
      if (document.activeElement !== video && !containerRef.current?.contains(document.activeElement)) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyR":
          e.preventDefault();
          restart();
          break;
        case "Escape":
          if (showSettings) {
            setShowSettings(false);
          }
          break;
        default:
          if (/Digit[0-9]/.test(e.code)) {
            e.preventDefault();
            const percent = parseInt(e.code.replace("Digit", ""));
            seekToPercent(percent * 10);
          }
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [toggleMute, showSettings]);

  // Enhanced control functions
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
    resetControlsTimeout();
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration));
    resetControlsTimeout();
  };

  const restart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    resetControlsTimeout();
  };

  const changeVolume = (delta: number) => {
    if (!videoRef.current) return;
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    resetControlsTimeout();
  };

  const seekToPercent = (percent: number) => {
    if (!videoRef.current) return;
    const time = (percent / 100) * duration;
    videoRef.current.currentTime = time;
    setProgress(time);
    resetControlsTimeout();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    videoRef.current.currentTime = time;
    setProgress(time);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    resetControlsTimeout();
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full bg-black rounded-lg overflow-hidden shadow-2xl",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
    >
      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            <p className="text-gray-300 text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onClick={togglePlayPause}
        onDoubleClick={toggleFullscreen}
        preload="metadata"
      />

      {/* Buffering Overlay */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
          >
            <div className="bg-black/70 text-white px-6 py-3 rounded-full flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Buffering...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play Button Overlay */}
      <AnimatePresence>
        {!isPlaying && !isBuffering && isLoaded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 group-hover:scale-110 transition-transform">
              <PlayCircle className="w-16 h-16 text-white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {(showControls || !isPlaying) && isLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showControls || !isPlaying) && isLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto"
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div 
                ref={progressRef}
                className="relative h-2 bg-white/20 rounded-full cursor-pointer hover:h-3 transition-all group"
                onClick={handleProgressClick}
              >
                {/* Buffered Progress */}
                <div 
                  className="absolute h-full bg-white/30 rounded-full"
                  style={{ width: `${(bufferedTime / duration) * 100}%` }}
                />
                
                {/* Current Progress */}
                <div 
                  className="absolute h-full bg-blue-500 rounded-full"
                  style={{ width: `${(progress / duration) * 100}%` }}
                />
                
                {/* Progress Handle */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  style={{ left: `calc(${(progress / duration) * 100}% - 8px)` }}
                />
              </div>
            </div>

            {/* Control Bar */}
            <div className="flex items-center justify-between text-white">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                <button
                  onClick={() => skip(-10)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Rewind 10s (←)"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={() => skip(10)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Forward 10s (→)"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={restart}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Restart (R)"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Volume Controls */}
                <div className="flex items-center gap-2 group">
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  <div className="w-0 group-hover:w-20 transition-all duration-200 overflow-hidden">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolume}
                      className={cn("w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer", styles.slider)}
                    />
                  </div>
                </div>

                {/* Time Display */}
                <div className="text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* Settings Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={cn(
                          "absolute bottom-12 right-0 bg-gray-900 rounded-lg p-3 min-w-[160px] shadow-xl border border-gray-700",
                          styles.settingsMenu
                        )}
                      >
                        <div className="text-sm">
                          <div className="text-gray-400 font-medium mb-2">Playback Speed</div>
                          <div className="space-y-1">
                            {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => changePlaybackRate(rate)}
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition-colors",
                                  playbackRate === rate && "bg-blue-600 text-white"
                                )}
                              >
                                {rate}x {rate === 1 && "(Normal)"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = src;
                    a.download = 'video.mp4';
                    a.click();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Download Video"
                >
                  <Download className="w-5 h-5" />
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Overlay */}
      <div className="absolute top-4 right-4 text-white text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
          <div className="font-medium mb-2">Keyboard Shortcuts</div>
          <div className="space-y-1 text-xs">
            <div>Space - Play/Pause</div>
            <div>← → - Skip 10s</div>
            <div>↑ ↓ - Volume</div>
            <div>F - Fullscreen</div>
            <div>M - Mute</div>
            <div>R - Restart</div>
            <div>0-9 - Jump to %</div>
          </div>
        </div>
      </div>
    </div>
  );
}
