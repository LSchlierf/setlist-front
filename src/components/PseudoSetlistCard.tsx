import { Plus } from "lucide-react";
import { Card } from "./ui/card";

export type PseudoSetlistCardProps = {
  onClick: () => void;
};

export default function PseudoSetlistCard({ onClick }: PseudoSetlistCardProps) {
  return (
    <Card
      className="min-h-45 flex flex-col justify-center items-center border-dashed hover:bg-gray-800 hover:cursor-pointer"
      onClick={onClick}
    >
      <Plus />
    </Card>
  );
}
