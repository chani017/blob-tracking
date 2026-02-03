"use client";

import { useEffect, useRef, useState } from "react";

interface BlobPoint {
  x: number;
  y: number;
  id: number;
  size: number;
}

const help = {
  threshold: {
      en: "Adjusts detection sensitivity. Higher values detect darker areas, lower values detect only the brightest.",
      kr: "객체 감지 민감도를 조절합니다. 값이 높아질수록 어두운 영역까지 더 많이 감지하고, 값이 낮아질수록 가장 밝은 영역만 감지합니다."
  },
  maxBlobs: {
      en: "Sets the maximum number of blobs to display on screen.",
      kr: "화면에 표시할 최대 객체 수를 설정합니다."
  },
  blobSize: {
      en: "Adjusts the base size of the rectangles representing detected blobs.",
      kr: "감지된 객체의 크기를 조절합니다."
  },
  randomness: {
      en: "Adds randomness to sizes. Higher values increase size variation between blobs.",
      kr: "각 객체의 크기에 무작위성을 부여합니다. 값이 높을수록 객체들 간의 크기 차이가 커집니다."
  },
  fillMode: {
      en: "Selects fill mode: Empty, Solid, Lighten, or Invert (Difference).",
      kr: "객체 내부를 채우는 방식을 선택합니다. (Empty: 비어있음, Solid: 채우기, Light: 밝게, Invert: 반전)"
  },
  fillRatio: {
      en: "Determines the percentage of objects to apply the fill effect to.",
      kr: "전체 객체 중 채우기 효과를 적용할 객체의 비율을 설정합니다."
  },
  showLabels: {
      en: "Toggles the display of labels on each blob.",
      kr: "각 객체에 라벨을 표시할지 여부를 설정합니다."
  },
  labelType: {
      en: "Display detection order (ID) or relative size on labels.",
      kr: "라벨에 감지된 순서(ID)를 표시할지, 객체의 상대적 크기를 표시할지 선택합니다."
  },
  labelSize: {
      en: "Adjusts the size of the label text.",
      kr: "라벨 텍스트의 크기를 조절합니다."
  },
  connectLines: {
      en: "Connects detected blobs with lines to show paths or relationships.",
      kr: "감지된 객체들을 선으로 연결합니다."
  },
  linePattern: {
      en: "Sets the line pattern to solid or dashed.",
      kr: "연결선의 형태를 실선 또는 점선으로 설정합니다."
  },
  smoothness: {
      en: "Adjusts the curvature (smoothness) of the connection lines.",
      kr: "연결선의 곡률 정도를 조절합니다."
  },
  colorControl: {
      en: "Changes colors of blobs and lines by adjusting R, G, B values.",
      kr: "객체와 연결선의 색상을 R(빨강), G(초록), B(파랑) 값을 조절하여 변경합니다."
  }
};

