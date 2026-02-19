import { downloadFile } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import type { category } from "@/types";
import { Checkbox } from "./ui/checkbox";
import { useState } from "react";
import { BlobProvider } from "@react-pdf/renderer";
import SetlistSimplePDF from "./SetlistSimplePdf";

export type SetlistExportCardProps = {
  onClose: () => void;
  categories: category[];
};

export default function SetlistExportCard({
  onClose,
  categories,
}: SetlistExportCardProps) {
  const [cats, setCats] = useState<category[]>(categories);

  const downloadLink = (document: React.ReactElement<any>) => (
    <BlobProvider document={document}>
      {({ url, loading, error }) =>
        loading ? (
          <Button disabled className="w-full border" variant={"secondary"}>
            Loading
          </Button>
        ) : (
          <a rel="noopen noreferer" target="_blank" href={url!}>
            <Button
              disabled={!!error}
              className="w-full border"
              variant={"secondary"}
            >
              Download
            </Button>
          </a>
        )
      }
    </BlobProvider>
  );

  return (
    <Card className="z-10 bg-gray-900 w-full max-w-sm fixed top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>Export Setlist</CardTitle>
        <CardDescription>
          Export your setlist to a <code>.json</code> dump, a simple stage{" "}
          <code>.pdf</code>, or a detailed FOH-ready <code>.pdf</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">
            Download <code>.json</code> dump
          </h2>
          <Button className="w-full border" variant={"secondary"}>
            Download
          </Button>
          <h2 className="text-lg font-bold">Export to Simple pdf</h2>
          {downloadLink(<SetlistSimplePDF concert="test" />)}
          <h2 className="text-lg font-bold">Export to Detailed pdf</h2>
          <div className="flex flex-col gap-1">
            Select categories to include:
            {cats.map((c) => (
              <div key={c.id} className="w-full flex flex-row justify-between">
                {c.title}
                <Checkbox
                  checked={c.show}
                  onCheckedChange={(ch) =>
                    setCats((cats) =>
                      cats.map((cat) => {
                        if (cat.id !== c.id) return cat;
                        return { ...cat, show: Boolean(ch) };
                      })
                    )
                  }
                />
              </div>
            ))}
          </div>
          {downloadLink(<SetlistSimplePDF concert="test" />)}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onClose}>
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}
