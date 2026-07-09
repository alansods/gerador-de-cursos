import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "./ui/button";

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className = "" }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extrair ID do vídeo do YouTube da URL
  useEffect(() => {
    console.log("VideoPlayer - URL recebida:", src);
    const youtubeRegex =
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = src.match(youtubeRegex);

    console.log("VideoPlayer - Match encontrado:", match);

    if (match) {
      setIsYouTube(true);
      setYoutubeVideoId(match[1]);
      console.log("VideoPlayer - YouTube detectado, ID:", match[1]);
    } else {
      setIsYouTube(false);
      console.log("VideoPlayer - Não é YouTube, usando player local");
    }
  }, [src]);

  // Se for vídeo do YouTube, renderizar iframe
  if (isYouTube) {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative bg-black rounded-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&origin=${window.location.origin}`}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video player"
          />
        </div>
      </div>
    );
  }

  // Controles para vídeo local
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          className="w-full aspect-video"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Overlay de controle quando pausado */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-16 h-16"
              onClick={togglePlay}
            >
              <Play className="h-8 w-8 ml-1" />
            </Button>
          </div>
        )}

        {/* Controles do vídeo */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Barra de progresso */}
          <div
            className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
              onClick={() => videoRef.current?.requestFullscreen()}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
