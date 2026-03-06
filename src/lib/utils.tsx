import { getNumberCategoryGradient } from "@/components/CategoryColorCard";
import { Button } from "@/components/ui/button";
import type { category, setSpot } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type downloadFileProps = {
  data: BlobPart;
  fileName: string;
  fileType: string;
};

export function downloadFile({ data, fileName, fileType }: downloadFileProps) {
  const blob = new Blob([data], { type: fileType });
  const a = document.createElement("a");
  a.download = fileName;
  a.href = window.URL.createObjectURL(blob);
  const clickEvt = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  a.dispatchEvent(clickEvt);
  a.remove();
}

export function hexStringToRGB(color: string) {
  return {
    r: parseInt(color.substring(1, 3), 16),
    g: parseInt(color.substring(3, 5), 16),
    b: parseInt(color.substring(5, 7), 16),
  };
}

export function RGBToHexString({ r, g, b }: { r: number; g: number; b: number }) {
  const rHex = `00${Math.round(r).toString(16)}`;
  const gHex = `00${Math.round(g).toString(16)}`;
  const bHex = `00${Math.round(b).toString(16)}`;

  return `#${rHex.substring(rHex.length - 2)}${gHex.substring(gHex.length - 2)}${bHex.substring(
    bHex.length - 2
  )}`;
}

export function RGBToHSL({ r, g, b }: { r: number; g: number; b: number }) {
  (r /= 255), (g /= 255), (b /= 255);
  const vmax = Math.max(r, g, b),
    vmin = Math.min(r, g, b);
  let h = 0,
    s,
    l = (vmax + vmin) / 2;

  if (vmax === vmin) {
    return { h: 0, s: 0, l }; // achromatic
  }

  const d = vmax - vmin;
  s = l > 0.5 ? d / (2 - vmax - vmin) : d / (vmax + vmin);
  if (vmax === r) h = (g - b) / d + (g < b ? 6 : 0);
  if (vmax === g) h = (b - r) / d + 2;
  if (vmax === b) h = (r - g) / d + 4;
  h /= 6;

  return { h, s, l };
}

function hueToRgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function HSLToRGB({ h, s, l }: { h: number; s: number; l: number }) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function getStringCategoryGradient(category: category) {
  let gradient = "conic-gradient(from 0.75turn";

  category.valueRange.forEach((val, index) => {
    const ratio = index / category.valueRange.length;
    const nextRatio = (index + 1) / category.valueRange.length;

    gradient += `, ${category.colors![val.toString()]} ${Math.round(ratio * 100)}%, ${
      category.colors![val.toString()]
    } ${Math.round(nextRatio * 100)}%`;
  });

  return gradient + ")";
}

export function ColorsGradient(category: category) {
  let gradient = "";

  switch (category.type) {
    case "booleanCategory":
      gradient = `linear-gradient(to right, ${category.colors!["true"]} 0%, ${
        category.colors!["true"]
      } 50%, ${category.colors!["false"]} 50%, ${category.colors!["false"]} 100%)`;
      break;
    case "numberCategory":
      gradient = getNumberCategoryGradient(category, undefined, "to right");
      break;
    case "stringCategory":
      gradient = getStringCategoryGradient(category);
      break;
  }

  return <Button className="hover:cursor-default!" style={{ background: gradient }}></Button>;
}

export function getPartitionedSets(setSpots: setSpot[]) {
  let sets = [] as setSpot[][];
  setSpots.forEach((spot) => {
    if (spot.set < 0) {
      return;
    }
    if (!sets[spot.set]) {
      sets[spot.set] = [] as setSpot[];
    }
    sets[spot.set].push(spot);
  });
  for (let i = 0; i < sets.length; i++) {
    if (sets[i] === undefined) sets[i] = [];
  }
  return sets;
}

export function getEncore(setSpots: setSpot[]) {
  let encore = [] as setSpot[];
  setSpots.forEach((spot) => {
    if (spot.set < 0) {
      encore.push(spot);
    }
  });
  return encore;
}
