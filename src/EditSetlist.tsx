import { Link, useNavigate, useParams } from "react-router";
import Header from "./components/Header";
import { ArrowLeft, Check, Pen, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import storage from "./lib/storage";
import { type category, type setlist, type setSpot, type song } from "./types";
import RepertoireTable from "./components/RepertoireTable";
import { Input } from "./components/ui/input";
import { ButtonGroup } from "./components/ui/button-group";
import { Button } from "./components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import DurationInput from "./components/DurationInput";
import { Checkbox } from "./components/ui/checkbox";

export default function EditSetlist() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [setlist, setSetlist] = useState<setlist | undefined>();
  const [categories, setCategories] = useState<category[] | undefined>(
    undefined
  );
  const [songs, setSongs] = useState<Map<string, song> | undefined>(undefined);
  const [filter, setFilter] = useState<string>("");
  const [editingName, setEditingName] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [endTime, setEndTime] = useState("");

  const backToMainPage = () => {
    navigate("/");
  };

  const handleNameUpdate = (setlistId: string, newName: string) => {
    if (setlist === undefined || setlistId !== setlist.id) return;
    setSetlist((setlist) => ({
      ...setlist!,
      name: newName,
    }));
  };

  useEffect(() => {
    if (id === undefined) {
      backToMainPage();
      return;
    }
    storage.init().then((v) => {
      if (!v) {
        backToMainPage();
        return;
      }
      storage.getSetlist(id).then((s) => {
        setSetlist(s);
        setEndTime(calculateEndTime(s));
      });
      storage.getCategories().then(setCategories);
      storage.getSongs().then((songs: song[]) => {
        setSongs(new Map(songs.map((song) => [song.id, song])));
      });

      storage.socket?.on("setlist:updateName", handleNameUpdate);
    });

    return () => {
      storage.socket?.off("setlist:updateName", handleNameUpdate);
    };
  }, []);

  useEffect(() => {
    if (setlist) {
      document.title = setlist.name + " - SongRack";
    }
  }, [setlist]);

  const finishEditingName = () => {
    storage.socket?.emit("setlist:updateName", setlist!.id, name);
    handleNameUpdate(setlist!.id, name);
    setName("");
    setEditingName(false);
  };

  const concertDurationMinutes = (setlist: setlist) => {
    const sets = getPartitionedSets(setlist);
    const breaks =
      sets.length * setlist.breakBuffer + (sets.length - 1) * setlist.breakLen;
    const setLengths = [...sets, getEncore(setlist)].map(
      (set) =>
        Math.ceil(
          set.reduce((a, s) => a + (songs?.get(s.songId)?.length || 0), 0) /
            60 /
            5
        ) * 5
    );
    const sum = (setLengths.reduce((a, s) => a + s, 0) + breaks) * 60;
    return Math.ceil(sum / 60);
  };

  const calculateEndTime = (setlist: setlist) => {
    const startH = Number(setlist.startTime.split(":")[0]);
    const startM = Number(setlist.startTime.split(":")[1]);
    const minutes = concertDurationMinutes(setlist);
    const endMinutes = (startH * 60 + startM + minutes) % 1440;
    return (
      ("0" + Math.floor(endMinutes / 60)).slice(-2) +
      ":" +
      ("0" + (endMinutes % 60)).slice(-2)
    );
  };

  const getPartitionedSets = (setlist: setlist) => {
    let sets = [] as setSpot[][];
    setlist.setSpots.forEach((spot) => {
      if (spot.set < 0) {
        return;
      }
      if (!sets[spot.set]) {
        sets[spot.set] = [] as setSpot[];
      }
      sets[spot.set].push(spot);
    });
    return sets;
  };

  const getEncore = (setlist: setlist) => {
    let encore = [] as setSpot[];
    setlist.setSpots.forEach((spot) => {
      if (spot.set < 0) {
        encore.push(spot);
      }
    });
    return encore;
  };

  const categoryCard = (category: category) => {
    const { id, title, show } = category;
    return (
      <Card key={id}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-between gap-2">
            <div className="font-bold">Show:</div>
            <Checkbox
              checked={show}
              onCheckedChange={(checked) =>
                setCategories((categories) =>
                  categories?.map((c) => {
                    if (c.id !== id) return c;
                    return {
                      ...c,
                      show: !!checked,
                    };
                  })
                )
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const propertyDisplay = (song: song, category: category) => {
    let color = category.colors?.[song.properties[category.id]];

    switch (category.type) {
      case "booleanCategory":
        if (!song.properties[category.id]) {
          color = category.colors?.["false"];
        }
        return (
          <TableCell key={category.id} style={{ backgroundColor: color }}>
            {song.properties[category.id] ? <Check /> : <X />}
          </TableCell>
        );
      case "numberCategory":
      case "stringCategory":
        return (
          <TableCell key={category.id} style={{ backgroundColor: color }}>
            {song.properties[category.id]}
          </TableCell>
        );
      case "multipleStringCategory":
        return (
          <TableCell key={category.id} style={{ backgroundColor: color }}>
            {song.properties[category.id]?.join(", ")}
          </TableCell>
        );
    }

    return <TableCell>Unknown category type: {category.type}</TableCell>;
  };

  const setTable = (spots: setSpot[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Song Title</TableHead>
          <TableHead>Artist</TableHead>
          <TableHead>Length</TableHead>
          {categories
            ?.filter((c) => c.show)
            .map((c) => (
              <TableHead key={c.id}>{c.title}</TableHead>
            ))}
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {spots.map((spot) => {
          const song = songs?.get(spot.songId);
          if (!song) return;
          return (
            <TableRow key={song?.id}>
              <TableCell>{song?.title}</TableCell>
              <TableCell>{song?.artist}</TableCell>
              <TableCell>
                {
                  <DurationInput
                    editing={false}
                    value={song.length}
                    onChange={() => {}}
                  />
                }
              </TableCell>
              {categories
                ?.filter((c) => c.show)
                .map((c) => propertyDisplay(song, c))}
              <TableCell>{song?.notes}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  function setLength(set: setSpot[]) {
    const sum = set.reduce(
      (a: number, s) => a + (songs?.get(s?.songId)?.length || 0),
      0
    );
    return `${Math.floor(sum / 3600)}h ${Math.floor(sum / 60) % 60}m ${
      sum % 60
    }s`;
  }

  function setLengthApprox(set: setSpot[]) {
    const sum = set.reduce(
      (a: number, s) => a + (songs?.get(s?.songId)?.length || 0),
      0
    );
    return Math.ceil(sum / 60 / 5) * 5;
  }

  const setDisplay = (setSpots: setSpot[], index: number | string) => (
    <Card key={`set-${index}`} className="w-full">
      <CardHeader>
        <CardTitle className="font-bold text-2xl">
          {typeof index === "string" ? index : `Set ${index + 1}`}
        </CardTitle>
        {typeof index === "number" && (
          <CardAction>
            <Button className="hover:bg-red-600/80" variant={"secondary"}>
              <Trash2 />
              Delete Set
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>{setTable(setSpots.sort())}</CardContent>
      <CardFooter>
        {setSpots.length} Songs, ~{setLengthApprox(setSpots)} min (
        {setLength(setSpots)})
      </CardFooter>
    </Card>
  );

  const setlistBank = () => (
    <ResizablePanel defaultSize={"70%"}>
      <div className="p-4 px-30 h-full w-screen overflow-scroll">
        <div className="w-fit flex flex-col gap-6">
          <h1 className="text-2xl font-bold flex flex-row gap-2 items-center">
            {editingName ? (
              <ButtonGroup>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
                <Button
                  className="border"
                  variant={"secondary"}
                  onClick={() => setEditingName(false)}
                >
                  <X />
                </Button>
                <Button
                  className="border"
                  disabled={name.length < 1}
                  onClick={finishEditingName}
                >
                  <Check />
                </Button>
              </ButtonGroup>
            ) : (
              <>
                {setlist?.name}
                <Button
                  disabled={setlist === undefined}
                  onClick={() => {
                    setName(setlist!.name);
                    setEditingName(true);
                  }}
                  variant={"secondary"}
                >
                  <Pen />
                </Button>
              </>
            )}
          </h1>
          {setlist && getPartitionedSets(setlist).map(setDisplay)}
          {setlist && setDisplay(getEncore(setlist), "Encore")}
          {setlist?.setSpots.length || 0} Songs total
          <h1 className="font-bold text-2xl">Times:</h1>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 w-fit gap-2">
              <span className="w-fit flex flex-row items-center">Start:</span>
              <Input
                className="w-50 col-span-3"
                type="time"
                value={setlist?.startTime || "19:00"}
              />
              <span className="w-fit flex flex-row items-center">End:</span>
              <Input className="w-50 col-span-3" type="time" value={endTime} />
              <span className="w-fit flex flex-row items-center">
                Break length:
              </span>
              <Input
                className="w-50 col-span-3"
                type="number"
                value={setlist?.breakLen || 0}
              />
              <span className="w-fit flex flex-row items-center">
                Break buffer:
              </span>
              <Input
                className="w-50 col-span-3"
                type="number"
                value={setlist?.breakBuffer || 0}
              />
            </div>
            <span>
              Breaks after each set (except last), with a buffer for each set
            </span>
          </div>
          <h1 className="font-bold text-2xl">Your Custom Categories:</h1>
          <div className="grid grid-cols-6 gap-4">
            {categories?.map(categoryCard)}
          </div>
        </div>
      </div>
    </ResizablePanel>
  );

  const repertoireBank = () => (
    <ResizablePanel>
      <div className="bg-gray-900 h-full p-4 overflow-scroll">
        <div className="flex flex-col gap-6">
          <div className="flex flex-row gap-3 items-center">
            Filter songs:
            <ButtonGroup>
              <Input
                className="w-60"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <Button
                className="border"
                onClick={() => setFilter("")}
                variant={"secondary"}
              >
                <X />
              </Button>
            </ButtonGroup>
          </div>
          <RepertoireTable
            categories={categories || []}
            filterTerm={filter}
            usedSongs={new Set(setlist?.setSpots.map((v) => v.songId))}
            readonly
          />
        </div>
      </div>
    </ResizablePanel>
  );

  return (
    <div className="h-screen flex flex-col w-screen bg-gray-950">
      <Header
        backButton={
          <Link to="/" className="pr-4">
            <ArrowLeft size={30} />
          </Link>
        }
        onLogin={(loggedIn) => !loggedIn && backToMainPage()}
      />
      <div className="flex-1 overflow-auto">
        <ResizablePanelGroup>
          {setlistBank()}
          <ResizableHandle withHandle />
          {repertoireBank()}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
