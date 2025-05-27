"use client";
import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Hls from "hls.js";

interface PlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<typeof videojs.players | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    const isHLS = src.endsWith(".m3u8");

    if (isHLS && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoElement);
    } else {
      videoElement.src = src;
    }

    playerRef.current = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: "auto",
      poster,
      fluid: true,
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered rounded-2xl shadow-lg"
          controls
          playsInline
        />
      </div>
    </div>
  );
}
