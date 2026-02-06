import type { song } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useState } from "react";
import { Button } from "./ui/button";
import { v4 as uuid } from "uuid";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import DurationInput from "./DurationInput";
import { Newspaper } from "lucide-react";

export type NewSongCardProps = {
  onFinish: (newSong: song) => void;
  onClose: () => void;
};

export default function NewSongCard({ onFinish, onClose }: NewSongCardProps) {
  const [newSong, setNewSong] = useState<song>({
    id: uuid(),
    artist: "",
    title: "",
    length: 0,
    notes: "",
    properties: {},
  });

  return (
    <Card className="w-full w-fit fixed top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>New Song</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 w-">
          <div className="flex flex-col gap-2 min-w-40">
            <Label htmlFor="newSongTitle">Title</Label>
            <Input
              id="newSongTitle"
              value={newSong.title}
              onChange={(e) =>
                setNewSong((newSong) => ({ ...newSong, title: e.target.value }))
              }
              placeholder="My favourite song"
            />
          </div>
          <div className="flex flex-col gap-2 min-w-40">
            <Label htmlFor="newSongArtist">Artist</Label>
            <Input
              id="newSongArtist"
              value={newSong.artist}
              onChange={(e) =>
                setNewSong((newSong) => ({
                  ...newSong,
                  artist: e.target.value,
                }))
              }
              placeholder="My favourite band"
            />
          </div>
          <div className="flex flex-col gap-2 min-w-40">
            <Label htmlFor="newSongDuration">Length</Label>
            <div>
              <DurationInput
                editing
                value={newSong.length}
                onChange={(v) =>
                  setNewSong((newSong) => ({
                    ...newSong,
                    length: v,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-40">
            <Label htmlFor="newSongNotes">Notes</Label>
            <Input
              id="newSongNotes"
              value={newSong.notes}
              onChange={(e) =>
                setNewSong((newSong) => ({ ...newSong, notes: e.target.value }))
              }
              placeholder="sick guitar solo"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          onClick={() => {
            onFinish(newSong);
            onClose();
          }}
          className="w-full"
        >
          Finish
        </Button>
        <Button onClick={onClose} className="w-full" variant={"secondary"}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