export default function BlobTracker() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [maxBlobs, setMaxBlobs] = useState(5);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [threshold, setThreshold] = useState(100);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [blobSize, setBlobSize] = useState(40);
  const [sizeRandomness, setSizeRandomness] = useState(200);
  const [numberSize, setNumberSize] = useState(18);
  const [labelType, setLabelType] = useState<'size' | 'id'>('size');
  const [fillMode, setFillMode] = useState<'none' | 'solid' | 'lighten' | 'multiply' | 'difference'>('none');
  const [fillRatio, setFillRatio] = useState(100);
  const [colorRGB, setColorRGB] = useState({ r: 250, g: 250, b: 250 });
  const [lineSmoothness, setLineSmoothness] = useState(0);
  const [lineDashStyle, setLineDashStyle] = useState<'solid' | 'dashed'>('solid');
  const [isRecording, setIsRecording] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'kr'>('kr');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stateRef = useRef({
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
    lineDashStyle
  });

  useEffect(() => {
    stateRef.current = { maxBlobs, showNumbers, showLines, threshold, blobSize, sizeRandomness, numberSize, labelType, fillMode, fillRatio, colorRGB, lineSmoothness, lineDashStyle };
  }, [maxBlobs, showNumbers, showLines, threshold, blobSize, sizeRandomness, numberSize, labelType, fillMode, fillRatio, colorRGB, lineSmoothness, lineDashStyle]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const offCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const visitedRef = useRef<Uint8Array | null>(null);
  const queueBufferRef = useRef<Int32Array | null>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null);

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

  const handleToggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=h264') 
        ? 'video/mp4;codecs=h264' 
        : 'video/mp4';

      const stream = canvas.captureStream(60);
      const recorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blob-tracking-${Date.now()}.mp4`;
        a.click();
        URL.revokeObjectURL(url);
      };

      recorder.start();
      setIsRecording(true);
    }
  };

  useEffect(() => {
    if (!videoSrc) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      if (video.paused || video.ended) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const { 
        maxBlobs: currentMax, 
        showNumbers: currentShowNum, 
        showLines: currentShowLines, 
        threshold: currentThresh, 
        blobSize: currentSize,
        sizeRandomness: currentRandom,
        numberSize: currentNumSize
      } = stateRef.current;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const scale = 0.1;
      const smallW = Math.floor(canvas.width * scale);
      const smallH = Math.floor(canvas.height * scale);
      
      if (!offCanvasRef.current) {
        offCanvasRef.current = document.createElement('canvas');
      }
      const offCanvas = offCanvasRef.current;
      if (offCanvas.width !== smallW || offCanvas.height !== smallH) {
        offCanvas.width = smallW;
        offCanvas.height = smallH;
      }
      
      const offCtx = offCanvas.getContext('2d', { alpha: false });
      if (!offCtx) return;

      offCtx.drawImage(video, 0, 0, smallW, smallH);
      const frameData = offCtx.getImageData(0, 0, smallW, smallH);
      const data = frameData.data;

      const blobs: BlobPoint[] = [];
      const totalPixels = smallW * smallH;
      if (!visitedRef.current || visitedRef.current.length !== totalPixels) {
        visitedRef.current = new Uint8Array(totalPixels);
        queueBufferRef.current = new Int32Array(totalPixels);
      } else {
        visitedRef.current.fill(0);
      }
      const visited = visitedRef.current;
      const queue = queueBufferRef.current!;

      for (let y = 0; y < smallH; y++) {
        for (let x = 0; x < smallW; x++) {
          const idx = (y * smallW + x) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

          if (brightness > currentThresh && !visited[y * smallW + x]) {
            let sumX = 0, sumY = 0, count = 0;
            let head = 0, tail = 0;
            
            queue[tail++] = x;
            queue[tail++] = y;
            visited[y * smallW + x] = 1;

            while (head < tail) {
              const cx = queue[head++];
              const cy = queue[head++];
              sumX += cx;
              sumY += cy;
              count++;
              
              // Manual neighbor check to avoid ANY allocations in the critical loop
              // Right
              let nx = cx + 1, ny = cy;
              if (nx < smallW) {
                const nIdx = ny * smallW + nx;
                if (!visited[nIdx]) {
                  const pIdx = nIdx * 4;
                  if ((data[pIdx] + data[pIdx + 1] + data[pIdx + 2]) / 3 > currentThresh) {
                    visited[nIdx] = 1;
                    queue[tail++] = nx;
                    queue[tail++] = ny;
                  }
                }
              }
              // Left
              nx = cx - 1;
              if (nx >= 0) {
                const nIdx = ny * smallW + nx;
                if (!visited[nIdx]) {
                  const pIdx = nIdx * 4;
                  if ((data[pIdx] + data[pIdx + 1] + data[pIdx + 2]) / 3 > currentThresh) {
                    visited[nIdx] = 1;
                    queue[tail++] = nx;
                    queue[tail++] = ny;
                  }
                }
              }
              // Down
              nx = cx; ny = cy + 1;
              if (ny < smallH) {
                const nIdx = ny * smallW + nx;
                if (!visited[nIdx]) {
                  const pIdx = nIdx * 4;
                  if ((data[pIdx] + data[pIdx + 1] + data[pIdx + 2]) / 3 > currentThresh) {
                    visited[nIdx] = 1;
                    queue[tail++] = nx;
                    queue[tail++] = ny;
                  }
                }
              }
              // Up
              ny = cy - 1;
              if (ny >= 0) {
                const nIdx = ny * smallW + nx;
                if (!visited[nIdx]) {
                  const pIdx = nIdx * 4;
                  if ((data[pIdx] + data[pIdx + 1] + data[pIdx + 2]) / 3 > currentThresh) {
                    visited[nIdx] = 1;
                    queue[tail++] = nx;
                    queue[tail++] = ny;
                  }
                }
              }
            }
            
            if (count > 2) {
                blobs.push({
                    x: (sumX / count) / scale,
                    y: (sumY / count) / scale,
                    id: 0,
                    size: count
                });
            }
          }
        }
      }

      blobs.sort((a, b) => b.size - a.size);
      const activeBlobs = blobs.slice(0, currentMax);
      activeBlobs.forEach((b, i) => b.id = i);

      const scaleFactor = Math.max(0.4, canvas.width / 1280);
      const colorStr = `rgb(${stateRef.current.colorRGB.r}, ${stateRef.current.colorRGB.g}, ${stateRef.current.colorRGB.b})`;

      if (currentShowLines && activeBlobs.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = 2 * scaleFactor;
        ctx.lineJoin = "round";
        ctx.lineCap = "butt";

        if (stateRef.current.lineDashStyle === 'dashed') {
          ctx.setLineDash([5 * scaleFactor, 10 * scaleFactor]);
        } else {
          ctx.setLineDash([]);
        }

        if (stateRef.current.lineSmoothness > 0) {
          const smoothness = stateRef.current.lineSmoothness / 100;
          ctx.moveTo(activeBlobs[0].x, activeBlobs[0].y);
          
          for (let i = 0; i < activeBlobs.length; i++) {
            const p0 = activeBlobs[(i - 1 + activeBlobs.length) % activeBlobs.length];
            const p1 = activeBlobs[i];
            const p2 = activeBlobs[(i + 1) % activeBlobs.length];
            const p3 = activeBlobs[(i + 2) % activeBlobs.length];

            const cp1x = p1.x + (p2.x - p0.x) / 6 * smoothness;
            const cp1y = p1.y + (p2.y - p0.y) / 6 * smoothness;
            const cp2x = p2.x - (p3.x - p1.x) / 6 * smoothness;
            const cp2y = p2.y - (p3.y - p1.y) / 6 * smoothness;

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
          }
        } else {
          activeBlobs.forEach((blob, i) => {
            if (i === 0) ctx.moveTo(blob.x, blob.y);
            else ctx.lineTo(blob.x, blob.y);
          });
          ctx.lineTo(activeBlobs[0].x, activeBlobs[0].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      activeBlobs.forEach(blob => {
        const randW = Math.sin(blob.id * 1234.567);
        const randH = Math.sin(blob.id * 8910.111);

        const width = currentSize * (1 + randW * (currentRandom / 100));
        const height = currentSize * (1 + randH * (currentRandom / 100));

        ctx.beginPath();
        ctx.rect(blob.x - width/2, blob.y - height/2, width, height);
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = 3 * scaleFactor;
        ctx.stroke();

        const currentFill = stateRef.current.fillMode;
        const currentFillRatio = stateRef.current.fillRatio;
        const fillScore = (blob.id * 137.5) % 100;
        const shouldFill = fillScore < currentFillRatio;

        if (currentFill !== 'none' && shouldFill) {
            ctx.save();
            ctx.fillStyle = colorStr;
            if (currentFill === 'solid') {
                ctx.fill();
            } else if (currentFill === 'difference') {
                ctx.globalCompositeOperation = 'difference';
                ctx.fill();
            } else if (currentFill === 'lighten') {
                ctx.globalAlpha = 0.5;
                ctx.globalCompositeOperation = 'lighten';
                ctx.fill();
            }
            ctx.restore();
        }

        if (currentShowNum) {
            ctx.fillStyle = colorStr;
            ctx.font = `500 ${currentNumSize}px "EnvyCodeR Nerd Font Mono", monospace`;
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            const padding = 6 * scaleFactor;
            
            let label = `ID:${blob.id}`;
            if (stateRef.current.labelType === 'size') {
                const relW = width / canvas.width;
                const relH = height / canvas.height;
                label = `x=${relW.toFixed(3)}, y=${relH.toFixed(3)}`;
            }
            
            ctx.fillText(label, blob.x - width/2, blob.y + height/2 + padding);
        }
      });

      animationRef.current = requestAnimationFrame(processFrame);
    };

    animationRef.current = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [videoSrc]);

  useEffect(() => {
    if (!videoSrc) {
      setIsFloating(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (window.innerWidth < 768) {
          setIsFloating(!entry.isIntersecting);
        } else {
          setIsFloating(false);
        }
      },
      { threshold: 0.5 }
    );

    if (viewportContainerRef.current) {
      observer.observe(viewportContainerRef.current);
    }

    return () => observer.disconnect();
  }, [videoSrc]);

  const renderTooltip = (id: string, text: string) => {
    if (activeTooltip !== id) return null;
    return (
      <div className="absolute top-6 left-0 z-10 w-full bg-white text-black p-2 text-[0.625rem] leading-normal font-medium uppercase tracking-tight">
        {text}
      </div>
    );
  };

  const renderInfoButton = (id: string) => (
    <button 
        onMouseEnter={() => setActiveTooltip(id)}
        onMouseLeave={() => setActiveTooltip(null)}
        onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
        className="w-3 h-3 rounded-full border border-neutral-600 flex items-center justify-center text-[0.425rem] text-neutral-400 cursor-help"
    >
        i
    </button>
  );

  return (
    <main className="flex flex-col items-center w-full min-h-screen md:min-h-0 md:h-screen md:overflow-hidden bg-black text-white p-4 md:p-8 scrollbar-hide">
      <section className="max-w-7xl w-full flex flex-col md:flex-row gap-8 md:h-full md:overflow-hidden scrollbar-hide">
        <article className="flex-grow flex flex-col gap-4 md:w-2/3 md:h-full md:overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center p-4 bg-black border border-white">
            <h1 className="text-white tracking-tight font-medium text-xs uppercase">
              Blob Tracking <br className="md:hidden" /> for Web
            </h1>
            <div className="flex gap-3">
              {videoSrc && (
                <button 
                  onClick={handleToggleRecording}
                  className={`px-4 py-2 font-medium text-xs border transition flex items-center gap-2 ${
                    isRecording 
                    ? 'bg-red-600 border-red-600 text-white animate-pulse' 
                    : 'bg-black border-white text-white hover:bg-white hover:text-black'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-red-600'}`} />
                  {isRecording ? 'STOP' : 'RECORD'}
                </button>
              )}
              <label className="cursor-pointer bg-black border border-white hover:bg-white transition px-4 py-2 font-medium text-xs hover:text-black tracking-tight uppercase">
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
            className="relative w-full bg-black overflow-hidden shadow-2xl border border-white transition-[aspect-ratio] duration-500"
            style={{ aspectRatio: aspectRatio ? `${aspectRatio}` : '16 / 9' }}
          >
            <div className={`${
              isFloating 
                ? `fixed z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white transform pointer-events-none ${
                    aspectRatio && aspectRatio > 1 
                      ? 'top-0 left-[4%] w-[92%]' 
                      : 'top-0 left-4 w-[45%]'
                  }` 
                : 'relative w-full h-full'
            }`}>
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
                className={`w-full h-full object-contain block ${!videoSrc ? 'hidden' : ''}`}
              />
            </div>
          </div>
        </article>

        <article className="flex flex-col gap-4 md:w-1/3 md:min-w-[320px] md:h-full md:overflow-y-auto scrollbar-hide">
            <article className="flex flex-col gap-y-3">
            <div className="flex justify-between items-center">
                <p className="text-xs text-white font-medium uppercase tracking-tight">Blobs</p>
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => setLang('kr')}
                        className={`text-xs font-medium transition-colors ${lang === 'kr' ? 'text-white' : 'text-neutral-500'}`}
                    >
                        KR
                    </button>
                    <span className="text-[10px] text-neutral-800">/</span>
                    <button 
                        onClick={() => setLang('en')}
                        className={`text-xs font-medium transition-colors ${lang === 'en' ? 'text-white' : 'text-neutral-500'}`}
                    >
                        EN
                    </button>
                </div>
            </div>
            <div className="bg-black p-4 border border-white flex flex-col gap-y-4">
                <label className="flex flex-col gap-3 relative">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white font-medium uppercase tracking-tight">Threshold</span>
                        {renderInfoButton('threshold')}
                        {renderTooltip('threshold', help.threshold[lang])}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[0.625rem] w-6 text-neutral-500 uppercase">Low</span>
                        <input 
                        type="range" 
                        min="50" 
                        max="350" 
                        value={380 - threshold} 
                        onChange={(e) => setThreshold(380 - +e.target.value)}
                        className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer" 
                        />
                        <span className="text-[0.625rem] w-6 text-neutral-500 uppercase">High</span>
                    </div>
                </label>
                <label className="flex flex-col gap-2 relative">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white font-medium uppercase tracking-tight">Max Blobs</span>
                            {renderInfoButton('maxBlobs')}
                            {renderTooltip('maxBlobs', help.maxBlobs[lang])}
                        </div>
                        <span className="text-xs text-neutral-500 font-light uppercase tracking-tight">{maxBlobs}</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={maxBlobs} 
                        onChange={(e) => setMaxBlobs(+e.target.value)}
                        className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                    />
                </label>
                <label className="flex flex-col gap-2 relative">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white font-medium uppercase tracking-tight">Blob Size</span>
                            {renderInfoButton('blobSize')}
                            {renderTooltip('blobSize', help.blobSize[lang])}
                        </div>
                        <span className="text-xs text-neutral-500 font-light uppercase tracking-tight">{blobSize}px</span>
                    </div>
                    <input 
                        type="range" 
                        min="10" 
                        max="150" 
                        value={blobSize} 
                        onChange={(e) => setBlobSize(+e.target.value)}
                        className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                    />
                </label>
                <label className="flex flex-col gap-2 relative">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white font-medium uppercase tracking-tight">Blob Size Randomness</span>
                            {renderInfoButton('randomness')}
                            {renderTooltip('randomness', help.randomness[lang])}
                        </div>
                        <span className="text-xs text-neutral-500 font-light uppercase tracking-tight">{sizeRandomness}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="300" 
                        value={sizeRandomness} 
                        onChange={(e) => setSizeRandomness(+e.target.value)}
                        className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                    />
                </label>
                <div className="flex items-center gap-1.5 relative">
                    <span className="text-xs text-white font-medium uppercase tracking-tight">Blob Fill Mode</span>
                    {renderInfoButton('fillMode')}
                    {renderTooltip('fillMode', help.fillMode[lang])}
                </div>
             <div className="grid grid-cols-2 gap-2">
               <button 
                onClick={() => setFillMode('none')}
                className={`px-3 py-1.5 text-[0.625rem] font-medium uppercase transition-colors border border-white ${fillMode === 'none' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'}`}
               >
                 Empty
               </button>
               <button 
                onClick={() => setFillMode('solid')}
                className={`px-3 py-1.5 text-[0.625rem] font-medium uppercase transition-colors border border-white ${fillMode === 'solid' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'}`}
               >
                 Solid
               </button>
               <button 
                onClick={() => setFillMode('lighten')}
                className={`px-3 py-1.5 text-[0.625rem] font-medium uppercase transition-colors border border-white ${fillMode === 'lighten' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'}`}
               >
                 Lighten
               </button>
               <button 
                onClick={() => setFillMode('difference')}
                className={`px-3 py-1.5 text-[0.625rem] font-medium uppercase transition-colors border border-white ${fillMode === 'difference' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'}`}
               >
                 Invert
               </button>
             </div>
              <label className="flex flex-col gap-2 mt-2 relative">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white font-medium uppercase tracking-tight">Fill Ratio</span>
                        {renderInfoButton('fillRatio')}
                        {renderTooltip('fillRatio', help.fillRatio[lang])}
                    </div>
                    <span className="text-xs text-neutral-500 font-light uppercase tracking-tight">{fillRatio}%</span>
                 </div>
                 <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={fillRatio} 
                    onChange={(e) => setFillRatio(+e.target.value)}
                    className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                  />
              </label>
            </div>
            </article>

          <article className="flex flex-col gap-y-3">
             <p className="text-xs text-white font-medium uppercase tracking-tight">Labels</p>
             <div className="bg-black p-4 border border-white flex flex-col gap-y-4">
                <div className="flex items-center justify-between relative">
                   <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white font-medium uppercase tracking-tight">Show Labels</span>
                      {renderInfoButton('showLabels')}
                      {renderTooltip('showLabels', help.showLabels[lang])}
                   </div>
                   <button 
                      onClick={() => setShowNumbers(!showNumbers)}
                      className={`w-12 h-6 transition-colors relative border border-white ${showNumbers ? 'bg-white' : 'bg-black'}`}
                   >
                      <div className={`absolute top-0.5 w-4.5 h-4.5 transition-transform ${showNumbers ? 'left-6.5 bg-black' : 'left-0.5 bg-white'}`} />
                   </button>
                </div>

                <div className="flex items-center justify-between relative mb-1">
                   <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white font-medium uppercase tracking-tight">Label Type</span>
                      {renderInfoButton('labelType')}
                      {renderTooltip('labelType', help.labelType[lang])}
                   </div>
                   <div className="flex border border-white">
                     <button 
                      onClick={() => setLabelType('id')}
                      className={`px-3 py-1 text-[0.625rem] font-medium uppercase transition-colors ${labelType === 'id' ? 'bg-white text-black' : 'bg-black text-white'}`}
                     >
                       ID
                     </button>
                     <button 
                      onClick={() => setLabelType('size')}
                      className={`px-3 py-1 text-[0.625rem] font-medium uppercase transition-colors ${labelType === 'size' ? 'bg-white text-black' : 'bg-black text-white'}`}
                     >
                       Size
                     </button>
                   </div>
                </div>

                <label className="flex flex-col gap-2 relative">
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white font-medium uppercase tracking-tight">Label Size</span>
                        {renderInfoButton('labelSize')}
                        {renderTooltip('labelSize', help.labelSize[lang])}
                     </div>
                     <span className="text-xs text-neutral-500 font-light uppercase tracking-tight">{numberSize}px</span>
                  </div>
                  <input 
                     type="range" 
                     min="5" 
                     max="75" 
                     value={numberSize} 
                     onChange={(e) => setNumberSize(+e.target.value)}
                     className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                   />
                </label>
             </div>
          </article>

          <article className="flex flex-col gap-y-3">
             <p className="text-xs text-white font-medium uppercase tracking-tight">Lines</p>
             <div className="bg-black p-4 border border-white flex flex-col gap-y-4">
                <div className="flex items-center justify-between relative">
                   <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white font-medium uppercase tracking-tight">Connect Lines</span>
                      {renderInfoButton('connectLines')}
                      {renderTooltip('connectLines', help.connectLines[lang])}
                   </div>
                   <button 
                      onClick={() => setShowLines(!showLines)}
                      className={`w-12 h-6 transition-colors relative border border-white ${showLines ? 'bg-white' : 'bg-black'}`}
                   >
                      <div className={`absolute top-0.5 w-4.5 h-4.5 transition-transform ${showLines ? 'left-6.5 bg-black' : 'left-0.5 bg-white'}`} />
                   </button>
                </div>

                 <div className="flex items-center justify-between relative mb-1">
                   <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white font-medium uppercase tracking-tight">Line Pattern</span>
                      {renderInfoButton('linePattern')}
                      {renderTooltip('linePattern', help.linePattern[lang])}
                   </div>
                   <div className="flex border border-white">
                     <button 
                      onClick={() => setLineDashStyle('solid')}
                      className={`px-3 py-1 text-[0.625rem] font-medium uppercase transition-colors ${lineDashStyle === 'solid' ? 'bg-white text-black' : 'bg-black text-white'}`}
                     >
                       Solid
                     </button>
                     <button 
                      onClick={() => setLineDashStyle('dashed')}
                      className={`px-3 py-1 text-[0.625rem] font-medium uppercase transition-colors ${lineDashStyle === 'dashed' ? 'bg-white text-black' : 'bg-black text-white'}`}
                     >
                       Dashed
                     </button>
                   </div>
                </div>

                <label className="flex flex-col gap-2 relative">
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white font-medium uppercase tracking-tight">Line Smoothness</span>
                        {renderInfoButton('smoothness')}
                        {renderTooltip('smoothness', help.smoothness[lang])}
                     </div>
                     <span className="text-xs text-neutral-500 font-light uppercase tracking-tight">{lineSmoothness}%</span>
                  </div>
                  <input 
                     type="range" 
                     min="0" 
                     max="100" 
                     value={lineSmoothness} 
                     onChange={(e) => setLineSmoothness(+e.target.value)}
                     className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                   />
                </label>

             </div>
          </article>

          <article className="flex flex-col gap-y-3">
             <p className="text-xs text-white font-medium uppercase tracking-tight">Global Styles</p>
             <div className="bg-black p-4 border border-white flex flex-col gap-3">
                 <div className="flex items-center gap-1.5 relative">
                    <span className="text-xs text-white font-medium uppercase tracking-tight">Color Control</span>
                    {renderInfoButton('colorControl')}
                    {renderTooltip('colorControl', help.colorControl[lang])}
                 </div>
                <div className="flex flex-col gap-3">
                   <div className="flex items-center gap-3">
                     <span className="text-[0.625rem] text-red-500 font-bold w-4">R</span>
                     <input 
                       type="range" min="0" max="255" value={colorRGB.r} 
                       onChange={(e) => setColorRGB(prev => ({ ...prev, r: +e.target.value }))}
                       className="w-full accent-red-500 h-px bg-white/20 appearance-none cursor-pointer" 
                     />
                     <span className="text-[0.625rem] text-neutral-500 w-6 text-right font-mono">{colorRGB.r}</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="text-[0.625rem] text-green-500 font-bold w-4">G</span>
                     <input 
                       type="range" min="0" max="255" value={colorRGB.g} 
                       onChange={(e) => setColorRGB(prev => ({ ...prev, g: +e.target.value }))}
                       className="w-full accent-green-500 h-px bg-white/20 appearance-none cursor-pointer" 
                     />
                     <span className="text-[0.625rem] text-neutral-500 w-6 text-right font-mono">{colorRGB.g}</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="text-[0.625rem] text-blue-500 font-bold w-4">B</span>
                     <input 
                       type="range" min="0" max="255" value={colorRGB.b} 
                       onChange={(e) => setColorRGB(prev => ({ ...prev, b: +e.target.value }))}
                       className="w-full accent-blue-500 h-px bg-white/20 appearance-none cursor-pointer" 
                     />
                     <span className="text-[0.625rem] text-neutral-500 w-6 text-right font-mono">{colorRGB.b}</span>
                   </div>
                </div>
             </div>
          </article>

          <footer className="mb-16 md:mb-0">
            <p className="text-[0.625rem] text-neutral-500 tracking-widest uppercase">
              © 2026 @dachanjeong.xyz All rights reserved.
            </p>
          </footer>
        </article>
      </section>
    </main>
  );
}
