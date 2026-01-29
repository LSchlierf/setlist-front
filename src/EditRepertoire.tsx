import { Link, useNavigate } from "react-router";
import Header from "./components/Header";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import storage from "./lib/storage";

export default function EditRepertoire() {
  const navigate = useNavigate();

  const backToMainPage = () => {
    navigate("/");
  };

  useEffect(() => {
    storage.init().then((v) => !v && backToMainPage());
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
      Edit Setlist for user {storage.user!.name}
    </div>
  );
}
