"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls, { Level } from "hls.js";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
} from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { Slider } from "@heroui/slider";
import { Button } from "@heroui/button";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    if (Hls.isSupported() && src.endsWith(".m3u8")) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLevels(hls.levels);
        setCurrentLevel(hls.currentLevel);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentLevel(data.level);
      });

      video.addEventListener("timeupdate", updateTime);
      video.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        hls.destroy();
        hlsRef.current = null;
        video.removeEventListener("timeupdate", updateTime);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("timeupdate", updateTime);
      video.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        video.removeEventListener("timeupdate", updateTime);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && volume === 0) {
      setVolume(0.5);
    }
  };

  const handleVolumeChange = (value: number | number[]) => {
    const newVolume = Array.isArray(value) ? value[0] : value;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleProgressChange = (value: number | number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Array.isArray(value) ? value[0] : value;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleControlPanel = () => {
    setIsControlPanelOpen(!isControlPanelOpen);
  };

  const selectResolution = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
      setIsControlPanelOpen(false);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, handleMouseMove, handleMouseLeave]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-4xl mx-auto p-4 relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        <video
          ref={videoRef}
          poster={poster}
          autoPlay={false}
          preload="auto"
          playsInline
          className="rounded-lg shadow-lg w-full"
        />

        {/* Custom Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-opacity duration-300 ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Progress Bar */}
          <div className="px-2">
            <Slider
              ref={progressRef}
              value={currentTime}
              aria-label="Video Progress"
              className="w-full h-1 bg-gray-600 rounded-full cursor-pointer"
              defaultValue={0}
              maxValue={duration || 100}
              minValue={0}
              size="sm"
              step={1}
              onChange={handleProgressChange}
              style={{
                background: `linear-gradient(to right, #ff0000 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%)`,
              }}
            />
          </div>

          {/* Control Bar */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <Button onPress={togglePlay} aria-label="Play/Pause" className="text-white hover:text-gray-300 cursor-pointer" isIconOnly>
                {isPlaying ? (
                  <FaPause className="w-5 h-5" />
                ) : (
                  <FaPlay className="w-5 h-5" />
                )}
              </Button>
              <Button onPress={toggleMute} aria-label="Mute/Unmute" className="text-white hover:text-gray-300 cursor-pointer" isIconOnly>
                {isMuted || volume === 0 ? (
                  <FaVolumeMute className="w-5 h-5" />
                ) : (
                  <FaVolumeUp className="w-5 h-5" />
                )}
              </Button>
              <Slider
                ref={volumeRef}
                value={isMuted ? 0 : volume}
                aria-label="Volume"
                className="w-16 h-1 bg-gray-600 rounded-full cursor-pointer"
                defaultValue={1}
                maxValue={1}
                minValue={0}
                size="sm"
                step={0.01}
                onChange={handleVolumeChange}
                style={{
                  background: `linear-gradient(to right, #ffffff ${volume * 100}%, #4b5563 ${volume * 100}%)`,
                }}
              />
              <span className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {levels.length > 0 && (
                <div className="relative">
                  <Button
                  isIconOnly
                    onPress={toggleControlPanel}
                    aria-label="Settings"
                    className="text-white hover:text-gray-300 cursor-pointer"
                  >
                    <FaGear className="w-5.5 h-5.5 mt-2 mr-2" />
                  </Button>
                  {isControlPanelOpen && (
                    <div className="absolute bottom-10 right-0 w-48 bg-gray-900 rounded-lg shadow-xl z-30">
                      <div className="py-2">
                        <p className="px-4 py-2 text-sm text-gray-200 font-semibold">
                          Quality
                        </p>
                        {levels.map((level, index) => (
                          <Button
                          isIconOnly
                            key={index}
                            onPress={() => selectResolution(index)}
                            className={`cursor-pointer block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 ${
                              currentLevel === index ? "bg-gray-700" : ""
                            }`}
                          >
                            {level.height}p {currentLevel === index ? "(Current)" : ""}
                          </Button>
                        ))}
                        <Button
                        isIconOnly
                          onPress={() => selectResolution(-1)}
                          className={`cursor-pointer block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 ${
                            currentLevel === -1 ? "bg-gray-700" : ""
                          }`}
                        >
                          Auto {currentLevel === -1 ? "(Current)" : ""}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button
              isIconOnly
                onPress={toggleFullscreen}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                className="text-white hover:text-gray-300 cursor-pointer"
              >
                {isFullscreen ? (
                  <FaCompress className="w-5 h-5" />
                ) : (
                  <FaExpand className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Overlay for YouTube-like Aesthetics */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}