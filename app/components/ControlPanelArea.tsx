"use client";

import React, { useCallback } from "react";
import { HelpTooltip } from "./ui/HelpTooltip";
import { OptionButton, ToggleButton } from "./ui/Buttons";
import { SectionHeader, SliderControl, ColorSlider } from "./ui/Controls";

type Lang = "en" | "kr";

interface ControlPanelProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  activeTooltip: string | null;
  setActiveTooltip: (id: string | null) => void;

  threshold: number;
  setThreshold: (val: number) => void;
  maxBlobs: number;
  setMaxBlobs: (val: number) => void;
  blobSize: number;
  setBlobSize: (val: number) => void;
  sizeRandomness: number;
  setSizeRandomness: (val: number) => void;
  fillMode: "none" | "solid" | "lighten" | "multiply" | "difference";
  setFillMode: (
    val: "none" | "solid" | "lighten" | "multiply" | "difference",
  ) => void;
  fillRatio: number;
  setFillRatio: (val: number) => void;

  showNumbers: boolean;
  setShowNumbers: React.Dispatch<React.SetStateAction<boolean>>;
  labelType: "id" | "size";
  setLabelType: (val: "id" | "size") => void;
  numberSize: number;
  setNumberSize: (val: number) => void;

  showLines: boolean;
  setShowLines: React.Dispatch<React.SetStateAction<boolean>>;
  lineDashStyle: "solid" | "dashed";
  setLineDashStyle: (val: "solid" | "dashed") => void;
  lineSmoothness: number;
  setLineSmoothness: (val: number) => void;

  colorRGB: { r: number; g: number; b: number };
  setColorRGB: React.Dispatch<
    React.SetStateAction<{ r: number; g: number; b: number }>
  >;
}

