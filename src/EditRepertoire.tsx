import { Link, useNavigate } from "react-router";
import Header from "./components/Header";
import { ArrowLeft, Check, Pen, Plus, Trash2 } from "lucide-react";
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
  length: string;
  notes: string;
  properties: { [key: string]: any };
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

  const categoryHead = ({ id, title, show, type, valueRange }: category) => {
    return <TableHead key={`category-${id}`}>{title}</TableHead>;
  };

  const songRow = ({ id, title, artist, length, notes, properties }: song) => {
    return (
      <TableRow key={`song-${id}`}>
        <TableCell>{title}</TableCell>
        <TableCell>{artist}</TableCell>
        <TableCell>{length}</TableCell>
        {categories
          ?.filter(({ show }) => show)
          .map((c) => (
            <TableCell key={`property-${id}-${c.id}`}>
              {properties[c.id]}
            </TableCell>
          ))}
        <TableCell>{notes}</TableCell>
        <TableCell className="w-fit">
          <ButtonGroup>
            {editingSong === id ? (
              <Button
                onClick={() => setEditingSong(undefined)}
                className="border"
                // variant={"secondary"}
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
              {categories?.filter(({ show }) => show).map(categoryHead)}
              <TableHead>Notes</TableHead>
              <TableHead className="w-fit">
                <Button className="border" variant={"secondary"}>
                  <Plus />
                  Add Category
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{songs?.map(songRow)}</TableBody>
        </Table>
      </div>
    </div>
  );
}
