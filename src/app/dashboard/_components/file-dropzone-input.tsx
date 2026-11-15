import { cn } from "@/lib/utils";
import { UploadCloudIcon } from "lucide-react";
import { DragEvent, useRef, useState } from "react";
import { UseFormSetValues } from "react-hook-form";

export default function FileDropZoneInput({
  refetch,
  setValues,
}: {
  refetch: () => void;
  setValues: UseFormSetValues<{
    amount: string;
    type: "income" | "expense";
    category: string;
    date: string;
    description: string;
  }>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer?.files.length > 0) {
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all",
        isDragging
          ? `border-primary bg-primary/10 scale-[1.02]`
          : `border-muted hover:border-primary/50 hover:bg-muted/50`,
      )}
    >
      <input type="file" ref={fileInputRef} className="hidden" />
      <div className="flex flex-col items-center gap-2">
        <UploadCloudIcon
          className={cn(
            "size-8",
            isDragging ? "text-primary" : "text-muted-foreground",
          )}
        />
        <div className="space-y-1 text-center">
          <p className="text-xl font-medium"> Drag and Drop Recepit Here</p>
          <p className="text-xs text-muted-foreground">or Click to browse</p>
        </div>
      </div>
    </div>
  );
}
