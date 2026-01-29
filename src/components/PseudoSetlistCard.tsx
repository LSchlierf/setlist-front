import { Plus } from "lucide-react";
import { Card } from "./ui/card";

export type PseudoSetlistCard = {
  onClick: () => void;
};

export default function PseudoSetlistCard({ onClick }: PseudoSetlistCard) {
  return (
    <Card
      className=" min-h-50 flex flex-col justify-center items-center border-dashed hover:bg-gray-800/50 hover:cursor-pointer"
      onClick={onClick}
    >
      <Plus />
    </Card>
  );
}
