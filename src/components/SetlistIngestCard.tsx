import { useState, type InputEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import storage from "@/lib/storage";

export type SetlistIngestCardProps = {
  onSetlistsUpdate: () => void;
  onClose: () => void;
};

export default function SetlistIngestCard({
  onClose,
  onSetlistsUpdate,
}: SetlistIngestCardProps) {
  const [error, setError] = useState<string | undefined>(undefined);

  const ingestJson = (e: InputEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let reader = new FileReader();

    reader.onload = async (e) => {
      let newSetlist;
      try {
        newSetlist = JSON.parse(e.target?.result as string);
      } catch {
        setError("File isn't json");
        return;
      }
      if (
        !newSetlist ||
        ((!newSetlist.concert ||
          !newSetlist.sets ||
          !newSetlist.encore ||
          !newSetlist.breaks) &&
          (!newSetlist.name ||
            !newSetlist.id ||
            !newSetlist.breakLen ||
            !newSetlist.breakBuffer ||
            !newSetlist.time ||
            !newSetlist.fixedTime ||
            !newSetlist.setSpots))
      ) {
        setError("Wrong file format for setlist");
        return;
      }
      await storage.ingestSetlist(JSON.stringify(newSetlist));
      onSetlistsUpdate();
      onClose();
    };

    if (input.files && input.files.length > 0) {
      reader.readAsText(input.files[0]);
    }
  };

  return (
    <Card className="z-10 bg-gray-900 w-full max-w-sm fixed top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>
          Import Setlist from <code>.json</code>
        </CardTitle>
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="setlistImport">Import setlist</Label>
            <Input onInput={ingestJson} id="repertoireImport" type="file" />
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
