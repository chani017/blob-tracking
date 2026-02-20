import { useState, useRef } from "react";

export function useVideoRecording(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleToggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=h264")
        ? "video/mp4;codecs=h264"
        : "video/mp4";

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
        const a = document.createElement("a");
        a.href = url;
        a.download = `blob-tracking-${Date.now()}.mp4`;
        a.click();
        URL.revokeObjectURL(url);
      };

      recorder.start();
      setIsRecording(true);
    }
  };

  return { isRecording, handleToggleRecording };
}
