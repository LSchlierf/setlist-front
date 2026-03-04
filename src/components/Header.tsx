import { CircleUserRoundIcon, MusicIcon, Redo, Undo } from "lucide-react";
import type React from "react";
import LoginCard from "./LoginCard";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import storage from "@/lib/storage";

export type HeaderProps = {
  backButton?: React.ReactNode | undefined;
  showUndoRedo?: boolean | undefined;
  onLogin: (loggedIn: boolean) => void;
};

export default function Header({
  backButton,
  showUndoRedo,
  onLogin,
}: HeaderProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  if (showUndoRedo === undefined) showUndoRedo = false;
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const undoCallback = (newCanUndo: boolean) => setCanUndo(newCanUndo);
  const redoCallback = (newCanRedo: boolean) => setCanRedo(newCanRedo);

  useEffect(() => {
    storage.registerUndoCallback(undoCallback);
    storage.registerRedoCallback(redoCallback);

    return () => {
      storage.removeUndoCallback(undoCallback);
      storage.removeRedoCallback(redoCallback);
    };
  }, []);

  return (
    <>
      <header className="bg-gray-900 flex p-4 px-5 lg:px-30 border-b border-gray-800 sticky top-0 w-screen z-5">
        <div className="flex items-center justify-between px-auto w-full">
          <div className="flex items-center">
            {backButton}
            <div className="flex flex-row">
              <MusicIcon size={45} className="mr-2" />
              <h1 className="text-white text-3xl flex items-center">
                SongRack™
              </h1>
            </div>
          </div>
          <div className="float-end flex flex-row gap-4">
            {showUndoRedo && (
              <>
                <Tooltip>
                  <TooltipTrigger
                    asChild
                    className="disabled:pointer-events-auto"
                  >
                    <Button
                      disabled={!canUndo}
                      onClick={() => storage.undo()}
                      variant={"secondary"}
                      className="border"
                    >
                      <Undo />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Undo last Change</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    asChild
                    className="disabled:pointer-events-auto"
                  >
                    <Button
                      disabled={!canRedo}
                      onClick={() => storage.redo()}
                      variant={"secondary"}
                      className="border"
                    >
                      <Redo />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Redo last Change</TooltipContent>
                </Tooltip>
              </>
            )}
            <button onClick={() => setLoginOpen((o) => !o)}>
              <CircleUserRoundIcon size={30} />
            </button>
          </div>
        </div>
      </header>
      {loginOpen && (
        <LoginCard onLogin={onLogin} onClose={() => setLoginOpen(false)} />
      )}
    </>
  );
}
