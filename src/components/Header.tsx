import { CircleUserRoundIcon, MusicIcon } from "lucide-react";
import type React from "react";
import LoginCard from "./LoginCard";
import { useState } from "react";

export type HeaderProps = {
  backButton?: React.ReactNode | undefined;
  onLogin: (loggedIn: boolean) => void;
};

export default function Header({ backButton, onLogin }: HeaderProps) {
  const [loginOpen, setLoginOpen] = useState(false);

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
          <div className="float-end">
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
