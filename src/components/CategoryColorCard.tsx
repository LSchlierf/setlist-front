import type { category } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import {
  hexStringToRGB,
  HSLToRGB,
  RGBToHexString,
  RGBToHSL,
} from "@/lib/utils";

export type CategoryColorCardProps = {
  category: category;
  onFinish: (categoryId: string, colors: { [key: string]: string }) => void;
  onClose: () => void;
};

export function getNumberCategoryGradient(
  category: category,
  colors?: { [key: string]: string } | undefined,
  direction: string = "to bottom"
) {
  const min = Math.min(...category.valueRange);
  const max = Math.max(...category.valueRange);
  let gradient = `linear-gradient(${direction}`;

  if (colors === undefined) {
    colors = category.colors!;
  }

  category.valueRange.sort().forEach((v) => {
    const factor = (v - min) / (max - min);

    gradient += `, ${colors[v.toString()]} ${Math.round(factor * 100)}%`;
  });

  return gradient + ")";
}

export default function CategoryColorCard({
  category,
  onFinish,
  onClose,
}: CategoryColorCardProps) {
  const makeColorsObject = () => {
    let obj: { [key: string]: string } = category.colors || {};
    category.valueRange.forEach((v) => {
      if (!obj[v.toString()]) {
        obj[v.toString()] = "#000000";
      }
    });
    return obj;
  };

  const [colors, setColors] = useState<{ [key: string]: string }>(
    makeColorsObject()
  );

  const booleanColorInput = (category: category) => {
    return (
      <>
        <div className="flex flex-row justify-between" key="yes">
          Yes
          <Input
            value={colors["true"] || "#000000"}
            className="w-20"
            type="color"
            onChange={(e) => {
              setColors((colors) => ({ ...colors, ["true"]: e.target.value }));
            }}
          />
        </div>
        <div className="flex flex-row justify-between" key="no">
          No
          <Input
            value={colors["false"] || "#000000"}
            className="w-20"
            type="color"
            onChange={(e) => {
              setColors((colors) => ({ ...colors, ["false"]: e.target.value }));
            }}
          />
        </div>
      </>
    );
  };
  const numberColorInput = (category: category) => {
    const min = Math.min(...category.valueRange);
    const max = Math.max(...category.valueRange);

    const setAllColors = (minHex: string, maxHex: string) => {
      const minRGB = hexStringToRGB(minHex);
      const minHSL = RGBToHSL(minRGB);
      const maxRGB = hexStringToRGB(maxHex);
      const maxHSL = RGBToHSL(maxRGB);

      let newColors: { [key: string]: string } = {};

      category.valueRange.forEach((v) => {
        const factor = (v - min) / (max - min);

        const h = minHSL.h + factor * (maxHSL.h - minHSL.h);
        const s = minHSL.s + factor * (maxHSL.s - minHSL.s);
        const l = minHSL.l + factor * (maxHSL.l - minHSL.l);

        const r = minRGB.r + factor * (maxRGB.r - minRGB.r);
        const g = minRGB.g + factor * (maxRGB.g - minRGB.g);
        const b = minRGB.b + factor * (maxRGB.b - minRGB.b);

        newColors[v.toString()] = RGBToHexString({ r, g, b });
      });

      setColors(newColors);
    };

    return (
      <>
        <div className="flex flex-row justify-between" key="min">
          Min ({min})
          <Input
            value={colors[min.toString()] || "#000000"}
            className="w-20"
            type="color"
            onChange={(e) => {
              setAllColors(e.target.value, colors[max.toString()]);
            }}
          />
        </div>
        <div className="flex flex-row justify-end" key="gradient-container">
          <div
            className="w-20 h-100"
            style={{ background: getNumberCategoryGradient(category, colors) }}
          />
        </div>
        <div className="flex flex-row justify-between" key="max">
          Max ({max})
          <Input
            value={colors[max.toString()] || "#000000"}
            className="w-20"
            type="color"
            onChange={(e) => {
              setAllColors(colors[min.toString()], e.target.value);
            }}
          />
        </div>
      </>
    );
  };
  const stringColorInput = (category: category) => {
    return category.valueRange.map((v) => (
      <div className="flex flex-row justify-between" key={v}>
        {v}
        <Input
          value={colors[v] || "#000000"}
          className="w-20"
          type="color"
          onChange={(e) => {
            setColors((colors) => ({ ...colors, [v]: e.target.value }));
          }}
        />
      </div>
    ));
  };

  const colorInput = (category: category) => {
    switch (category.type) {
      case "booleanCategory":
        return booleanColorInput(category);
      case "numberCategory":
        return numberColorInput(category);
      case "stringCategory":
        return stringColorInput(category);
    }
    return <></>;
  };

  return (
    <Card className="z-10 bg-gray-900 w-sm fixed top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>Associate colors</CardTitle>
        <CardDescription>
          You can set a color for each value of a category to help you visualize
          the songs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full flex flex-col gap-6">{colorInput(category)}</div>
      </CardContent>
      <CardFooter>
        <div className="w-full flex flex-col gap-2">
          <Button
            onClick={() => {
              onFinish(category.id, colors);
              onClose();
            }}
            className="w-full"
          >
            Finish
          </Button>
          <Button onClick={onClose} className="w-full" variant={"secondary"}>
            Cancel
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
