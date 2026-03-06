import { useEffect, useState } from "react";
import Header from "./components/Header";
import storage from "./lib/storage";
import PseudoSetlistCard from "./components/PseudoSetlistCard";
import { Button } from "./components/ui/button";
import { ArrowRight, FileUp, Music, Trash2 } from "lucide-react";
import { Link } from "react-router";
import SetlistIngestCard from "./components/SetlistIngestCard";
import FrontPageSplash from "./components/FrontPageSplash";
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from "./components/ui/card";

type SetlistCardProps = {
  id: string;
  name: string;
  sets: number;
  onDelete: () => void;
};

function App() {
  const [setlists, setSetlists] = useState<Omit<SetlistCardProps, "onDelete">[] | undefined>(undefined);
  const [loggedIn, setLoggedIn] = useState<boolean | undefined>(undefined);
  const [repertoireSize, setRepertoireSize] = useState<number | undefined>(undefined);
  const [ingestSetlistCardOpen, setIngestSetlistCardOpen] = useState<boolean>(false);

  const refetchUserData = () => {
    storage.getSetlists().then(setSetlists);
    storage.getRepertoireSize().then(setRepertoireSize);
  };

  useEffect(() => {
    if (loggedIn) refetchUserData();
  }, [loggedIn]);

  useEffect(() => {
    document.title = "SongRack";
    storage.init().then((v) => {
      if (v !== undefined) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }

      storage.socket?.on("refresh", refetchUserData);
    });

    return () => {
      storage.socket?.off("refresh", refetchUserData);
    };
  }, []);

  const makeUsernameUppercase = (username: string) => {
    return username[0].toUpperCase() + username.slice(1);
  };

  const repertorieSizeText = (size: number) => {
    const numbers = [
      "",
      "",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
    ];
    if (size < 1) {
      return "no songs";
    }
    if (size === 1) {
      return "one song";
    }
    if (size < 13) {
      return `${numbers[size]} songs`;
    }
    return `${size} songs`;
  };

  const setlistCard = ({ onDelete, id, name, sets }: SetlistCardProps) => (
    <Card key={id} className="flex flex-col justify-between">
      <CardHeader className="text-2xl">
        <CardTitle>{name}</CardTitle>
        <CardAction>
          <Button onClick={onDelete} variant={"secondary"} className="hover:bg-red-600/80 border">
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex flex-col items-start gap-4">
        {sets} sets
        <Link className="w-full" to={`/editSetlist/${id}`}>
          <Button className="w-full">
            Edit Setlist <ArrowRight />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen w-screen bg-gray-950 flex flex-col">
      <Header onLogin={setLoggedIn} />
      {loggedIn ? (
        <div className="pt-8 px-5 lg:px-30 flex flex-col gap-12">
          <div className="text-5xl font-bold">Welcome back, {makeUsernameUppercase(storage.user!.name)}!</div>
          <div className="flex flex-col gap-6">
            {repertoireSize !== undefined && (
              <h2>You have {repertorieSizeText(repertoireSize)} in your Repertoire</h2>
            )}
            <div className="flex flex-row justify-between gap-4">
              <Link to="/editRepertoire">
                <Button className="w-fit border" variant={"secondary"}>
                  <Music />
                  Edit Repertoire
                  <ArrowRight />
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <span className="flex flex-row justify-between">
              <h2>
                {!!setlists ? (
                  <>
                    You have {setlists.length} {setlists.length === 1 ? "setlist" : "setlists"}
                  </>
                ) : (
                  <>Your Setlists</>
                )}
              </h2>
              <Button onClick={() => setIngestSetlistCardOpen(true)}>
                <FileUp /> Import Setlist from <code>.json</code>
              </Button>
            </span>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {setlists?.map((p) =>
                setlistCard({
                  onDelete: () => storage.deleteSetlist(p.id).then(refetchUserData),
                  ...p,
                })
              )}
              <PseudoSetlistCard
                onClick={() => {
                  storage.addSetlist().then((id) => {
                    if (id) {
                      refetchUserData();
                    }
                  });
                }}
              />
            </div>
          </div>
          {ingestSetlistCardOpen && (
            <SetlistIngestCard
              onClose={() => setIngestSetlistCardOpen(false)}
              onSetlistsUpdate={refetchUserData}
            />
          )}
        </div>
      ) : loggedIn === undefined ? (
        <></>
      ) : (
        <FrontPageSplash />
      )}
    </div>
  );
}

export default App;
