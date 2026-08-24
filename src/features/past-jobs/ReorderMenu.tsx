import { GripVerticalIcon } from "lucide-react";
import { useState } from "react";

import { useFieldArrayValue } from "@lib/react";
import { cn } from "@src/utils";
import { useFormInstance } from "./context";

type ReorderMenuProps = {
  onMove: (fromIndex: number, toIndex: number) => void;
};

export function ReorderMenu({ onMove }: ReorderMenuProps) {
  const form = useFormInstance();

  const [dragIndex, setDragIndex] = useState<number>(-1);
  const [dropIndex, setDropIndex] = useState<number>(-1);

  const pastJobs = useFieldArrayValue({
    form,
    name: "pastJobs",
  });

  const handleDragStart = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));

    setDragIndex(index);
  };

  const handleDragOver = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    setDropIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(-1);
    setDropIndex(-1);
  };

  const handleDrop = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const fromIndex = Number(event.dataTransfer.getData("text/plain"));

    if (Number.isNaN(fromIndex)) {
      return;
    }

    onMove(fromIndex, index);
    handleDragEnd();
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto peer">
      {pastJobs.map((pastJob, index) => {
        const isDropTarget = dropIndex === index && dragIndex !== index;
        const dropIndicatorClass =
          dragIndex < dropIndex
            ? "border-b-primary"
            : ["border-t-primary", index === 0 && "pt-1.5"];

        return (
          <div
            key={pastJob.id}
            className={cn(
              "pb-1.5 border-b border-t border-transparent",
              isDropTarget && dropIndicatorClass,
            )}
          >
            <div
              className="p-2 rounded-md bg-black/20 flex items-center gap-2"
              draggable
              onDragStart={handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver(index)}
              onDrop={handleDrop(index)}
            >
              <div
                aria-label="Drag to reorder"
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              >
                <GripVerticalIcon className="size-5" />
              </div>

              <p className="text-base">{pastJob.companyName}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
