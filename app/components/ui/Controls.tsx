import { help } from "./HelpTooltip";
import React from "react";
import { HelpTooltip } from "./HelpTooltip";

type Lang = "en" | "kr";

interface SectionHeaderProps {
  title: string;
  lang: Lang;
  setLang?: (lang: Lang) => void;
}

export const SectionHeader = React.memo(function SectionHeader({
  title,
  lang,
  setLang,
}: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-xs text-system-color font-medium uppercase tracking-tight">
        {title}
      </p>
      {setLang && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLang("kr")}
            className={`text-xs font-medium transition-colors cursor-pointer ${lang === "kr" ? "text-system-color" : "text-neutral-500"}`}
          >
            KR
          </button>
          <span className="text-[10px] text-neutral-800">/</span>
          <button
            onClick={() => setLang("en")}
            className={`text-xs font-medium transition-colors cursor-pointer ${lang === "en" ? "text-system-color" : "text-neutral-500"}`}
          >
            EN
          </button>
        </div>
      )}
    </div>
  );
});

interface SliderControlProps {
  label: string;
  tooltipId: keyof typeof help;
  activeTooltip: string | null;
  setActiveTooltip: (id: string | null) => void;
  lang: Lang;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  displayValue?: React.ReactNode;
  customTrack?: React.ReactNode;
}

export const SliderControl = React.memo(function SliderControl({
  label,
  tooltipId,
  activeTooltip,
  setActiveTooltip,
  lang,
  value,
  min,
  max,
  onChange,
  displayValue,
  customTrack,
}: SliderControlProps) {
  return (
    <label className="flex flex-col gap-2 relative">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-system-color font-medium uppercase tracking-tight">
            {label}
          </span>
          <HelpTooltip
            id={tooltipId}
            activeTooltip={activeTooltip}
            setActiveTooltip={setActiveTooltip}
            lang={lang}
          />
        </div>
        {displayValue && (
          <span className="text-xs text-neutral-500 font-light uppercase tracking-tight">
            {displayValue}
          </span>
        )}
      </div>
      {customTrack ? (
        customTrack
      ) : (
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="w-full accent-system-color h-px bg-system-color/20 appearance-none cursor-pointer my-2"
        />
      )}
    </label>
  );
});

interface ColorSliderProps {
  color: "r" | "g" | "b";
  value: number;
  onChange: (val: number) => void;
}

export const ColorSlider = React.memo(function ColorSlider({
  color,
  value,
  onChange,
}: ColorSliderProps) {
  const colorMap = {
    r: { bg: "accent-red-500", text: "text-red-500", label: "R" },
    g: { bg: "accent-green-500", text: "text-green-500", label: "G" },
    b: { bg: "accent-blue-500", text: "text-blue-500", label: "B" },
  };
  const config = colorMap[color];

  return (
    <div className="flex items-center gap-3">
      <span className={`text-[0.625rem] ${config.text} font-bold w-4`}>
        {config.label}
      </span>
      <input
        type="range"
        min="0"
        max="255"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className={`w-full ${config.bg} h-px bg-system-color/20 appearance-none cursor-pointer`}
      />
      <span className="text-[0.625rem] text-neutral-500 w-6 text-right font-mono">
        {value}
      </span>
    </div>
  );
});
