import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Link } from "react-router";

export type SetlistCardProps = {
  id: string;
  name: string;
  sets: number;
  onDelete: () => void;
};

export default function SetlistCard({
  onDelete,
  id,
  name,
  sets,
}: SetlistCardProps) {
  return (
    <Card key={id} className="flex flex-col justify-between">
      <CardHeader className="text-2xl">
        <CardTitle>{name}</CardTitle>
        <CardAction>
          <Button
            onClick={onDelete}
            variant={"secondary"}
            className="hover:bg-red-600/80"
          >
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex flex-col items-start gap-4">
        {sets} sets
        <Link className="w-full" to={`/editSetlist/${id}`}>
          <Button className="w-full">Edit Setlist</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
