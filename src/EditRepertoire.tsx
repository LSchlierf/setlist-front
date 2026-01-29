import { Link, useNavigate } from "react-router";
import Header from "./components/Header";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import storage from "./lib/storage";

export default function EditRepertoire() {
  const navigate = useNavigate();

  const [songs, setSongs] = useState<undefined | any[]>(undefined);
  const [categories, setCategories] = useState<undefined | any[]>(undefined);

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
      <div className="pt-8 px-30">
        Edit Repertoire for user {storage.user!.name}
      </div>
    </div>
  );
}
