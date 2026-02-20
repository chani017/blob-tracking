"use client";

import { useEffect, useRef, useState } from "react";
import { useBlobTracking, BlobTrackingState } from "../hooks/useBlobTracking";
import { useVideoRecording } from "../hooks/useVideoRecording";
import { VideoCanvasArea } from "./VideoCanvasArea";
import { ControlPanelArea } from "./ControlPanelArea";

export default function BlobTracker() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [maxBlobs, setMaxBlobs] = useState(5);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [threshold, setThreshold] = useState(100);
  const [blobSize, setBlobSize] = useState(40);
  const [sizeRandomness, setSizeRandomness] = useState(200);
  const [numberSize, setNumberSize] = useState(18);
  const [labelType, setLabelType] = useState<"size" | "id">("size");
  const [fillMode, setFillMode] = useState<
    "none" | "solid" | "lighten" | "multiply" | "difference"
  >("none");
  const [fillRatio, setFillRatio] = useState(100);
  const [colorRGB, setColorRGB] = useState({ r: 250, g: 250, b: 250 });
  const [lineSmoothness, setLineSmoothness] = useState(0);
  const [lineDashStyle, setLineDashStyle] = useState<"solid" | "dashed">(
    "solid",
  );
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "kr">("kr");

  const stateRef = useRef<BlobTrackingState>({
    maxBlobs,
    showNumbers,
    showLines,
    threshold,
    blobSize,
    sizeRandomness,
    numberSize,
    labelType,
    fillMode,
    fillRatio,
    colorRGB,
    lineSmoothness,
    lineDashStyle,
  });

  useEffect(() => {
    stateRef.current = {
      maxBlobs,
      showNumbers,
      showLines,
      threshold,
      blobSize,
      sizeRandomness,
      numberSize,
      labelType,
      fillMode,
      fillRatio,
      colorRGB,
      lineSmoothness,
      lineDashStyle,
    };
  }, [
    maxBlobs,
    showNumbers,
    showLines,
    threshold,
    blobSize,
    sizeRandomness,
    numberSize,
    labelType,
    fillMode,
    fillRatio,
    colorRGB,
    lineSmoothness,
    lineDashStyle,
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isRecording, handleToggleRecording } = useVideoRecording(canvasRef);
  useBlobTracking(videoSrc, videoRef, canvasRef, stateRef);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  return (
    <main className="flex flex-col items-center w-full min-h-screen md:min-h-0 md:h-screen md:overflow-hidden bg-black text-system-color p-4 md:p-4 scrollbar-hide">
      <section className="w-full flex flex-col md:flex-row gap-4 md:h-full md:overflow-hidden scrollbar-hide">
        <VideoCanvasArea
          videoSrc={videoSrc}
          videoRef={videoRef}
          canvasRef={canvasRef}
          isRecording={isRecording}
          handleToggleRecording={handleToggleRecording}
          handleFileUpload={handleFileUpload}
        />

        <ControlPanelArea
          lang={lang}
          setLang={setLang}
          activeTooltip={activeTooltip}
          setActiveTooltip={setActiveTooltip}
          threshold={threshold}
          setThreshold={setThreshold}
          maxBlobs={maxBlobs}
          setMaxBlobs={setMaxBlobs}
          blobSize={blobSize}
          setBlobSize={setBlobSize}
          sizeRandomness={sizeRandomness}
          setSizeRandomness={setSizeRandomness}
          fillMode={fillMode}
          setFillMode={setFillMode}
          fillRatio={fillRatio}
          setFillRatio={setFillRatio}
          showNumbers={showNumbers}
          setShowNumbers={setShowNumbers}
          labelType={labelType}
          setLabelType={setLabelType}
          numberSize={numberSize}
          setNumberSize={setNumberSize}
          showLines={showLines}
          setShowLines={setShowLines}
          lineDashStyle={lineDashStyle}
          setLineDashStyle={setLineDashStyle}
          lineSmoothness={lineSmoothness}
          setLineSmoothness={setLineSmoothness}
          colorRGB={colorRGB}
          setColorRGB={setColorRGB}
        />
      </section>
    </main>
  );
}
