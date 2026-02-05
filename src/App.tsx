import { useEffect, useState } from "react";
import Header from "./components/Header";
import storage from "./lib/storage";
import SetlistCard, { type SetlistCardProps } from "./components/SetlistCard";
import PseudoSetlistCard from "./components/PseudoSetlistCard";
import { Button } from "./components/ui/button";
import { Music, Plus } from "lucide-react";
import { Link } from "react-router";

function App() {
  const [setlists, setSetlists] = useState<
    Omit<SetlistCardProps, "onDelete">[] | undefined
  >(undefined);
  const [loggedIn, setLoggedIn] = useState(false);
  const [repertoireSize, setRepertoireSize] = useState<number | undefined>(
    undefined
  );

  const refetchUserData = () => {
    if (!loggedIn) return;
    storage.getSetlists().then(setSetlists);
    storage.getRepertoireSize().then(setRepertoireSize);
  };

  useEffect(refetchUserData, [loggedIn]);

  useEffect(() => {
    storage.init().then((v) => {
      if (v) {
        setLoggedIn(true);
      }
    });
    document.title = "Setlist Tool";
  }, []);

  const makeUsernameUppercase = (username: string) => {
    return username[0].toUpperCase() + username.slice(1);
  };

  return (
    <div className="min-h-screen w-screen bg-gray-950">
      <Header onLogin={setLoggedIn} />
      {loggedIn ? (
        <div className="pt-8 px-30 flex flex-col gap-12">
          <div className="text-5xl font-bold">
            Welcome back, {makeUsernameUppercase(storage.user!.name)}!
          </div>
          <div className="flex flex-col gap-6">
            {!!repertoireSize && (
              <h2>You have {repertoireSize} Songs in your Repertoire</h2>
            )}
            <div className="flex flex-row justify-between gap-4">
              <Link to="/editRepertoire">
                <Button className="w-fit border" variant={"secondary"}>
                  <Music />
                  Edit Repertoire
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <span className="flex flex-row justify-between">
              <h2>
                {!!setlists ? (
                  <>
                    You have {setlists.length}{" "}
                    {setlists.length === 1 ? "setlist" : "setlists"}
                  </>
                ) : (
                  <>Your Setlists</>
                )}
              </h2>
              <Button>
                <Plus /> Import setlist from <code>.json</code>
              </Button>
            </span>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {setlists?.map((p) => (
                <SetlistCard
                  onDelete={() => {
                    storage.deleteSetlist(p.id).then(refetchUserData);
                  }}
                  {...p}
                />
              ))}
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
        </div>
      ) : (
        <>Log tf in</>
      )}
    </div>
  );
}

export default App;