export const ControlPanelArea = React.memo(function ControlPanelArea(
  props: ControlPanelProps,
) {
  const commonProps = {
    activeTooltip: props.activeTooltip,
    setActiveTooltip: props.setActiveTooltip,
    lang: props.lang,
  };

  const {
    setThreshold,
    setFillMode,
    setShowNumbers,
    setLabelType,
    setShowLines,
    setLineDashStyle,
    setColorRGB,
  } = props;

  // Stable callbacks to prevent child component re-renders
  const handleThresholdChange = useCallback(
    (val: number) => setThreshold(380 - val),
    [setThreshold],
  );
  const handleThresholdInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setThreshold(380 - +e.target.value),
    [setThreshold],
  );

  const handleFillModeNone = useCallback(
    () => setFillMode("none"),
    [setFillMode],
  );
  const handleFillModeSolid = useCallback(
    () => setFillMode("solid"),
    [setFillMode],
  );
  const handleFillModeLighten = useCallback(
    () => setFillMode("lighten"),
    [setFillMode],
  );
  const handleFillModeDifference = useCallback(
    () => setFillMode("difference"),
    [setFillMode],
  );

  const toggleShowNumbers = useCallback(
    () => setShowNumbers((prev) => !prev),
    [setShowNumbers],
  );
  const handleLabelTypeId = useCallback(
    () => setLabelType("id"),
    [setLabelType],
  );
  const handleLabelTypeSize = useCallback(
    () => setLabelType("size"),
    [setLabelType],
  );

  const toggleShowLines = useCallback(
    () => setShowLines((prev) => !prev),
    [setShowLines],
  );
  const handleLineDashSolid = useCallback(
    () => setLineDashStyle("solid"),
    [setLineDashStyle],
  );
  const handleLineDashDashed = useCallback(
    () => setLineDashStyle("dashed"),
    [setLineDashStyle],
  );

  const handleColorR = useCallback(
    (val: number) => setColorRGB((prev) => ({ ...prev, r: val })),
    [setColorRGB],
  );
  const handleColorG = useCallback(
    (val: number) => setColorRGB((prev) => ({ ...prev, g: val })),
    [setColorRGB],
  );
  const handleColorB = useCallback(
    (val: number) => setColorRGB((prev) => ({ ...prev, b: val })),
    [setColorRGB],
  );

  return (
    <article className="flex flex-col gap-4 md:w-[320px] md:h-full md:overflow-y-auto scrollbar-hide">
      <article className="flex flex-col gap-y-3">
        <SectionHeader
          title="Blobs"
          lang={props.lang}
          setLang={props.setLang}
        />
        <div className="bg-black p-4 border border-system-color flex flex-col gap-y-4">
          <SliderControl
            label="Threshold"
            tooltipId="threshold"
            {...commonProps}
            value={380 - props.threshold}
            min={50}
            max={350}
            onChange={handleThresholdChange}
            customTrack={
              <div className="flex items-center gap-3">
                <span className="text-[0.625rem] w-6 text-neutral-500 uppercase">
                  Low
                </span>
                <input
                  type="range"
                  min="50"
                  max="350"
                  value={380 - props.threshold}
                  onChange={handleThresholdInputChange}
                  className="w-full accent-system-color h-px bg-system-color/20 appearance-none cursor-pointer"
                />
                <span className="text-[0.625rem] w-6 text-neutral-500 uppercase">
                  High
                </span>
              </div>
            }
          />
          <SliderControl
            label="Max Blobs"
            tooltipId="maxBlobs"
            {...commonProps}
            value={props.maxBlobs}
            min={1}
            max={20}
            onChange={props.setMaxBlobs}
            displayValue={props.maxBlobs}
          />
          <SliderControl
            label="Blob Size"
            tooltipId="blobSize"
            {...commonProps}
            value={props.blobSize}
            min={10}
            max={150}
            onChange={props.setBlobSize}
            displayValue={`${props.blobSize}px`}
          />
          <SliderControl
            label="Blob Size Randomness"
            tooltipId="randomness"
            {...commonProps}
            value={props.sizeRandomness}
            min={0}
            max={300}
            onChange={props.setSizeRandomness}
            displayValue={`${props.sizeRandomness}%`}
          />

          <div className="flex items-center gap-1.5 relative">
            <span className="text-xs text-system-color font-medium uppercase tracking-tight">
              Blob Fill Mode
            </span>
            <HelpTooltip id="fillMode" {...commonProps} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <OptionButton
              active={props.fillMode === "none"}
              onClick={handleFillModeNone}
            >
              Empty
            </OptionButton>
            <OptionButton
              active={props.fillMode === "solid"}
              onClick={handleFillModeSolid}
            >
              Solid
            </OptionButton>
            <OptionButton
              active={props.fillMode === "lighten"}
              onClick={handleFillModeLighten}
            >
              Lighten
            </OptionButton>
            <OptionButton
              active={props.fillMode === "difference"}
              onClick={handleFillModeDifference}
            >
              Invert
            </OptionButton>
          </div>

          <SliderControl
            label="Fill Ratio"
            tooltipId="fillRatio"
            {...commonProps}
            value={props.fillRatio}
            min={0}
            max={100}
            onChange={props.setFillRatio}
            displayValue={`${props.fillRatio}%`}
          />
        </div>
      </article>

      <article className="flex flex-col gap-y-3">
        <SectionHeader title="Labels" lang={props.lang} />
        <div className="bg-black p-4 border border-system-color flex flex-col gap-y-4">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-system-color font-medium uppercase tracking-tight">
                Show Labels
              </span>
              <HelpTooltip id="showLabels" {...commonProps} />
            </div>
            <ToggleButton
              active={props.showNumbers}
              onClick={toggleShowNumbers}
            />
          </div>

          <div className="flex items-center justify-between relative mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-system-color font-medium uppercase tracking-tight">
                Label Type
              </span>
              <HelpTooltip id="labelType" {...commonProps} />
            </div>
            <div className="flex border border-system-color">
              <OptionButton
                active={props.labelType === "id"}
                onClick={handleLabelTypeId}
                paddingY="py-1"
              >
                ID
              </OptionButton>
              <OptionButton
                active={props.labelType === "size"}
                onClick={handleLabelTypeSize}
                paddingY="py-1"
              >
                Size
              </OptionButton>
            </div>
          </div>

          <SliderControl
            label="Label Size"
            tooltipId="labelSize"
            {...commonProps}
            value={props.numberSize}
            min={5}
            max={75}
            onChange={props.setNumberSize}
            displayValue={`${props.numberSize}px`}
          />
        </div>
      </article>

      <article className="flex flex-col gap-y-3">
        <SectionHeader title="Lines" lang={props.lang} />
        <div className="bg-black p-4 border border-system-color flex flex-col gap-y-4">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-system-color font-medium uppercase tracking-tight">
                Connect Lines
              </span>
              <HelpTooltip id="connectLines" {...commonProps} />
            </div>
            <ToggleButton active={props.showLines} onClick={toggleShowLines} />
          </div>

          <div className="flex items-center justify-between relative mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-system-color font-medium uppercase tracking-tight">
                Line Pattern
              </span>
              <HelpTooltip id="linePattern" {...commonProps} />
            </div>
            <div className="flex border border-system-color">
              <OptionButton
                active={props.lineDashStyle === "solid"}
                onClick={handleLineDashSolid}
                paddingY="py-1"
              >
                Solid
              </OptionButton>
              <OptionButton
                active={props.lineDashStyle === "dashed"}
                onClick={handleLineDashDashed}
                paddingY="py-1"
              >
                Dashed
              </OptionButton>
            </div>
          </div>

          <SliderControl
            label="Line Smoothness"
            tooltipId="smoothness"
            {...commonProps}
            value={props.lineSmoothness}
            min={0}
            max={100}
            onChange={props.setLineSmoothness}
            displayValue={`${props.lineSmoothness}%`}
          />
        </div>
      </article>

      <article className="flex flex-col gap-y-3">
        <SectionHeader title="Global Styles" lang={props.lang} />
        <div className="bg-black p-4 border border-system-color flex flex-col gap-3">
          <div className="flex items-center gap-1.5 relative">
            <span className="text-xs text-system-color font-medium uppercase tracking-tight">
              Color Control
            </span>
            <HelpTooltip id="colorControl" {...commonProps} />
          </div>
          <div className="flex flex-col gap-3">
            <ColorSlider
              color="r"
              value={props.colorRGB.r}
              onChange={handleColorR}
            />
            <ColorSlider
              color="g"
              value={props.colorRGB.g}
              onChange={handleColorG}
            />
            <ColorSlider
              color="b"
              value={props.colorRGB.b}
              onChange={handleColorB}
            />
          </div>
        </div>
      </article>

      <footer className="mb-16 md:mb-0">
        <p className="text-[0.625rem] text-neutral-500 tracking-widest uppercase">
          © 2026 @dachanjeong.xyz All rights reserved.
        </p>
      </footer>
    </article>
  );
});
