"use client";

import React, { useState, useEffect, useRef } from "react";

interface VideoCanvasAreaProps {
  videoSrc: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isRecording: boolean;
  handleToggleRecording: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VideoCanvasArea = React.memo(function VideoCanvasArea({
  videoSrc,
  videoRef,
  canvasRef,
  isRecording,
  handleToggleRecording,
  handleFileUpload,
}: VideoCanvasAreaProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isFloating, setIsFloating] = useState(false);
  const viewportContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoSrc) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (window.innerWidth < 768) {
          setIsFloating(!entry.isIntersecting);
        } else {
          setIsFloating(false);
        }
      },
      { threshold: 0.5 },
    );

    if (viewportContainerRef.current) {
      observer.observe(viewportContainerRef.current);
    }

    return () => observer.disconnect();
  }, [videoSrc]);

  return (
    <article className="flex-grow flex flex-col gap-4 md:w-2/3 md:h-full md:overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center p-4 bg-black border border-system-color">
        <h1 className="text-system-color tracking-tight font-medium text-xs uppercase">
          Blob Tracking <br className="md:hidden" /> for Web
        </h1>
        <div className="flex gap-3">
          {videoSrc && (
            <button
              onClick={handleToggleRecording}
              className={`px-4 py-2 font-medium text-xs border transition flex items-center gap-2 ${
                isRecording
                  ? "bg-red-600 border-red-600 text-system-color animate-pulse"
                  : "bg-black border-system-color text-system-color hover:bg-system-color hover:text-black"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isRecording ? "bg-system-color" : "bg-red-600"}`}
              />
              {isRecording ? "STOP" : "RECORD"}
            </button>
          )}
          <label className="cursor-pointer bg-black border border-system-color hover:bg-system-color transition px-4 py-2 font-medium text-xs hover:text-black tracking-tight uppercase">
            Upload
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      <div
        ref={viewportContainerRef}
        className="relative w-full bg-black overflow-hidden shadow-2xl border border-system-color transition-[aspect-ratio] duration-500"
        style={{ aspectRatio: aspectRatio ? `${aspectRatio}` : "16 / 9" }}
      >
        <div
          className={`${
            videoSrc && isFloating
              ? `fixed z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-system-color transform pointer-events-none ${
                  aspectRatio && aspectRatio > 1
                    ? "top-0 left-[4%] w-[92%]"
                    : "top-0 left-4 w-[45%]"
                }`
              : "relative w-full h-full"
          }`}
        >
          {!videoSrc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-2 z-10 text-xs uppercase">
              <p className="font-normal">Upload a video to start tracking</p>
            </div>
          )}

          {videoSrc && (
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                setAspectRatio(video.videoWidth / video.videoHeight);
              }}
              className="absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none"
            />
          )}

          <canvas
            ref={canvasRef}
            className={`w-full h-full object-contain block ${!videoSrc ? "hidden" : ""}`}
          />
        </div>
      </div>
    </article>
  );
});
