import type { category } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";

export type EditCategoryCardProps = {
  category: category;
  onFinish: (category: category, categoryOld: category) => void;
  onClose: () => void;
};

export default function EditCategoryCard({ category, onFinish, onClose }: EditCategoryCardProps) {
  const { id, title } = category;
  const [name, setName] = useState(title);
  return (
    <Card className="z-10 bg-gray-900 w-sm fixed top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>Edit Category</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full grid grid-cols-2">
          <span>Name:</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full flex flex-col gap-2">
          <Button
            onClick={() => {
              onFinish({ ...category, title: name }, category);
              onClose();
            }}
            className="w-full"
          >
            Finish
          </Button>
          <Button onClick={onClose} className="w-full" variant={"secondary"}>
            Cancel
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
