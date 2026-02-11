import { Link, useNavigate } from "react-router";
import Header from "./components/Header";
import {
  ArrowLeft,
  Palette,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import storage from "./lib/storage";
import { Button } from "./components/ui/button";
import { ButtonGroup } from "./components/ui/button-group";
import { Checkbox } from "./components/ui/checkbox";
import RepertoireImportExportCard from "./components/RepertoireImportExportCard";
import { Card, CardContent } from "./components/ui/card";
import {
  categoryTypeLabels,
  type category,
} from "./types";
import NewCategoryCard from "./components/NewCategoryCard";
import CategoryColorCard, {
  getNumberCategoryGradient,
} from "./components/CategoryColorCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import RepertoireTable from "./components/RepertoireTable";

export default function EditRepertoire() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<undefined | category[]>(
    undefined
  );
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] =
    useState<boolean>(false);
  const [colorCategory, setColorCategory] = useState<category | undefined>(
    undefined
  );

  const backToMainPage = () => {
    navigate("/");
  };

  const refetchUserData = () => {
    storage.getCategories().then(setCategories);
  };

  const handleCategoryCreate = (newCategory: category) => {
    setCategories((categories) => [...(categories || []), newCategory]);
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

  const handleColorUpdate = ({
    categoryId,
    colors,
  }: {
    categoryId: string;
    colors: { [key: string]: string };
  }) => {
    setCategories((categories) =>
      categories?.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          colors: colors,
        };
      })
    );
  };

  const handleColorDelete = (categoryId: string) => {
    setCategories((categories) =>
      categories?.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          colors: undefined,
        };
      })
    );
  };

  useEffect(() => {
    storage.init().then((v) => {
      if (!v) backToMainPage();
      refetchUserData();
      storage.socket?.on("repertoire", refetchUserData);
      storage.socket?.on("repertoire:addCategory", handleCategoryCreate);
      storage.socket?.on("repertoire:updateCategory", handleCategoryUpdate);
      storage.socket?.on("repertoire:deleteCategory", handleCategoryDelete);
      storage.socket?.on("repertoire:setColors", handleColorUpdate);
      storage.socket?.on("repertoire:deleteColors", handleColorDelete);
    });

    document.title = "Repertoire";

    return () => {
      storage.socket?.off("repertoire:deleteColors", handleColorDelete);
      storage.socket?.off("repertoire:setColors", handleColorUpdate);
      storage.socket?.off("repertoire:deleteCategory", handleCategoryDelete);
      storage.socket?.off("repertoire:updateCategory", handleCategoryUpdate);
      storage.socket?.off("repertoire:addCategory", handleCategoryCreate);
      storage.socket?.off("repertoire", refetchUserData);
    };
  }, []);

  const addCategory = (newCategory: category) => {
    storage.socket?.emit("repertoire:addCategory", newCategory);
    handleCategoryCreate(newCategory);
  };

  const editCategory = (category: category) => {
    storage.socket?.emit("repertoire:updateCategory", category);
    handleCategoryUpdate(category);
  };

  const deleteCategory = (categoryId: string) => {
    storage.socket?.emit("repertoire:deleteCategory", categoryId);
    handleCategoryDelete(categoryId);
  };

  const setColors = (categoryId: string, colors: { [key: string]: string }) => {
    storage.socket?.emit("repertoire:setColors", { categoryId, colors });
    handleColorUpdate({ categoryId, colors });
  };

  const deleteColors = (categoryId: string) => {
    storage.socket?.emit("repertoire:deleteColors", categoryId);
    handleColorDelete(categoryId);
  };

  const getStringCategoryGradient = (category: category) => {
    let gradient = "conic-gradient(from 0.75turn";

    category.valueRange.forEach((val, index) => {
      const ratio = index / category.valueRange.length;
      const nextRatio = (index + 1) / category.valueRange.length;

      gradient += `, ${category.colors![val.toString()]} ${Math.round(
        ratio * 100
      )}%, ${category.colors![val.toString()]} ${Math.round(nextRatio * 100)}%`;
    });

    return gradient + ")";
  };

  const ColorsGradient = (category: category) => {
    let gradient = "";

    switch (category.type) {
      case "booleanCategory":
        gradient = `linear-gradient(to right, ${category.colors!["true"]} 0%, ${
          category.colors!["true"]
        } 50%, ${category.colors!["false"]} 50%, ${
          category.colors!["false"]
        } 100%)`;
        break;
      case "numberCategory":
        gradient = getNumberCategoryGradient(category, undefined, "to right");
        break;
      case "stringCategory":
        gradient = getStringCategoryGradient(category);
        break;
    }

    return (
      <Button
        className="hover:cursor-default!"
        style={{ background: gradient }}
      ></Button>
    );
  };

  const CategoryCard = (category: category) => {
    const { id, title, type, show, colors } = category;
    return (
      <Card key={category.id} className="w-full">
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
            <div className="flex flex-row justify-between items-center">
              Colors:
              <ButtonGroup>
                {!!colors && ColorsGradient(category)}
                {type === "multipleStringCategory" ? (
                  <Tooltip>
                    <TooltipTrigger
                      asChild
                      className="disabled:pointer-events-auto"
                    >
                      <Button variant={"secondary"} disabled>
                        <Palette />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Colors aren't supported for this cateogry type.
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    onClick={() => {
                      setColorCategory(category);
                    }}
                    variant={"secondary"}
                  >
                    <Palette />
                  </Button>
                )}
                {!!colors && (
                  <Button
                    onClick={() => {
                      deleteColors(id);
                    }}
                    variant={"secondary"}
                    className="hover:bg-red-600/80"
                  >
                    <Trash2 />
                  </Button>
                )}
              </ButtonGroup>
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

  const AddCategoryCard = () => {
    return (
      <Card
        onClick={() => setNewCategoryDialogOpen(true)}
        className="w-full flex flex-col justify-center items-center border-dashed hover:bg-gray-800/50 hover:cursor-pointer"
      >
        <Plus />
      </Card>
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
      <div className="flex flex-col gap-8 pt-8 px-30">
        <div className="font-bold text-2xl">Your Repertoire:</div>
        <RepertoireTable categories={categories || []} />
        <div className="flex flex-col gap-6">
          <div className="font-bold text-2xl">Your Custom Categories:</div>
          <div className="grid gap-6 grid-cols-6">
            {categories?.map(CategoryCard)}
            <AddCategoryCard />
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-60">
          Import / Export Repertoire
        </Button>
        {/* {JSON.stringify(songs, undefined, 2)} */}
        {/* {JSON.stringify(categories, undefined, 2)} */}
        <div />
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
      {newCategoryDialogOpen && (
        <NewCategoryCard
          onClose={() => setNewCategoryDialogOpen(false)}
          onFinish={addCategory}
        />
      )}
      {!!colorCategory && (
        <CategoryColorCard
          category={colorCategory}
          onClose={() => setColorCategory(undefined)}
          onFinish={setColors}
        />
      )}
    </div>
  );
}
