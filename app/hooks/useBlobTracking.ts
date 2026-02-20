import { useEffect, useRef } from "react";

export interface BlobPoint {
  x: number;
  y: number;
  id: number;
  size: number;
}

export interface BlobTrackingState {
  maxBlobs: number;
  showNumbers: boolean;
  showLines: boolean;
  threshold: number;
  blobSize: number;
  sizeRandomness: number;
  numberSize: number;
  labelType: "size" | "id";
  fillMode: "none" | "solid" | "lighten" | "multiply" | "difference";
  fillRatio: number;
  colorRGB: { r: number; g: number; b: number };
  lineSmoothness: number;
  lineDashStyle: "solid" | "dashed";
}

export function useBlobTracking(
  videoSrc: string | null,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  stateRef: React.MutableRefObject<BlobTrackingState>,
) {
  const animationRef = useRef<number>(0);
  const offCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const visitedRef = useRef<Uint8Array | null>(null);
  const queueBufferRef = useRef<Int32Array | null>(null);

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
      } = stateRef.current;

      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const scale = 0.1;
      const smallW = Math.floor(canvas.width * scale);
      const smallH = Math.floor(canvas.height * scale);

      if (!offCanvasRef.current) {
        offCanvasRef.current = document.createElement("canvas");
      }
      const offCanvas = offCanvasRef.current;
      if (offCanvas.width !== smallW || offCanvas.height !== smallH) {
        offCanvas.width = smallW;
        offCanvas.height = smallH;
      }

      const offCtx = offCanvas.getContext("2d", { alpha: false });
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
            let sumX = 0,
              sumY = 0,
              count = 0;
            let head = 0,
              tail = 0;

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
              let nx = cx + 1,
                ny = cy;
              if (nx < smallW) {
                const nIdx = ny * smallW + nx;
                if (!visited[nIdx]) {
                  const pIdx = nIdx * 4;
                  if (
                    (data[pIdx] + data[pIdx + 1] + data[pIdx + 2]) / 3 >
                    currentThresh
                  ) {
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
                  if (
                    (data[pIdx] + data[pIdx + 1] + data[pIdx + 2]) / 3 >
                    currentThresh
                  ) {
                    visited[nIdx] = 1;
                    queue[tail++] = nx;
                    queue[tail++] = ny;
                  }
                }
              }
              // Down
              nx = cx;
              ny = cy + 1;
              if (ny < smallH) {
                const nIdx = ny * smallW + nx;
                if (!visited[nIdx]) {
                  const pIdx = nIdx * 4;
                  if (
                    (data[pIdx] + data[pIdx + 1] + data[pIdx + 2]) / 3 >
                    currentThresh
                  ) {
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
                  if (
                    (data[pIdx] + data[pIdx + 1] + data[pIdx + 2]) / 3 >
                    currentThresh
                  ) {
                    visited[nIdx] = 1;
                    queue[tail++] = nx;
                    queue[tail++] = ny;
                  }
                }
              }
            }

            if (count > 2) {
              blobs.push({
                x: sumX / count / scale,
                y: sumY / count / scale,
                id: 0,
                size: count,
              });
            }
          }
        }
      }

      blobs.sort((a, b) => b.size - a.size);
      const activeBlobs = blobs.slice(0, currentMax);
      activeBlobs.forEach((b, i) => (b.id = i));

      const scaleFactor = Math.max(0.4, canvas.width / 1280);
      const colorStr = `rgb(${stateRef.current.colorRGB.r}, ${stateRef.current.colorRGB.g}, ${stateRef.current.colorRGB.b})`;

      if (currentShowLines && activeBlobs.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = 2 * scaleFactor;
        ctx.lineJoin = "round";
        ctx.lineCap = "butt";

        if (stateRef.current.lineDashStyle === "dashed") {
          ctx.setLineDash([5 * scaleFactor, 10 * scaleFactor]);
        } else {
          ctx.setLineDash([]);
        }

        if (stateRef.current.lineSmoothness > 0) {
          const smoothness = stateRef.current.lineSmoothness / 100;
          ctx.moveTo(activeBlobs[0].x, activeBlobs[0].y);

          for (let i = 0; i < activeBlobs.length; i++) {
            const p0 =
              activeBlobs[(i - 1 + activeBlobs.length) % activeBlobs.length];
            const p1 = activeBlobs[i];
            const p2 = activeBlobs[(i + 1) % activeBlobs.length];
            const p3 = activeBlobs[(i + 2) % activeBlobs.length];

            const cp1x = p1.x + ((p2.x - p0.x) / 6) * smoothness;
            const cp1y = p1.y + ((p2.y - p0.y) / 6) * smoothness;
            const cp2x = p2.x - ((p3.x - p1.x) / 6) * smoothness;
            const cp2y = p2.y - ((p3.y - p1.y) / 6) * smoothness;

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

      activeBlobs.forEach((blob) => {
        const randW = Math.sin(blob.id * 1234.567);
        const randH = Math.sin(blob.id * 8910.111);

        const width = currentSize * (1 + randW * (currentRandom / 100));
        const height = currentSize * (1 + randH * (currentRandom / 100));

        ctx.beginPath();
        ctx.rect(blob.x - width / 2, blob.y - height / 2, width, height);
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = 3 * scaleFactor;
        ctx.stroke();

        const currentFill = stateRef.current.fillMode;
        const currentFillRatio = stateRef.current.fillRatio;
        const fillScore = (blob.id * 137.5) % 100;
        const shouldFill = fillScore < currentFillRatio;

        if (currentFill !== "none" && shouldFill) {
          ctx.save();
          ctx.fillStyle = colorStr;
          if (currentFill === "solid") {
            ctx.fill();
          } else if (currentFill === "difference") {
            ctx.globalCompositeOperation = "difference";
            ctx.fill();
          } else if (currentFill === "lighten") {
            ctx.globalAlpha = 0.5;
            ctx.globalCompositeOperation = "lighten";
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
          if (stateRef.current.labelType === "size") {
            const relW = width / canvas.width;
            const relH = height / canvas.height;
            label = `x=${relW.toFixed(3)}, y=${relH.toFixed(3)}`;
          }

          ctx.fillText(
            label,
            blob.x - width / 2,
            blob.y + height / 2 + padding,
          );
        }
      });

      animationRef.current = requestAnimationFrame(processFrame);
    };

    animationRef.current = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [videoSrc, videoRef, canvasRef, stateRef]);
}
