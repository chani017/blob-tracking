import React from "react";

export const help = {
  threshold: {
    en: "Adjusts detection sensitivity. Higher values detect darker areas, lower values detect only the brightest.",
    kr: "객체 감지 민감도를 조절합니다. 값이 높아질수록 어두운 영역까지 더 많이 감지하고, 값이 낮아질수록 가장 밝은 영역만 감지합니다.",
  },
  maxBlobs: {
    en: "Sets the maximum number of blobs to display on screen.",
    kr: "화면에 표시할 최대 객체 수를 설정합니다.",
  },
  blobSize: {
    en: "Adjusts the base size of the rectangles representing detected blobs.",
    kr: "감지된 객체의 크기를 조절합니다.",
  },
  randomness: {
    en: "Adds randomness to sizes. Higher values increase size variation between blobs.",
    kr: "각 객체의 크기에 무작위성을 부여합니다. 값이 높을수록 객체들 간의 크기 차이가 커집니다.",
  },
  fillMode: {
    en: "Selects fill mode: Empty, Solid, Lighten, or Invert (Difference).",
    kr: "객체 내부를 채우는 방식을 선택합니다. (Empty: 비어있음, Solid: 채우기, Light: 밝게, Invert: 반전)",
  },
  fillRatio: {
    en: "Determines the percentage of objects to apply the fill effect to.",
    kr: "전체 객체 중 채우기 효과를 적용할 객체의 비율을 설정합니다.",
  },
  showLabels: {
    en: "Toggles the display of labels on each blob.",
    kr: "각 객체에 라벨을 표시할지 여부를 설정합니다.",
  },
  labelType: {
    en: "Display detection order (ID) or relative size on labels.",
    kr: "라벨에 감지된 순서(ID)를 표시할지, 객체의 상대적 크기를 표시할지 선택합니다.",
  },
  labelSize: {
    en: "Adjusts the size of the label text.",
    kr: "라벨 텍스트의 크기를 조절합니다.",
  },
  connectLines: {
    en: "Connects detected blobs with lines to show paths or relationships.",
    kr: "감지된 객체들을 선으로 연결합니다.",
  },
  linePattern: {
    en: "Sets the line pattern to solid or dashed.",
    kr: "연결선의 형태를 실선 또는 점선으로 설정합니다.",
  },
  smoothness: {
    en: "Adjusts the curvature (smoothness) of the connection lines.",
    kr: "연결선의 곡률 정도를 조절합니다.",
  },
  colorControl: {
    en: "Changes colors of blobs and lines by adjusting R, G, B values.",
    kr: "객체와 연결선의 색상을 R(빨강), G(초록), B(파랑) 값을 조절하여 변경합니다.",
  },
};

interface HelpButtonProps {
  id: keyof typeof help;
  activeTooltip: string | null;
  setActiveTooltip: (id: string | null) => void;
  lang: "en" | "kr";
}

export const HelpTooltip = React.memo(function HelpTooltip({
  id,
  activeTooltip,
  setActiveTooltip,
  lang,
}: HelpButtonProps) {
  return (
    <>
      <button
        onMouseEnter={() => setActiveTooltip(id)}
        onMouseLeave={() => setActiveTooltip(null)}
        onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
        className="w-3 h-3 rounded-full border border-neutral-600 flex items-center justify-center text-[0.425rem] text-neutral-400 cursor-help"
      >
        i
      </button>
      {activeTooltip === id && (
        <div className="absolute top-6 left-0 z-10 w-full bg-white text-black p-2 text-[0.625rem] leading-normal font-medium uppercase tracking-tight">
          {help[id][lang]}
        </div>
      )}
    </>
  );
});
