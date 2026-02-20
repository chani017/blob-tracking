import React from "react";

interface OptionButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  paddingY?: string;
}

export const OptionButton = React.memo(function OptionButton({
  active,
  onClick,
  children,
  paddingY = "py-1.5",
}: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 ${paddingY} text-[0.625rem] font-medium uppercase transition-colors border border-system-color 
        ${active ? "bg-system-color text-black" : "bg-black text-system-color hover:bg-system-color/10 cursor-pointer"}`}
    >
      {children}
    </button>
  );
});

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
}

export const ToggleButton = React.memo(function ToggleButton({
  active,
  onClick,
}: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-6 transition-colors relative border border-system-color cursor-pointer 
        ${active ? "bg-system-color" : "bg-black"}`}
    >
      <div
        className={`absolute top-0.5 w-4.5 h-4.5 transition-transform  
          ${active ? "left-6.5 bg-black" : "left-0.5 bg-system-color"}`}
      />
    </button>
  );
});
