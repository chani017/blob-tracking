"use client";

import { useEffect, useRef, useState } from "react";

interface BlobPoint {
  x: number;
  y: number;
  id: number;
  size: number;
}

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
  const [colorRGB, setColorRGB] = useState({ r: 255, g: 255, b: 255 });
  const [isRecording, setIsRecording] = useState(false);
  const [isFloating, setIsFloating] = useState(false);

  const [fontLoaded, setFontLoaded] = useState(false);
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
    fontLoaded
  });

  useEffect(() => {
    stateRef.current = { maxBlobs, showNumbers, showLines, threshold, blobSize, sizeRandomness, numberSize, labelType, fillMode, fillRatio, colorRGB, fontLoaded };
  }, [maxBlobs, showNumbers, showLines, threshold, blobSize, sizeRandomness, numberSize, labelType, fillMode, fillRatio, colorRGB, fontLoaded]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const offCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const visitedRef = useRef<Uint8Array | null>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  useEffect(() => {
    document.fonts.load('14px "EnvyCodeR Nerd Font Mono"').then(() => {
        setFontLoaded(true);
    });
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;


      const types = [
        'video/mp4;codecs=h264',
        'video/mp4',
      ];
      
      const supportedType = types.find(type => MediaRecorder.isTypeSupported(type)) || 'video/mp4';
      const extension = supportedType.includes('mp4') ? 'mp4' : 'webm';

      const stream = canvas.captureStream(60);
      const recorder = new MediaRecorder(stream, { mimeType: supportedType });
      
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: supportedType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blob-tracking-${Date.now()}.${extension}`;
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
        numberSize: currentNumSize,
        fontLoaded: currentFontReady
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
      } else {
        visitedRef.current.fill(0);
      }
      const visited = visitedRef.current;

      for (let y = 0; y < smallH; y++) {
        for (let x = 0; x < smallW; x++) {
          const idx = (y * smallW + x) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

          if (brightness > currentThresh && !visited[y * smallW + x]) {
            let sumX = 0, sumY = 0, count = 0;
            const queue = [[x, y]];
            visited[y * smallW + x] = 1;

            while (queue.length > 0) {
              const [cx, cy] = queue.pop()!;
              sumX += cx;
              sumY += cy;
              count++;
              
              const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
              for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < smallW && ny >= 0 && ny < smallH) {
                  const nIdx = (ny * smallW + nx);
                  if (!visited[nIdx]) {
                     const pIdx = nIdx * 4;
                     const nb = (data[pIdx] + data[pIdx + 1] + data[pIdx + 2]) / 3;
                     if (nb > currentThresh) {
                       visited[nIdx] = 1;
                       queue.push([nx, ny]);
                     }
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
        activeBlobs.forEach((blob, i) => {
            if (i === 0) ctx.moveTo(blob.x, blob.y);
            else ctx.lineTo(blob.x, blob.y);
        });
        ctx.lineTo(activeBlobs[0].x, activeBlobs[0].y);
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = 2 * scaleFactor;
        ctx.stroke();
      }

      activeBlobs.forEach(blob => {
        const randW = ((Math.sin(blob.id * 1234.567) + 1) / 2) * 2 - 1;
        const randH = ((Math.sin(blob.id * 8910.111) + 1) / 2) * 2 - 1;

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
                ctx.globalAlpha = 1.0;
                ctx.fill();
            } else if (currentFill === 'difference') {
                ctx.globalAlpha = 1.0;
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
            
            let label = blob.id.toString();
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

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-black text-white p-4 md:p-8">
      <section className="max-w-6xl w-full flex flex-col md:flex-row gap-8">
        
        <article className="flex-grow flex flex-col gap-6 md:w-2/3">
          <div className="flex justify-between items-center p-4 bg-black border border-white">
            <h1 className="text-white tracking-tight font-medium text-xs ring-offset-2">
              Blob Tracking
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
                  {isRecording ? 'Stop' : 'Record'}
                </button>
              )}
              <label className="cursor-pointer bg-black border border-white hover:bg-white transition px-4 py-2 font-medium text-xs hover:text-black tracking-tight">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-2 z-10 text-xs">
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

        <article className="flex flex-col gap-4 md:w-1/3 md:min-w-[320px]">
          <article className="bg-black p-4 border border-white flex items-center justify-between">
             <span className="text-xs text-white font-medium uppercase tracking-tight">Show Labels</span>
             <button 
                onClick={() => setShowNumbers(!showNumbers)}
                className={`w-12 h-6 transition-colors relative border border-white ${showNumbers ? 'bg-white' : 'bg-black'}`}
             >
                <div className={`absolute top-0.5 w-4.5 h-4.5 transition-transform ${showNumbers ? 'left-6.5 bg-black' : 'left-0.5 bg-white'}`} />
             </button>
          </article>

          <article className="bg-black p-4 border border-white flex items-center justify-between">
             <span className="text-xs text-white font-medium uppercase tracking-tight">Connect Lines</span>
             <button 
                onClick={() => setShowLines(!showLines)}
                className={`w-12 h-6 transition-colors relative border border-white ${showLines ? 'bg-white' : 'bg-black'}`}
             >
                <div className={`absolute top-0.5 w-4.5 h-4.5 transition-transform ${showLines ? 'left-6.5 bg-black' : 'left-0.5 bg-white'}`} />
             </button>
          </article>

          <article className="bg-black p-4 border border-white flex items-center justify-between">
             <span className="text-xs text-white font-medium uppercase tracking-tight">Label Type</span>
             <div className="flex border border-white">
               <button 
                onClick={() => setLabelType('id')}
                className={`px-3 py-1 text-xs font-medium uppercase transition-colors ${labelType === 'id' ? 'bg-white text-black' : 'bg-black text-white'}`}
               >
                 ID
               </button>
               <button 
                onClick={() => setLabelType('size')}
                className={`px-3 py-1 text-xs font-medium uppercase transition-colors ${labelType === 'size' ? 'bg-white text-black' : 'bg-black text-white'}`}
               >
                 Size
               </button>
             </div>
          </article>

        <article className="bg-black p-4 border border-white">
             <label className="flex flex-col gap-2">
               <span className="text-xs text-white font-medium uppercase tracking-tight">Label Size: {numberSize}px</span>
              <input 
                  type="range" 
                  min="10" 
                  max="75" 
                  value={numberSize} 
                  onChange={(e) => setNumberSize(Number(e.target.value))}
                  className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                />
            </label>
          </article>

          <article className="bg-black p-4 border border-white">
            <label className="flex flex-col gap-2">
               <span className="text-xs text-white font-medium uppercase tracking-tight">Threshold</span>
              <div className="flex items-center gap-3">
                <span className="text-[0.625rem] w-6 text-neutral-500 uppercase">Low</span>
                <input 
                  type="range" 
                  min="30" 
                  max="250" 
                  value={280 - threshold} 
                  onChange={(e) => setThreshold(280 - Number(e.target.value))}
                  className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer" 
                />
                <span className="text-[0.625rem] w-6 text-neutral-500 uppercase">High</span>
              </div>
            </label>
          </article>

          <article className="bg-black p-4 border border-white">
             <label className="flex flex-col gap-2">
               <span className="text-xs text-white font-medium uppercase tracking-tight">Max Blobs: {maxBlobs}</span>
              <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={maxBlobs} 
                  onChange={(e) => setMaxBlobs(Number(e.target.value))}
                  className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                />
            </label>
          </article>

          <article className="bg-black p-4 border border-white">
             <label className="flex flex-col gap-2">
               <span className="text-xs text-white font-medium uppercase tracking-tight">Blob Size: {blobSize}px</span>
              <input 
                  type="range" 
                  min="10" 
                  max="150" 
                  value={blobSize} 
                  onChange={(e) => setBlobSize(Number(e.target.value))}
                  className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                />
            </label>
          </article>

          <article className="bg-black p-4 border border-white">
             <label className="flex flex-col gap-2">
               <span className="text-xs text-white font-medium uppercase tracking-tight">Blob Size Randomness: {sizeRandomness}%</span>
              <input 
                  type="range" 
                  min="0" 
                  max="300" 
                  value={sizeRandomness} 
                  onChange={(e) => setSizeRandomness(Number(e.target.value))}
                  className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                />
            </label>
          </article>

          <article className="bg-black p-4 border border-white flex flex-col gap-3">
             <span className="text-xs text-white font-medium uppercase tracking-tight">Blob Fill Mode</span>
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
             <label className="flex flex-col gap-2 mt-2">
                <span className="text-[0.625rem] text-white font-medium uppercase tracking-tight">Fill Ratio: {fillRatio}%</span>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={fillRatio} 
                    onChange={(e) => setFillRatio(Number(e.target.value))}
                    className="w-full accent-white h-px bg-white/20 appearance-none cursor-pointer my-2" 
                  />
              </label>
          </article>

          <article className="bg-black p-4 border border-white flex flex-col gap-3">
             <span className="text-xs text-white font-medium uppercase tracking-tight">Color Control</span>
             <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[0.625rem] text-red-500 font-bold w-4">R</span>
                  <input 
                    type="range" min="0" max="255" value={colorRGB.r} 
                    onChange={(e) => setColorRGB(prev => ({ ...prev, r: Number(e.target.value) }))}
                    className="w-full accent-red-500 h-px bg-white/20 appearance-none cursor-pointer" 
                  />
                  <span className="text-[0.625rem] text-neutral-500 w-6 text-right font-mono">{colorRGB.r}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.625rem] text-green-500 font-bold w-4">G</span>
                  <input 
                    type="range" min="0" max="255" value={colorRGB.g} 
                    onChange={(e) => setColorRGB(prev => ({ ...prev, g: Number(e.target.value) }))}
                    className="w-full accent-green-500 h-px bg-white/20 appearance-none cursor-pointer" 
                  />
                  <span className="text-[0.625rem] text-neutral-500 w-6 text-right font-mono">{colorRGB.g}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.625rem] text-blue-500 font-bold w-4">B</span>
                  <input 
                    type="range" min="0" max="255" value={colorRGB.b} 
                    onChange={(e) => setColorRGB(prev => ({ ...prev, b: Number(e.target.value) }))}
                    className="w-full accent-blue-500 h-px bg-white/20 appearance-none cursor-pointer" 
                  />
                  <span className="text-[0.625rem] text-neutral-500 w-6 text-right font-mono">{colorRGB.b}</span>
                </div>
             </div>
          </article>

          <footer className="mt-auto">
            <p className="text-[0.625rem] text-neutral-500 tracking-widest">
              © 2026 @dachanjeong.xyz All rights reserved.
            </p>
          </footer>
        </article>
      </section>
    </main>
  );
}
