import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  ArrowUpZA,
  Check,
  Pen,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import type { category, InputProps, song } from "@/types";
import { useEffect, useState } from "react";
import storage from "@/lib/storage";
import { byArtist, byCategory, byLength, byTitle } from "@/lib/songSort";
import { ButtonGroup } from "./ui/button-group";
import { Input } from "./ui/input";
import DurationInput from "./DurationInput";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import NewSongCard from "./NewSongCard";

export type RepertoireTableProps = {
  categories: category[];
  readonly?: boolean | undefined;
  filterTerm?: string | undefined;
  usedSongs?: Set<string> | undefined;
};

export default function RepertoireTable({
  categories,
  readonly = false,
  filterTerm,
  usedSongs = new Set(),
}: RepertoireTableProps) {
  const [songs, setSongs] = useState<undefined | song[]>(undefined);
  const [editingSong, setEditingSong] = useState<string | undefined>(undefined);
  const [sorting, setSorting] = useState<
    { field: string; asc: boolean } | undefined
  >({ field: "title", asc: true });
  const [editedSongBefore, setEditedSongBefore] = useState<song | undefined>(
    undefined
  );
  const [newSongDialogOpen, setNewSongDialogOpen] = useState<boolean>(false);

  const refetchUserData = () => {
    storage.getSongs().then((songs) => setSongs(byTitle(true)(songs)));
  };

  const handleSongCreate = (newSong: song) => {
    setSongs((songs) => [...(songs || []), newSong]);
    if (!!sorting) {
      switch (sorting.field) {
        case "title":
          sortByTitle(sorting.asc);
          return;
        case "artist":
          sortByArtist(sorting.asc);
          return;
        case "duration":
          sortByLength(sorting.asc);
          return;
        default:
          let category = categories?.find((c) => c.id === sorting.field);
          if (!!category) {
            sortByCategory(sorting.field, category.type)(sorting.asc);
          }
          return;
      }
    }
  };

  const handleSongUpdate = (newSong: song) => {
    setSongs((songs) =>
      songs?.map((s) => {
        if (s.id !== newSong.id) return s;
        return newSong;
      })
    );
  };

  const handleSongDelete = (deletedSongId: string) => {
    setSongs((songs) => songs?.filter((s) => s.id !== deletedSongId));
  };

  const sortByTitle = (asc: boolean) => {
    setSongs(byTitle(asc));
  };

  const sortByArtist = (asc: boolean) => {
    setSongs(byArtist(asc));
  };

  const sortByLength = (asc: boolean) => {
    setSongs(byLength(asc));
  };

  const sortByCategory =
    (categoryId: string, categoryType: string) => (asc: boolean) => {
      setSongs(byCategory(asc, categoryId, categoryType));
    };

  const filterByTerm = (song: song) => {
    if (filterTerm === undefined || filterTerm.length === 0) return true;

    return (
      song.title.toLowerCase().includes(filterTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(filterTerm.toLowerCase()) ||
      song.notes?.toLowerCase().includes(filterTerm.toLowerCase())
    );
  };

  const filterByExclusion = (song: song) => {
    return !usedSongs.has(song.id);
  };

  useEffect(() => {
    storage.initRepertoire().then(() => {
      refetchUserData();
      storage.repertoireSocket?.on("repertoire", refetchUserData);
      storage.repertoireSocket?.on("repertoire:addSong", handleSongCreate);
      storage.repertoireSocket?.on("repertoire:updateSong", handleSongUpdate);
      storage.repertoireSocket?.on("repertoire:deleteSong", handleSongDelete);
    });

    return () => {
      storage.repertoireSocket?.off("repertoire:deleteSong", handleSongDelete);
      storage.repertoireSocket?.off("repertoire:updateSong", handleSongUpdate);
      storage.repertoireSocket?.off("repertoire:addSong", handleSongCreate);
      storage.repertoireSocket?.off("repertoire", refetchUserData);
    };
  }, []);

  const addSong = (newSong: song) => {
    storage.repertoireSocket?.emit("repertoire:addSong", newSong);
    handleSongCreate(newSong);
  };

  const finishEditingSong = (song: song) => {
    storage.repertoireSocket?.emit("repertoire:updateSong", song);
    setEditingSong(undefined);
    setEditedSongBefore(undefined);
  };

  const deleteSong = (songId: string) => () => {
    storage.repertoireSocket?.emit("repertoire:deleteSong", songId);
    setSongs((songs) => songs?.filter((s) => s.id !== songId));
  };

  const InherentPropertyHead = ({
    title,
    field,
    sort,
  }: {
    title: string;
    field: string;
    sort: (asc: boolean) => void;
  }) => {
    const isSortedByThis = sorting?.field === field;
    const isSortedAsc = sorting?.asc;

    return (
      <TableHead key={field}>
        <div className="flex flex-row items-center gap-2">
          {title}
          <Button
            onClick={() => {
              if (!isSortedByThis) {
                setSorting({ field, asc: true });
                sort(true);
                return;
              }
              if (isSortedAsc) {
                setSorting({ field, asc: false });
                sort(false);
                return;
              }
              setSorting(undefined);
            }}
            className="border"
            variant={"secondary"}
          >
            {isSortedByThis ? (
              isSortedAsc ? (
                <ArrowDownAZ />
              ) : (
                <ArrowUpAZ />
              )
            ) : (
              <ArrowUpDown />
            )}
          </Button>
        </div>
      </TableHead>
    );
  };

  const CategoryHead = ({
    id,
    title,
    sort,
  }: category & { sort: (asc: boolean) => void }) => {
    const isSortedByThis = sorting?.field === id;
    const isSortedAsc = sorting?.asc;

    return (
      <TableHead key={`category-${id}`}>
        <div className="flex flex-row items-center gap-2">
          {title}
          <Button
            onClick={() => {
              if (!isSortedByThis) {
                setSorting({ field: id, asc: true });
                sort(true);
                return;
              }
              if (isSortedAsc) {
                setSorting({ field: id, asc: false });
                sort(false);
                return;
              }
              setSorting(undefined);
            }}
            className="border"
            variant={"secondary"}
          >
            {isSortedByThis ? (
              isSortedAsc ? (
                <ArrowDownAZ />
              ) : (
                <ArrowUpZA />
              )
            ) : (
              <ArrowUpDown />
            )}
          </Button>
        </div>
      </TableHead>
    );
  };

  const changeInherentSongAttribute = (
    songId: string,
    attribute: "title" | "artist" | "length" | "notes",
    newVal: string | number
  ) => {
    let newSong;
    setSongs((songs) =>
      songs?.map((s) => {
        if (s.id !== songId) return s;
        newSong = {
          ...s,
          [attribute]: newVal,
        };
        return newSong;
      })
    );
  };

  const editTtile = (songId: string) => (newVal: string) => {
    changeInherentSongAttribute(songId, "title", newVal);
  };
  const editArtist = (songId: string) => (newVal: string) => {
    changeInherentSongAttribute(songId, "artist", newVal);
  };
  const editNotes = (songId: string) => (newVal: string) => {
    changeInherentSongAttribute(songId, "notes", newVal);
  };
  const editDuration = (songId: string) => (newVal: number) => {
    changeInherentSongAttribute(songId, "length", newVal);
  };

  const StringInput = ({ editing, value, onChange }: InputProps<string>) => {
    if (!editing) return <>{value}</>;

    return <Input value={value} onChange={(e) => onChange(e.target.value)} />;
  };

  const getTableCellStyle = (category: category, song: song) => {
    if (!!category.colors && category.type === "booleanCategory") {
      return {
        backgroundColor:
          category.colors[(!!song.properties[category.id]).toString()],
      };
    }
    if (!!category.colors && song.properties[category.id] !== undefined) {
      return {
        backgroundColor:
          category.colors[song.properties[category.id].toString()],
      };
    }

    return undefined;
  };

  const changeSimpleSongProperty = (
    songId: string,
    categoryId: string,
    newValue: any
  ) => {
    setSongs((songs) =>
      songs?.map((s) => {
        if (s.id !== songId) return s;
        return {
          ...s,
          properties: {
            ...s.properties,
            [categoryId]: newValue,
          },
        };
      })
    );
  };

  const BooleanProperty = (
    editing: boolean,
    category: category,
    song: song
  ) => {
    if (!editing) {
      // if (song.properties[category.id] === undefined) return <></>;

      return !!song.properties[category.id] ? <Check /> : <X />;
    }

    return (
      <Checkbox
        checked={song.properties[category.id]}
        onCheckedChange={(c) => {
          changeSimpleSongProperty(song.id, category.id, c);
        }}
      />
    );
  };

  const NumberProperty = (editing: boolean, category: category, song: song) => {
    if (!editing) return song.properties[category.id];

    return (
      <Input
        type="number"
        className="w-20"
        value={song.properties[category.id]}
        min={Math.min(...category.valueRange)}
        max={Math.max(...category.valueRange)}
        onChange={(e) => {
          changeSimpleSongProperty(
            song.id,
            category.id,
            Math.max(
              Math.min(...category.valueRange),
              Math.min(Math.max(...category.valueRange), Number(e.target.value))
            )
          );
        }}
      />
    );
  };

  const StringProperty = (editing: boolean, category: category, song: song) => {
    if (!editing) return song.properties[category.id];

    return (
      <Select
        defaultValue={song.properties[category.id] || "clear"}
        onValueChange={(v) => {
          changeSimpleSongProperty(
            song.id,
            category.id,
            v === "clear" ? undefined : v
          );
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="clear">(select)</SelectItem>
            {category.valueRange.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  const MultipleStringProperty = (
    editing: boolean,
    category: category,
    song: song
  ) => {
    if (!editing) return song.properties[category.id]?.join(", ");

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"secondary"} className="ml-auto">
            Select
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {category.valueRange.map((value) => (
            <DropdownMenuCheckboxItem
              key={value}
              checked={!!song.properties[category.id]?.includes(value)}
              onCheckedChange={(c) => {
                setSongs((songs) =>
                  songs?.map((s) => {
                    if (s.id !== song.id) return s;

                    const newProperty = category.valueRange.filter((v) => {
                      if (v === value) {
                        return c;
                      }
                      return s.properties[category.id]?.includes(v) || false;
                    });

                    return {
                      ...s,
                      properties: {
                        ...s.properties,
                        [category.id]: newProperty,
                      },
                    };
                  })
                );
              }}
            >
              {value}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const PropertyInput = (editing: boolean, category: category, song: song) => {
    switch (category.type) {
      case "booleanCategory":
        return BooleanProperty(editing, category, song);
      case "numberCategory":
        return NumberProperty(editing, category, song);
      case "stringCategory":
        return StringProperty(editing, category, song);
      case "multipleStringCategory":
        return MultipleStringProperty(editing, category, song);
      default:
        return <>{category.type} not implemented!</>;
    }
  };

  const SongRow = (song: song) => {
    const { id, title, artist, length, notes } = song;
    const editing = editingSong === id;
    return (
      <TableRow key={`song-${id}`}>
        <TableCell>
          {StringInput({ editing, value: title, onChange: editTtile(id) })}
        </TableCell>
        <TableCell>
          {StringInput({ editing, value: artist, onChange: editArtist(id) })}
        </TableCell>
        <TableCell>
          {DurationInput({
            editing,
            value: length,
            onChange: editDuration(id),
          })}
        </TableCell>
        {categories
          ?.filter(({ show }) => show)
          .map((category) => (
            <TableCell
              style={getTableCellStyle(category, song)}
              key={`property-${id}-${category.id}`}
            >
              {PropertyInput(editing, category, song)}
            </TableCell>
          ))}
        <TableCell>
          {StringInput({ editing, value: notes, onChange: editNotes(id) })}
        </TableCell>
        {!readonly && (
          <TableCell className="w-fit">
            <ButtonGroup>
              {editingSong === id ? (
                <Button
                  onClick={() => {
                    finishEditingSong(song);
                  }}
                  className="border"
                >
                  <Check /> Done
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (editingSong !== undefined) {
                      setSongs((songs) =>
                        songs?.map((song) => {
                          if (song.id !== editingSong) return song;
                          return editedSongBefore!;
                        })
                      );
                    }
                    setEditedSongBefore(song);
                    setEditingSong(id);
                  }}
                  className="border"
                  variant={"secondary"}
                >
                  <Pen /> Edit
                </Button>
              )}
              <Button
                className="hover:bg-red-600/80 border"
                variant={"secondary"}
                onClick={deleteSong(id)}
              >
                <Trash2 />
                Delete
              </Button>
            </ButtonGroup>
          </TableCell>
        )}
      </TableRow>
    );
  };

  const totalLength = () => {
    const len =
      songs?.reduce((acc: number, song: song) => acc + song.length, 0) || 0;

    const h = Math.floor(len / 3600);
    const m = Math.floor(len / 60) % 60;
    const s = len % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <>
      <Table className="relative">
        <TableHeader>
          <TableRow>
            <InherentPropertyHead
              title="Song Title"
              field="title"
              sort={sortByTitle}
            />
            <InherentPropertyHead
              title="Artist"
              field="artist"
              sort={sortByArtist}
            />
            <InherentPropertyHead
              title="Length"
              field="duration"
              sort={sortByLength}
            />
            {categories
              ?.filter(({ show }) => show)
              .map((c) => (
                <CategoryHead
                  key={c.id}
                  {...c}
                  sort={sortByCategory(c.id, c.type)}
                />
              ))}
            <TableHead>Notes</TableHead>
            {!readonly && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs?.filter(filterByExclusion).filter(filterByTerm).map(SongRow)}
          {!readonly && (
            <TableRow>
              <TableCell>
                <Button
                  onClick={() => setNewSongDialogOpen(true)}
                  className="border"
                >
                  <Plus />
                  Add Song
                </Button>
              </TableCell>
              <TableCell />
              <TableCell />
              {categories
                ?.filter(({ show }) => show)
                .map(({ id }) => (
                  <TableCell key={id} />
                ))}
              <TableCell />
              <TableCell />
            </TableRow>
          )}
        </TableBody>
      </Table>
      {songs?.length} Songs, {totalLength()} total.
      {newSongDialogOpen && (
        <NewSongCard
          onClose={() => setNewSongDialogOpen(false)}
          onFinish={addSong}
        />
      )}
    </>
  );
}
