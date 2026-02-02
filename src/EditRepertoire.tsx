import { Link, useNavigate } from "react-router";
import Header from "./components/Header";
import { ArrowLeft, Check, Pen, Plus, Trash2, X } from "lucide-react";
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

type category = {
  id: string;
  title: string;
  show: boolean;
  type: string;
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

  const backToMainPage = () => {
    navigate("/");
  };

  useEffect(() => {
    storage.init().then((v) => {
      if (!v) backToMainPage();
      storage.getSongs().then(setSongs);
      storage.getCategories().then(setCategories);
    });
    document.title = "Repertoire";
  }, []);

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
    setSongs((songs) =>
      songs?.map((s) => {
        if (s.id !== songId) return s;
        return {
          ...s,
          [attribute]: newVal,
        };
      })
    );
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

  const deleteSong = (songId: string) => () => {
    setSongs((songs) => songs?.filter((s) => s.id !== songId));
  };

  /***
   * END INPUT HANDLERS
   */

  const CategoryHead = ({ id, title, show, type, valueRange }: category) => {
    return <TableHead key={`category-${id}`}>{title}</TableHead>;
  };

  const StringInput = ({ editing, value, onChange }: InputProps<string>) => {
    if (!editing) return <>{value}</>;

    return (
      <Input value={value} onChange={(e) => onChange(value, e.target.value)} />
    );
  };

  const BooleanProperty = (
    editing: boolean,
    category: category,
    song: song
  ) => {
    if (!editing) return !!song.properties[category.id] ? <Check /> : <X />;

    return <Checkbox checked={song.properties[category.id]} />;
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
      />
    );
  };

  const StringProperty = (editing: boolean, category: category, song: song) => {
    if (!editing) return song.properties[category.id];

    return (
      <Select defaultValue={song.properties[category.id] || "clear"}>
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

    return <></>;
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
                onClick={() => setEditingSong(undefined)}
                className="border"
              >
                <Check /> Done
              </Button>
            ) : (
              <Button
                onClick={() => setEditingSong(id)}
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Song Title</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Length</TableHead>
              {categories?.filter(({ show }) => show).map(CategoryHead)}
              <TableHead>Notes</TableHead>
              <TableHead className="w-fit">
                <Button className="border" variant={"secondary"}>
                  <Plus />
                  Add Category
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{songs?.map(SongRow)}</TableBody>
        </Table>
        {/* {JSON.stringify(songs, undefined, 2)} */}
        {/* {JSON.stringify(categories, undefined, 2)} */}
      </div>
    </div>
  );
}
