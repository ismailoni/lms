"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface VideoPlayerProps {
  src: string;
}

export default function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => setProgress(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "ArrowRight") {
        video.currentTime = Math.min(video.currentTime + 5, video.duration);
      } else if (e.code === "ArrowLeft") {
        video.currentTime = Math.max(video.currentTime - 5, 0);
      } else if (e.code === "KeyM") {
        toggleMute();
      } else if (e.code === "KeyF") {
        toggleFullscreen();
      } else if (/Digit[0-9]/.test(e.code)) {
        const percent = parseInt(e.code.replace("Digit", ""));
        video.currentTime = (percent / 10) * video.duration;
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [toggleMute]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
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

  const changePlaybackRate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rate = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setPlaybackRate(rate);
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isBuffering ? 1 : 0 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded"
      >
        Buffering...
      </motion.div>

      <video
        ref={videoRef}
        src={src}
        width="100%"
        style={{ borderRadius: "8px", objectFit: "cover" }}
        controlsList="nodownload"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={togglePlayPause}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <input
          type="range"
          min={0}
          max={duration}
          value={progress}
          onChange={handleSeek}
          step="0.1"
          className="flex-grow"
        />

        <span className="text-xs whitespace-nowrap">
          {Math.floor(progress)} / {Math.floor(duration)} sec
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm">Vol</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolume}
        />

        <button
          onClick={toggleMute}
          className="px-2 py-1 bg-gray-700 text-white rounded"
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>

        <select
          value={playbackRate}
          onChange={changePlaybackRate}
          className="px-2 py-1 rounded border"
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={1.5}>1.5×</option>
          <option value={2}>2×</option>
        </select>

        <button
          onClick={toggleFullscreen}
          className="px-2 py-1 bg-green-700 text-white rounded"
        >
          Fullscreen
        </button>
      </div>
    </div>
  );
}
