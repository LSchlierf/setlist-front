import { Link, useNavigate, useParams } from "react-router";
import Header from "./components/Header";
import {
  ArrowLeft,
  Check,
  FileDown,
  Import,
  Pen,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import storage from "./lib/storage";
import {
  type category,
  type setlist,
  type setlistTimeDTO,
  type setSpot,
  type song,
} from "./types";
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
import SetlistExportCard from "./components/SetlistExportCard";
import { getEncore, getPartitionedSets } from "./lib/utils";

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
  const [editingTimes, setEditingTimes] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("19:00");
  const [endTime, setEndTime] = useState<string>("19:00");
  const [fixedTime, setFixedTime] = useState<"START" | "END" | undefined>(
    undefined
  );
  const [breakLen, setBreakLen] = useState<number>(20);
  const [breakBuf, setBreakBuf] = useState<number>(5);
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [draggingId, setDraggingId] = useState<string | undefined>(undefined);
  const [draggingFrom, setDraggingFrom] = useState<string | undefined>(
    undefined
  );
  const [newSetSongId, setNewSetSongId] = useState<string | undefined>(
    undefined
  );

  const backToMainPage = () => {
    navigate("/");
  };

  const handleNameUpdate = (newName: string) => {
    // if (setlist === undefined || setlistId !== setlist.id) return;
    setSetlist((setlist) => ({
      ...setlist!,
      name: newName,
    }));
  };

  const handleSpotCreate = (newSpot: setSpot) => {
    setSetlist((setlist) => ({
      ...setlist!,
      setSpots: [
        ...setlist!.setSpots.filter((s) => s.songId !== newSpot.songId),
        newSpot,
      ],
    }));
  };

  const handleSpotUpdate = handleSpotCreate;

  const handleSpotRemove = (songId: string) => {
    setSetlist((setlist) => ({
      ...setlist!,
      setSpots: setlist!.setSpots.filter((s) => s.songId !== songId),
    }));
  };

  const handleSetDelete = (setIndex: number) => {
    setSetlist((setlist) => ({
      ...setlist!,
      setSpots: setlist!.setSpots
        .filter((s) => s.set !== setIndex)
        .map((s) => ({
          ...s,
          set: s.set > setIndex ? s.set - 1 : s.set,
        })),
    }));
  };

  const handleEncoreDelete = () => {
    setSetlist((setlist) => ({
      ...setlist!,
      setSpots: setlist!.setSpots.filter((s) => s.set >= 0),
    }));
  };

  const handleTimeUpdate = (newTimes: setlistTimeDTO) => {
    setSetlist(
      (setlist) =>
        setlist && {
          ...setlist,
          ...newTimes,
        }
    );
  };

  useEffect(() => {
    if (id === undefined) {
      backToMainPage();
      return;
    }
    storage.initSetlist(id).then((v) => {
      if (!v) {
        backToMainPage();
        return;
      }
      storage.getCategories().then(setCategories);
      storage.getSongs().then((songs: song[]) => {
        const songMap = new Map(songs.map((song) => [song.id, song]));
        setSongs(songMap);
        storage.getSetlist(id).then((s: setlist) => {
          setSetlist(s);
          setBreakLen(s.breakLen);
          setBreakBuf(s.breakBuffer);
          if (s.fixedTime === "START") {
            // setEndTime(calculateEndTime(s, songMap));
            setStartTime(s.time);
          } else {
            // setStartTime(calculateStartTime(s, songMap));
            setEndTime(s.time);
          }
          setFixedTime(s.fixedTime);
        });
      });
      storage.getSetlistSocket(id)?.on("setlist:updateName", handleNameUpdate);
      storage.getSetlistSocket(id)?.on("setlist:createSpot", handleSpotCreate);
      storage.getSetlistSocket(id)?.on("setlist:updateSpot", handleSpotUpdate);
      storage.getSetlistSocket(id)?.on("setlist:removeSpot", handleSpotRemove);
      storage.getSetlistSocket(id)?.on("setlist:deleteSet", handleSetDelete);
      storage
        .getSetlistSocket(id)
        ?.on("setlist:deleteEncore", handleEncoreDelete);
      storage.getSetlistSocket(id)?.on("setlist:timeUpdate", handleTimeUpdate);
    });

    return () => {
      storage.getSetlistSocket(id)?.off("setlist:timeUpdate", handleTimeUpdate);
      storage
        .getSetlistSocket(id)
        ?.off("setlist:deleteEncore", handleEncoreDelete);
      storage.getSetlistSocket(id)?.off("setlist:deleteSet", handleSetDelete);
      storage.getSetlistSocket(id)?.off("setlist:removeSpot", handleSpotRemove);
      storage.getSetlistSocket(id)?.off("setlist:updateSpot", handleSpotUpdate);
      storage.getSetlistSocket(id)?.off("setlist:createSpot", handleSpotCreate);
      storage.getSetlistSocket(id)?.off("setlist:updateName", handleNameUpdate);
    };
  }, []);

  useEffect(() => {
    if (setlist) {
      document.title = setlist.name + " - SongRack";
    }
  }, [setlist?.name]);

  useEffect(() => {
    if (setlist === undefined) return;
    if (setlist.fixedTime === "START") {
      setFixedTime("START");
      setStartTime(setlist.time);
    } else {
      setFixedTime("END");
      setEndTime(setlist.time);
    }
    setBreakBuf(setlist.breakBuffer);
    setBreakLen(setlist.breakLen);
  }, [
    setlist?.setSpots,
    setlist?.fixedTime,
    setlist?.time,
    setlist?.breakBuffer,
    setlist?.breakLen,
  ]);

  useEffect(() => {
    if (setlist === undefined || songs === undefined) return;
    if (fixedTime === "START") {
      setEndTime(calculateEndTime(setlist.setSpots, songs));
    } else {
      setStartTime(calculateStartTime(setlist.setSpots, songs));
    }
  }, [fixedTime, startTime, endTime, breakBuf, breakLen, setlist?.setSpots]);

  const finishEditingName = () => {
    storage.getSetlistSocket(id!)?.emit("setlist:updateName", name);
    handleNameUpdate(name);
    setName("");
    setEditingName(false);
  };

  const createSpot = (newSpot: setSpot) => {
    storage.getSetlistSocket(id!)?.emit("setlist:createSpot", newSpot);
    handleSpotCreate(newSpot);
  };

  const updateSpot = (newSpot: setSpot) => {
    storage.getSetlistSocket(id!)?.emit("setlist:updateSpot", newSpot);
    handleSpotUpdate(newSpot);
  };

  const removeSpot = (songId: string) => {
    storage.getSetlistSocket(id!)?.emit("setlist:removeSpot", songId);
    handleSpotRemove(songId);
  };

  const deleteSet = (setIndex: number) => {
    storage.getSetlistSocket(id!)?.emit("setlist:deleteSet", setIndex);
    // handleSetDelete(setIndex); // gets double fired otherwise
  };

  const deleteEncore = () => {
    storage.getSetlistSocket(id!)?.emit("setlist:deleteEncore");
    handleEncoreDelete();
  };

  const finishEditingTimes = () => {
    setEditingTimes(false);
    const dto: setlistTimeDTO = {
      breakBuffer: breakBuf,
      breakLen: breakLen,
      fixedTime: fixedTime!,
      time: fixedTime! === "START" ? startTime : endTime,
    };
    storage.getSetlistSocket(id!)?.emit("setlist:timeUpdate", dto);
    handleTimeUpdate(dto);
  };

  const abortEditingTimes = () => {
    setBreakBuf(setlist!.breakBuffer);
    setBreakLen(setlist!.breakLen);
    setFixedTime(setlist!.fixedTime);
    if (setlist!.fixedTime === "START") {
      setStartTime(setlist!.time);
    } else {
      setEndTime(setlist!.time);
    }
    setEditingTimes(false);
  };

  const startDragging =
    (from: string) =>
    (songId: string) =>
    (e: DragEvent<HTMLTableRowElement>) => {
      setDraggingFrom(from);
      setDraggingId(songId);

      e.dataTransfer.setData("pain/text", "dummy"); // required for safari
    };

  const dragOver = (to: string) => (e: DragEvent<any>) => {
    e.preventDefault();
    e.stopPropagation();

    const elements = document.getElementsByClassName(to);

    let newIndex = 0;

    for (const el of elements) {
      if (el.getBoundingClientRect().bottom > e.clientY) break;
      newIndex++;
    }

    let newSetIndex = -1;
    if (to.startsWith("Set-")) {
      newSetIndex += Number(to.substring(4));
    }

    let newSets = getPartitionedSets(setlist!.setSpots);
    let newEncore = getEncore(setlist!.setSpots);

    const findPrio = (setSpots: setSpot[], index: number) => {
      if (setSpots.length === 0) {
        return 0;
      }
      if (index === 0) {
        return setSpots[0].spotPrio - 1;
      }
      if (index >= setSpots.length) {
        return setSpots[setSpots.length - 1].spotPrio + 1;
      }

      return (setSpots[index - 1].spotPrio + setSpots[index].spotPrio) / 2;
    };
    let newPrio = -1;

    if (newSetIndex < 0) {
      newPrio = findPrio(
        newEncore
          .sort((a, b) => a.spotPrio - b.spotPrio)
          .filter((s) => !s.dummy),
        newIndex
      );
    } else {
      newPrio = findPrio(
        newSets[newSetIndex]
          .sort((a, b) => a.spotPrio - b.spotPrio)
          .filter((s) => !s.dummy),
        newIndex
      );
    }

    const dummySpot: setSpot & { dummy: true } = {
      dummy: true,
      set: newSetIndex,
      songId: draggingId!,
      spotPrio: newPrio,
    };

    setSetlist(
      (setlist) =>
        setlist && {
          ...setlist,
          setSpots: [
            ...setlist?.setSpots.filter(
              (s) => !s.dummy && s.songId !== draggingId
            ),
            dummySpot,
          ],
        }
    );
  };

  const dragOut = (e: DragEvent<any>) => {
    e.preventDefault();
    e.stopPropagation();
    setSetlist(
      (setlist) =>
        setlist && {
          ...setlist,
          setSpots: setlist.setSpots.filter((s) => s.songId !== draggingId),
        }
    );
  };

  const dropSong = (to: string) => (e: DragEvent<any>) => {
    e.preventDefault();

    let newSpot = setlist?.setSpots.find((spot) => spot.dummy);

    setSetlist(
      (setlist) =>
        setlist && {
          ...setlist,
          setSpots: setlist.setSpots.map((spot) => ({
            ...spot,
            dummy: undefined,
          })),
        }
    );
    setDraggingFrom(undefined);
    setDraggingId(undefined);
    setNewSetSongId(undefined);

    if (draggingFrom === "repertoire" && to === "repertoire") {
      return;
    }

    if (draggingFrom === "repertoire") {
      createSpot({
        ...newSpot!,
        dummy: undefined,
      });
      return;
    }

    if (to === "repertoire") {
      removeSpot(draggingId!);
      return;
    }
    updateSpot({ ...newSpot!, dummy: undefined });
  };

  const dragOverNew = (e: DragEvent<any>) => {
    e.preventDefault();
    e.stopPropagation();
    setNewSetSongId(draggingId);
  };

  const leaveNew = (e: DragEvent<any>) => {
    e.preventDefault();
    e.stopPropagation();
    setNewSetSongId(undefined);
  };

  const dropOnNew = (e: DragEvent<any>) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingFrom(undefined);
    setDraggingId(undefined);
    setNewSetSongId(undefined);
    const newSpot = {
      set: getPartitionedSets(setlist!.setSpots).length,
      songId: newSetSongId!,
      spotPrio: 0,
      dummy: undefined,
    };
    if (draggingFrom === "repertoire") {
      createSpot(newSpot);
    } else {
      updateSpot(newSpot);
    }
  };

  const concertDurationMinutes = (
    setSpots: setSpot[],
    songMap: Map<string, song>
  ) => {
    const sets = getPartitionedSets(setSpots);
    const breaks =
      sets.length * breakBuf + Math.max(sets.length - 1, 0) * breakLen;
    const setLengths = [...sets, getEncore(setSpots)].map(
      (set) =>
        Math.ceil(
          (set?.reduce((a, s) => a + (songMap.get(s.songId)?.length || 0), 0) ||
            0) /
            60 /
            5
        ) * 5
    );
    const sum = (setLengths.reduce((a, s) => a + s, 0) + breaks) * 60;
    return Math.ceil(sum / 60);
  };

  const concertLengthApprox = (
    setSpots: setSpot[],
    songMap: Map<string, song>
  ) => {
    const sum = concertDurationMinutes(setSpots, songMap);
    return `~${Math.floor(sum / 60) % 60}h ${sum % 60}m`;
  };

  const calculateEndTime = (
    setSpots: setSpot[],
    songMap: Map<string, song>
  ) => {
    const startH = Number(startTime.split(":")[0]);
    const startM = Number(startTime.split(":")[1]);
    const minutes = concertDurationMinutes(setSpots, songMap);
    const endMinutes = (startH * 60 + startM + minutes) % 1440;
    return (
      ("0" + Math.floor(endMinutes / 60)).slice(-2) +
      ":" +
      ("0" + (endMinutes % 60)).slice(-2)
    );
  };

  const calculateStartTime = (
    setSpots: setSpot[],
    songMap: Map<string, song>
  ) => {
    const endH = Number(endTime.split(":")[0]);
    const endM = Number(endTime.split(":")[1]);
    const minutes = concertDurationMinutes(setSpots, songMap);
    const startMinutes = (endH * 60 + endM - minutes + 1440) % 1440;
    return (
      ("0" + Math.floor(startMinutes / 60)).slice(-2) +
      ":" +
      ("0" + (startMinutes % 60)).slice(-2)
    );
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

  const setTable = (spots: setSpot[], set: string) => {
    return (
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
              <TableRow
                draggable
                onDragStart={startDragging(set)(spot.songId)}
                className={`${set} ${spot.dummy ? "brightness-50" : ""}`}
                key={song?.id}
              >
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
  };

  const setLength = (set: setSpot[] | undefined) => {
    const sum =
      set?.reduce(
        (a: number, s) => a + (songs?.get(s?.songId)?.length || 0),
        0
      ) || 0;
    return `${Math.floor(sum / 3600)}h ${Math.floor(sum / 60) % 60}m ${
      sum % 60
    }s`;
  };

  const setLengthApprox = (set: setSpot[] | undefined) => {
    const sum =
      set?.reduce(
        (a: number, s) => a + (songs?.get(s?.songId)?.length || 0),
        0
      ) || 0;
    return Math.ceil(sum / 60 / 5) * 5;
  };

  const setDisplay = (setSpots: setSpot[], index: number | string) => {
    const setTitle = typeof index === "string" ? index : `Set ${index + 1}`;
    const setId = setTitle.split(" ").join("-");
    return (
      <Card
        key={`set-${setTitle}`}
        className="w-full"
        onDragOver={dragOver(setId)}
        onDrop={dropSong(setId)}
      >
        <CardHeader>
          <CardTitle className="font-bold text-2xl">{setTitle}</CardTitle>
          <CardAction>
            <Button
              onClick={() =>
                typeof index === "number" ? deleteSet(index) : deleteEncore()
              }
              className="hover:bg-red-600/80"
              variant={"secondary"}
            >
              <Trash2 />
              {typeof index === "number" ? "Delete Set" : "Clear Encore"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {setTable(
            setSpots.sort((a, b) => a.spotPrio - b.spotPrio),
            setId
          )}
        </CardContent>
        <CardFooter>
          {setSpots.length} Songs, ~{setLengthApprox(setSpots)} min (
          {setLength(setSpots)})
        </CardFooter>
      </Card>
    );
  };

  const PseudoSetDisplay = () => (
    <Card
      className={`relative w-full border-dashed h-60 ${
        newSetSongId && "bg-green-900/50"
      }`}
      onDragOver={dragOverNew}
      onDragLeave={leaveNew}
      onDrop={dropOnNew}
    >
      <CardHeader className="absolute w-full">
        <CardTitle className="realtive font-bold text-2xl">New Set</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col w-full h-full items-center justify-center">
        {newSetSongId ? (
          <div className="flex flex-col gap-2 items-center">
            <Import />
            Drop here
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center">
            <Import />
            Drag a song here to add a new set
          </div>
        )}
      </CardContent>
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
                  className="border"
                >
                  <Pen />
                </Button>
              </>
            )}
          </h1>
          {setlist && getPartitionedSets(setlist.setSpots).map(setDisplay)}
          <PseudoSetDisplay />
          {setlist && setDisplay(getEncore(setlist.setSpots), "Encore")}
          {setlist?.setSpots.length || 0} Songs total
          <h1 className="font-bold text-2xl flex flex-row items-center gap-2">
            Times:
            {editingTimes ? (
              <ButtonGroup>
                <Button
                  className="border"
                  variant={"secondary"}
                  onClick={abortEditingTimes}
                >
                  <X />
                </Button>
                <Button className="border" onClick={finishEditingTimes}>
                  <Check />
                </Button>
              </ButtonGroup>
            ) : (
              <Button
                onClick={() => setEditingTimes(true)}
                className="border"
                variant={"secondary"}
              >
                <Pen />
              </Button>
            )}
          </h1>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 w-fit gap-2">
              <div>Raw playing time:</div>
              <div>
                {setlist?.setSpots ? (
                  <b>{setLength(setlist?.setSpots)}</b>
                ) : (
                  "0s"
                )}
              </div>
              <div>Total length:</div>
              <div>
                {setlist?.setSpots && songs ? (
                  <b>{concertLengthApprox(setlist.setSpots, songs)}</b>
                ) : (
                  "0m"
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 w-fit gap-2">
              <span className="w-fit flex flex-row items-center">Start:</span>
              <Input
                className="w-50 col-span-3"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setFixedTime("START");
                }}
                disabled={!editingTimes}
              />
              <span className="w-fit flex flex-row items-center">End:</span>
              <Input
                className="w-50 col-span-3"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setFixedTime("END");
                }}
                disabled={!editingTimes}
              />
              <span className="w-fit flex flex-row items-center">
                Break length:
              </span>
              <Input
                className="w-50 col-span-3"
                type="number"
                min={0}
                value={breakLen}
                onChange={(e) => {
                  setBreakLen(Math.max(Number(e.target.value), 0));
                }}
                disabled={!editingTimes}
              />
              <span className="w-fit flex flex-row items-center">
                Break buffer:
              </span>
              <Input
                className="w-50 col-span-3"
                type="number"
                min={0}
                value={breakBuf}
                onChange={(e) => {
                  setBreakBuf(Math.max(Number(e.target.value), 0));
                }}
                disabled={!editingTimes}
              />
            </div>
            <span>
              Breaks after each set (except last), with a buffer for each set.
              All numbers are minutes.
            </span>
          </div>
          <h1 className="font-bold text-2xl">Your Custom Categories:</h1>
          <div className="grid grid-cols-6 gap-4">
            {categories?.map(categoryCard)}
          </div>
          <Button onClick={() => setExportDialogOpen(true)} className="w-fit">
            <FileDown /> Export Setlist
          </Button>
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
            onDragStart={startDragging("repertoire")}
            onDragOver={dragOut}
            onDrop={dropSong("repertoire")}
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
      {exportDialogOpen && (
        <SetlistExportCard
          setlist={setlist!}
          categories={categories || []}
          songs={songs || new Map()}
          onClose={() => setExportDialogOpen(false)}
          startTime={startTime || "19:00"}
        />
      )}
    </div>
  );
}
