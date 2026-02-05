import { Link, useNavigate } from "react-router";
import Header from "./components/Header";
import {
  ArrowDownAZ,
  ArrowLeft,
  ArrowUpAz,
  ArrowUpDown,
  ArrowUpZA,
  Check,
  Pen,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import storage from "./lib/storage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { Button } from "./components/ui/button";
import { ButtonGroup } from "./components/ui/button-group";
import { Input } from "./components/ui/input";
import { Checkbox } from "./components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import RepertoireImportExportCard from "./components/RepertoireImportExportCard";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "./components/ui/card";
import { byArtist, byCategory, byLength, byTitle } from "./lib/songSort";

type category = {
  id: string;
  title: string;
  show: boolean;
  type:
    | "booleanCategory"
    | "numberCategory"
    | "stringCategory"
    | "multipleStringCategory";
  valueRange: any[];
};

type song = {
  id: string;
  title: string;
  artist: string;
  length: number;
  notes: string;
  properties: { [key: string]: any };
};

type InputProps<T> = {
  editing: boolean;
  value: T;
  onChange: (oldVal: T, newVal: T) => void;
};

export default function EditRepertoire() {
  const navigate = useNavigate();

  const [songs, setSongs] = useState<undefined | song[]>(undefined);
  const [categories, setCategories] = useState<undefined | category[]>(
    undefined
  );
  const [editingSong, setEditingSong] = useState<string | undefined>(undefined);
  const [editedSongBefore, setEditedSongBefore] = useState<song | undefined>(
    undefined
  );
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [sorting, setSorting] = useState<
    { field: String; asc: boolean } | undefined
  >({ field: "title", asc: true });

  const backToMainPage = () => {
    navigate("/");
  };

  const refetchUserData = () => {
    storage.getSongs().then(setSongs);
    storage.getCategories().then(setCategories);
  };

  const handleSongUpdate = (newSong: any) => {
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

  const handleCategoryUpdate = (newCategory: category) => {
    setCategories((categories) =>
      categories?.map((c) => {
        if (c.id !== newCategory.id) return c;
        return newCategory;
      })
    );
  };

  const handleCategoryDelete = (categoryId: string) => {
    setCategories((categories) =>
      categories?.filter((c) => c.id !== categoryId)
    );
  };

  useEffect(() => {
    storage.init().then((v) => {
      if (!v) backToMainPage();
      refetchUserData();
      storage.socket?.on("repertoire", refetchUserData);
      storage.socket?.on("repertoire:updateSong", handleSongUpdate);
      storage.socket?.on("repertoire:deleteSong", handleSongDelete);
      storage.socket?.on("repertoire:updateCategory", handleCategoryUpdate);
      storage.socket?.on("repertoire:deleteCategory", handleCategoryDelete);
    });
    document.title = "Repertoire";

    return () => {
      storage.socket?.off("repertoire:deleteCategory", handleCategoryDelete);
      storage.socket?.off("repertoire:updateCategory", handleCategoryUpdate);
      storage.socket?.off("repertoire:deleteSong", handleSongDelete);
      storage.socket?.off("repertoire:updateSong", handleSongUpdate);
      storage.socket?.off("repertoire", refetchUserData);
    };
  }, []);

  const finishEditingSong = (song: song) => {
    storage.socket?.emit("repertoire:updateSong", song);
    setEditingSong(undefined);
    setEditedSongBefore(undefined);
  };

  const deleteSong = (songId: string) => () => {
    storage.socket?.emit("repertoire:deleteSong", songId);
    setSongs((songs) => songs?.filter((s) => s.id !== songId));
  };

  const editCategory = (category: category) => {
    storage.socket?.emit("repertoire:updateCategory", category);
    handleCategoryUpdate(category);
  };

  const deleteCategory = (categoryId: string) => {
    storage.socket?.emit("repertoire:deleteCategory", categoryId);
    handleCategoryDelete(categoryId);
  };

  /***
   * START INPUT HANDLERS
   * TODO:
   * - propagate to backend
   * - enroll in undo history
   */
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
    console.log(newSong);
  };

  const editTtile = (songId: string) => (oldVal: string, newVal: string) => {
    changeInherentSongAttribute(songId, "title", newVal);
  };
  const editArtist = (songId: string) => (oldVal: string, newVal: string) => {
    changeInherentSongAttribute(songId, "artist", newVal);
  };
  const editNotes = (songId: string) => (oldVal: string, newVal: string) => {
    changeInherentSongAttribute(songId, "notes", newVal);
  };
  const editDuration = (songId: string) => (oldVal: number, newVal: number) => {
    changeInherentSongAttribute(songId, "length", newVal);
  };

  /***
   * END INPUT HANDLERS
   */

  const CategoryHead = ({
    id,
    title,
    show,
    type,
    valueRange,
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
                <ArrowUpAz />
              )
            ) : (
              <ArrowUpDown />
            )}
          </Button>
        </div>
      </TableHead>
    );
  };

  const StringInput = ({ editing, value, onChange }: InputProps<string>) => {
    if (!editing) return <>{value}</>;

    return (
      <Input value={value} onChange={(e) => onChange(value, e.target.value)} />
    );
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
    if (!editing) return !!song.properties[category.id] ? <Check /> : <X />;

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
            Number(e.target.value)
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

  const DurationInput = ({ editing, value, onChange }: InputProps<number>) => {
    const m = Math.floor(value / 60);
    const s = value % 60;

    if (!editing) {
      return (
        <>
          {m}m {s}s
        </>
      );
    }

    const minuteChange = (newVal: number) => {
      onChange(value, Math.max(0, newVal * 60 + s));
    };
    const secondChange = (newVal: number) => {
      onChange(value, Math.max(0, m * 60 + newVal));
    };

    return (
      <>
        <Input
          className="w-20"
          type="number"
          value={m}
          min={0}
          onChange={(e) => minuteChange(Number(e.target.value))}
        />
        m{" "}
        <Input
          className="w-20"
          type="number"
          value={s}
          min={m === 0 ? 0 : undefined}
          onChange={(e) => secondChange(Number(e.target.value))}
        />
        s
      </>
    );
  };

  const SongRow = (song: song) => {
    const { id, title, artist, length, notes, properties } = song;
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
            <TableCell key={`property-${id}-${category.id}`}>
              {PropertyInput(editing, category, song)}
            </TableCell>
          ))}
        <TableCell>
          {StringInput({ editing, value: notes, onChange: editNotes(id) })}
        </TableCell>
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
      </TableRow>
    );
  };

  const categoryTypeLabels = {
    booleanCategory: "Yes/No",
    numberCategory: "Number",
    stringCategory: "Select",
    multipleStringCategory: "Multiselect",
  };

  const CategoryCard = (category: category) => {
    const { id, title, type, show } = category;
    return (
      <Card className="w-full">
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="font-bold">{title}</div>
            <div className="flex flex-row justify-between items-center">
              Type:
              <span>{categoryTypeLabels[type] || ""}</span>
            </div>
            <div className="flex flex-row justify-between items-center">
              Show:
              <Checkbox
                checked={show}
                onCheckedChange={(checked) =>
                  editCategory({
                    ...category,
                    show: checked as boolean,
                  })
                }
              />
            </div>
            <Button
              className="w-full hover:bg-red-600/80 border"
              variant={"secondary"}
              onClick={() => deleteCategory(id)}
            >
              <Trash2 /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const NewCategoryCard = () => {
    return (
      <Card className="w-full flex flex-col justify-center items-center border-dashed hover:bg-gray-800/50 hover:cursor-pointer">
        <Plus />
      </Card>
    );
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

  return (
    <div className="min-h-screen w-screen bg-gray-950">
      <Header
        backButton={
          <Link to="/" className="pr-4">
            <ArrowLeft size={30} />
          </Link>
        }
        onLogin={(loggedIn) => !loggedIn && backToMainPage()}
      />
      <div className="flex flex-col gap-8 pt-8 px-30 overflow-x-auto">
        <div className="font-bold text-2xl">Your Repertoire:</div>
        <Table>
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
                  <CategoryHead {...c} sort={sortByCategory(c.id, c.type)} />
                ))}
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs?.map(SongRow)}
            <TableRow>
              <TableCell>
                <Button className="border">
                  <Plus />
                  Add Song
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="flex flex-col gap-6">
          <div className="font-bold text-2xl">Your Custom Categories:</div>
          <div className="grid gap-6 grid-cols-7">
            {categories?.map(CategoryCard)}
            <NewCategoryCard />
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-60">
          Import / Export Repertoire
        </Button>
        {/* {JSON.stringify(songs, undefined, 2)} */}
        {/* {JSON.stringify(categories, undefined, 2)} */}
      </div>
      {dialogOpen && (
        <RepertoireImportExportCard
          onRepertoireChange={() => {
            refetchUserData();
            storage.socket?.emit("repertoire");
          }}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
