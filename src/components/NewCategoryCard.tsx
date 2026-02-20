import { categoryTypeLabels, type category } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { useState } from "react";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { v4 as uuid } from "uuid";
import { Plus, Trash2 } from "lucide-react";

export type NewCategoryCardProps = {
  onFinish: (newCategory: category) => void;
  onClose: () => void;
};

export default function NewCategoryCard({
  onFinish,
  onClose,
}: NewCategoryCardProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("clear");
  const [numMin, setNumMin] = useState(0);
  const [numMax, setNumMax] = useState(10);
  const [stringValues, setStringValues] = useState<string[]>([]);
  const [currStringValue, setCurrStringValue] = useState("");

  const isValid =
    name.length > 0 &&
    (type === "booleanCategory" ||
      (type === "numberCategory" && numMin < numMax) ||
      ((type === "stringCategory" || type === "multipleStringCategory") &&
        stringValues.length > 1));

  const finish = () => {
    switch (type) {
      case "booleanCategory":
        onFinish({
          id: uuid(),
          show: true,
          title: name,
          type: type,
          valueRange: [true, false],
        });
        break;

      case "numberCategory":
        onFinish({
          id: uuid(),
          show: true,
          title: name,
          type: type,
          valueRange: [...new Array(numMax - numMin + 1)].map(
            (_, i) => numMin + i
          ),
        });
        break;

      case "stringCategory":
      case "multipleStringCategory":
        onFinish({
          id: uuid(),
          show: true,
          title: name,
          type: type,
          valueRange: stringValues,
        });
        break;
    }
    onClose();
  };

  const numValueRangeInput = () => {
    return (
      <>
        Select possible values (both inclusive)
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="newCategoryNumMin">Minimum</Label>
            <Input
              type="number"
              value={numMin}
              min={0}
              max={numMax - 1}
              onChange={(e) => setNumMin(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newCategoryNumMax">Maximun</Label>
            <Input
              type="number"
              value={numMax}
              min={numMin + 1}
              onChange={(e) => setNumMax(Number(e.target.value))}
            />
          </div>
        </div>
      </>
    );
  };

  const stringValue = (v: string) => (
    <div key={v} className="w-full flex flex-row justify-between">
      <span>{v}</span>
      <Button
        className="hover:bg-red-600/80"
        onClick={() =>
          setStringValues((stringValues) =>
            stringValues.filter((val) => val !== v)
          )
        }
      >
        <Trash2 />
      </Button>
    </div>
  );

  const stringValueRangeInput = () => {
    return (
      <div className="w-full flex flex-col gap-2">
        Add possible values:
        {stringValues.map(stringValue)}
        <form
          className="w-full flex flex-row gap-2 justify-between"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Input
            value={currStringValue}
            onChange={(e) => {
              const newVal = e.target.value;
              setCurrStringValue(newVal);
            }}
            placeholder="value"
          />
          <Button
            onClick={() => {
              setStringValues((stringValues) => [
                ...new Set([...stringValues, currStringValue]),
              ]);
              setCurrStringValue("");
            }}
          >
            <Plus />
          </Button>
        </form>
      </div>
    );
  };

  const valueRangeInput = () => {
    switch (type) {
      case "numberCategory":
        return numValueRangeInput();
      case "stringCategory":
      case "multipleStringCategory":
        return stringValueRangeInput();
    }
    return <></>;
  };

  return (
    <Card className="z-10 bg-gray-900 w-sm fixed top-[50%] left-[50%] transform-(--center-transform)">
      <CardHeader>
        <CardTitle>Create a new Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="newCategoryName">Enter a Title (required)</Label>
            <Input
              id="newCategoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category title"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newCategoryType">Select a type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="clear">(select)</SelectItem>
                  {Object.keys(categoryTypeLabels).map((k) => (
                    <SelectItem key={k} value={k}>
                      {categoryTypeLabels[k]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {valueRangeInput()}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col gap-2 w-full">
          {isValid && (
            <Button className="w-full" onClick={finish}>
              Finish
            </Button>
          )}
          <Button className="w-full" variant={"secondary"} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
