import { downloadFile, getEncore, getPartitionedSets } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import type { category, setlist, setSpot, song } from "@/types";
import { Checkbox } from "./ui/checkbox";
import { useState } from "react";
import { BlobProvider } from "@react-pdf/renderer";
import SetlistSimplePDF from "./SetlistSimplePdf";
import SetlistDetailedPDF from "./SetlistDetailedPdf";
import storage from "@/lib/storage";

export type SetlistExportCardProps = {
  onClose: () => void;
  setlist: setlist;
  categories: category[];
  songs: Map<string, song>;
  startTime: string;
};

export default function SetlistExportCard({
  onClose,
  setlist,
  categories,
  songs,
  startTime,
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

  const lookupSet = (set: setSpot[]) =>
    set
      .sort((a, b) => a.spotPrio - b.spotPrio)
      .map((spot) => songs.get(spot.songId)!);

  return (
    <Card className="z-10 bg-gray-900 w-full max-w-sm fixed top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>Export Setlist</CardTitle>
        <CardDescription>
          Export your setlist to a a simple stage <code>.pdf</code>, a detailed
          FOH-ready <code>.pdf</code>, or download the <code>.json</code> dump.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">
            Export to Simple <code>PDF</code>
          </h2>
          {downloadLink(
            <SetlistSimplePDF
              concert={setlist.name}
              sets={getPartitionedSets(setlist.setSpots).map(lookupSet)}
              encore={lookupSet(getEncore(setlist.setSpots))}
            />
          )}
          <h2 className="text-lg font-bold">
            Export to Detailed <code>PDF</code>
          </h2>
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
          {downloadLink(
            <SetlistDetailedPDF
              concert={setlist.name}
              breakLength={setlist.breakLen}
              bufferLength={setlist.breakBuffer}
              categories={cats.filter((c) => c.show)}
              startTime={startTime}
              sets={getPartitionedSets(setlist.setSpots).map(lookupSet)}
              encore={lookupSet(getEncore(setlist.setSpots))}
            />
          )}
          <h2 className="text-lg font-bold">
            Download <code>.json</code> dump
          </h2>
          <Button
            onClick={async () => {
              downloadFile({
                data: JSON.stringify(
                  await storage.getSetlist(setlist.id),
                  undefined,
                  2
                ),
                fileName: `Setlist ${setlist.name}.json`,
                fileType: "text/json",
              });
            }}
            className="w-full border"
            variant={"secondary"}
          >
            Download
          </Button>
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
