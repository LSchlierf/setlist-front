import { Link, useNavigate } from "react-router";
import Header from "./components/Header";
import { ArrowLeft, FolderInput, Palette, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import storage from "./lib/storage";
import { Button } from "./components/ui/button";
import { ButtonGroup } from "./components/ui/button-group";
import { Checkbox } from "./components/ui/checkbox";
import RepertoireImportExportCard from "./components/RepertoireImportExportCard";
import { Card, CardContent } from "./components/ui/card";
import { categoryTypeLabels, type category } from "./types";
import NewCategoryCard from "./components/NewCategoryCard";
import CategoryColorCard from "./components/CategoryColorCard";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";
import RepertoireTable from "./components/RepertoireTable";
import { ColorsGradient } from "./lib/utils";

export default function EditRepertoire() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<undefined | category[]>(undefined);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState<boolean>(false);
  const [colorCategory, setColorCategory] = useState<category | undefined>(undefined);

  const backToMainPage = () => {
    navigate("/");
  };

  const refetchUserData = () => {
    storage.getCategories().then(setCategories);
  };

  const handleCategoryCreate = (newCategory: category) => {
    setCategories((categories) => [
      ...(categories?.filter((c) => c.id !== newCategory.id) || []),
      newCategory,
    ]);
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
    setCategories((categories) => categories?.filter((c) => c.id !== categoryId));
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
    storage.initRepertoire().then((v) => {
      if (!v) backToMainPage();
      refetchUserData();
      storage.repertoireSocket?.on("repertoire", refetchUserData);
      storage.repertoireSocket?.on("repertoire:addCategory", handleCategoryCreate);
      storage.repertoireSocket?.on("repertoire:updateCategory", handleCategoryUpdate);
      storage.repertoireSocket?.on("repertoire:deleteCategory", handleCategoryDelete);
      storage.repertoireSocket?.on("repertoire:setColors", handleColorUpdate);
      storage.repertoireSocket?.on("repertoire:deleteColors", handleColorDelete);
    });

    document.title = "Repertoire - SongRack";

    return () => {
      storage.repertoireSocket?.off("repertoire:deleteColors", handleColorDelete);
      storage.repertoireSocket?.off("repertoire:setColors", handleColorUpdate);
      storage.repertoireSocket?.off("repertoire:deleteCategory", handleCategoryDelete);
      storage.repertoireSocket?.off("repertoire:updateCategory", handleCategoryUpdate);
      storage.repertoireSocket?.off("repertoire:addCategory", handleCategoryCreate);
      storage.repertoireSocket?.off("repertoire", refetchUserData);
      storage.clearHistory();
    };
  }, []);

  const addCategory = (newCategory: category) => {
    storage.do({
      fw: () => {
        storage.repertoireSocket?.emit("repertoire:addCategory", newCategory);
        handleCategoryCreate(newCategory);
      },
      rv: () => {
        storage.repertoireSocket?.emit("repertoire:deleteCategory", newCategory.id);
        handleCategoryDelete(newCategory.id);
      },
    });
  };

  const editCategory = (category: category, oldCategory: category) => {
    storage.do({
      fw: () => {
        storage.repertoireSocket?.emit("repertoire:updateCategory", category);
        handleCategoryUpdate(category);
      },
      rv: () => {
        storage.repertoireSocket?.emit("repertoire:updateCategory", oldCategory);
        handleCategoryUpdate(oldCategory);
      },
    });
  };

  const deleteCategory = (category: category) => {
    storage.do({
      fw: () => {
        storage.repertoireSocket?.emit("repertoire:deleteCategory", category.id);
        handleCategoryDelete(category.id);
      },
      rv: () => {
        storage.repertoireSocket?.emit("repertoire:addCategory", category);
        handleCategoryCreate(category);
      },
    });
  };

  const setColors = (
    categoryId: string,
    colors: { [key: string]: string },
    colorsBefore: { [key: string]: string } | undefined
  ) => {
    storage.do({
      fw: () => {
        storage.repertoireSocket?.emit("repertoire:setColors", {
          categoryId,
          colors,
        });
        handleColorUpdate({ categoryId, colors });
      },
      rv: () => {
        if (colorsBefore === undefined) {
          storage.repertoireSocket?.emit("repertoire:deleteColors", categoryId);
          handleColorDelete(categoryId);
        } else {
          storage.repertoireSocket?.emit("repertoire:setColors", {
            categoryId,
            colors: colorsBefore,
          });
          handleColorUpdate({ categoryId, colors: colorsBefore });
        }
      },
    });
  };

  const deleteColors = (categoryId: string, colors: { [key: string]: string }) => {
    storage.do({
      fw: () => {
        storage.repertoireSocket?.emit("repertoire:deleteColors", categoryId);
        handleColorDelete(categoryId);
      },
      rv: () => {
        storage.repertoireSocket?.emit("repertoire:setColors", {
          categoryId,
          colors,
        });
        handleColorUpdate({ categoryId, colors });
      },
    });
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
                  editCategory(
                    {
                      ...category,
                      show: checked as boolean,
                    },
                    category
                  )
                }
              />
            </div>
            <div className="flex flex-row justify-between items-center">
              Colors:
              <ButtonGroup>
                {!!colors && ColorsGradient(category)}
                {type === "multipleStringCategory" ? (
                  <Tooltip>
                    <TooltipTrigger asChild className="disabled:pointer-events-auto">
                      <Button variant={"secondary"} disabled>
                        <Palette />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Colors currently aren't supported for this cateogry type.</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    onClick={() => {
                      setColorCategory(category);
                    }}
                    variant={"secondary"}
                    className="border"
                  >
                    <Palette />
                  </Button>
                )}
                {!!colors && (
                  <Button
                    onClick={() => {
                      deleteColors(id, colors);
                    }}
                    variant={"secondary"}
                    className="hover:bg-red-600/80 border"
                  >
                    <Trash2 />
                  </Button>
                )}
              </ButtonGroup>
            </div>
            <Button
              className="w-full hover:bg-red-600/80 border"
              variant={"secondary"}
              onClick={() => deleteCategory(category)}
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
        className="w-full flex flex-col justify-center items-center border-dashed hover:bg-gray-800 hover:cursor-pointer"
      >
        <Plus />
      </Card>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-gray-950 relative">
      <Header
        showUndoRedo
        backButton={
          <Link to="/" className="pr-4">
            <ArrowLeft size={30} />
          </Link>
        }
        onLogin={(loggedIn) => !loggedIn && backToMainPage()}
      />
      <div className="flex flex-col gap-8 pt-8 px-5 lg:px-30">
        <div className="font-bold text-2xl">Your Repertoire:</div>
        <RepertoireTable categories={categories || []} />
        <div className="flex flex-col gap-6">
          <div className="font-bold text-2xl">Your Custom Categories:</div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {categories?.map(CategoryCard)}
            <AddCategoryCard />
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-60">
          <FolderInput /> Import / Export Repertoire
        </Button>
        <div />
      </div>
      {dialogOpen && (
        <RepertoireImportExportCard
          onRepertoireChange={() => {
            refetchUserData();
            storage.repertoireSocket?.emit("repertoire");
          }}
          onClose={() => setDialogOpen(false)}
        />
      )}
      {newCategoryDialogOpen && (
        <NewCategoryCard onClose={() => setNewCategoryDialogOpen(false)} onFinish={addCategory} />
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
