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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import storage from "@/lib/storage";
import { useState, type InputEvent } from "react";

export type RepertoireImportExportCardProps = {
  onClose: () => void;
  onRepertoireChange: () => void;
};

export default function RepertoireImportExportCard({
  onClose,
  onRepertoireChange,
}: RepertoireImportExportCardProps) {
  const [error, setError] = useState<string | undefined>(undefined);

  const downloadJson = async () => {
    downloadFile({
      data: JSON.stringify(await storage.getFullRepertoire()),
      fileName: "repertoire.json",
      fileType: "text/json",
    });
  };

  const downloadTXT = async () => {
    const songs = await storage.getSongs();
    downloadFile({
      data: songs
        .map(
          (s: { title: string; artist: string }) =>
            s.title + " - " + s.artist + "\n"
        )
        .sort()
        .join(""),
      fileName: "repertoire.txt",
      fileType: "text/txt",
    });
  };

  const ingestJson = (e: InputEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let reader = new FileReader();

    reader.onload = async (e) => {
      let newRepertoire;
      try {
        newRepertoire = JSON.parse(e.target?.result as string);
      } catch {
        setError("File isn't json");
        return;
      }
      if (!newRepertoire || !newRepertoire.categories || !newRepertoire.songs) {
        setError("Wrong file format for repertoire");
        return;
      }
      await storage.ingestRepertoire(JSON.stringify(newRepertoire));
      onClose();
      onRepertoireChange();
    };

    if (input.files && input.files.length > 0) {
      reader.readAsText(input.files[0]);
    }
  };

  return (
    <Card className="z-10 bg-gray-900 w-full max-w-sm fixed top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>Import / Export Repertoire</CardTitle>
      </CardHeader>
      {!!error ? (
        <CardContent>
          <CardDescription className="flex flex-col gap-6">
            That didnt work: {error}
            <Button
              className="w-full"
              onClick={() => setError(undefined)}
              variant={"secondary"}
            >
              Retry
            </Button>
          </CardDescription>
        </CardContent>
      ) : (
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="repertoireImport">
                Import from <code>.json</code>
              </Label>
              <Input onInput={ingestJson} id="repertoireImport" type="file" />
            </div>
            <Button onClick={downloadJson} variant={"secondary"}>
              Export to <code>.json</code>
            </Button>
            <Button onClick={downloadTXT} variant={"secondary"}>
              Export Title/Artist to <code>.txt</code>
            </Button>
          </div>
        </CardContent>
      )}
      <CardFooter>
        <Button className="w-full" onClick={onClose}>
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}
