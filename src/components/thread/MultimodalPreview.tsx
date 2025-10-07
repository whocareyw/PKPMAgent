import React from "react";
import { File, Image as ImageIcon, X as XIcon, ZoomIn } from "lucide-react";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { cn } from "@/lib/utils";
import Image from "next/image";
export interface MultimodalPreviewProps {
  block: Base64ContentBlock;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  enablePreview?: boolean;
}

export const MultimodalPreview: React.FC<MultimodalPreviewProps> = ({
  block,
  removable = false,
  onRemove,
  className,
  size = "md",
  enablePreview = true,
}) => {
  // Image block
  if (
    block.type === "image" &&
    block.source_type === "base64" &&
    typeof block.mime_type === "string" &&
    block.mime_type.startsWith("image/")
  ) {
    const url = `data:${block.mime_type};base64,${block.data}`;
    let imgClass: string = "rounded-md object-cover h-16 w-16 text-lg";
    if (size === "sm") imgClass = "rounded-md object-cover h-10 w-10 text-base";
    if (size === "lg") imgClass = "rounded-md object-cover h-24 w-24 text-xl";
    const handleImageClick = () => {
      if (enablePreview) {
        // 打开图片预览
        const event = new CustomEvent("openImagePreview", {
          detail: { src: url, alt: String(block.metadata?.name || "uploaded image") }
        });
        window.dispatchEvent(event);
      }
    };

    return (
      <div className={cn("relative inline-block group", className)}>
        <div
          className={cn("relative cursor-pointer transition-transform hover:scale-105", enablePreview && "hover:opacity-90")}
          onClick={handleImageClick}
          title={enablePreview ? "点击放大查看" : undefined}
        >
          <Image
            src={url}
            alt={String(block.metadata?.name || "uploaded image")}
            className={imgClass}
            width={size === "sm" ? 16 : size === "md" ? 32 : 48}
            height={size === "sm" ? 16 : size === "md" ? 32 : 48}
          />
          {enablePreview && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-md flex items-center justify-center">
              <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        {removable && (
          <button
            type="button"
            className="absolute top-1 right-1 z-10 rounded-full bg-gray-500 text-white hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            aria-label="Remove image"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // PDF block
  if (
    block.type === "file" &&
    block.source_type === "base64" &&
    block.mime_type === "application/pdf"
  ) {
    const filename =
      block.metadata?.filename || block.metadata?.name || "PDF file";
    return (
      <div
        className={cn(
          "relative flex items-start gap-2 rounded-md border bg-gray-100 px-3 py-2",
          className,
        )}
      >
        <div className="flex flex-shrink-0 flex-col items-start justify-start">
          <File
            className={cn(
              "text-teal-700",
              size === "sm" ? "h-5 w-5" : "h-7 w-7",
            )}
          />
        </div>
        <span
          className={cn("min-w-0 flex-1 text-sm break-all text-gray-800")}
          style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}
        >
          {String(filename)}
        </span>
        {removable && (
          <button
            type="button"
            className="ml-2 self-start rounded-full bg-gray-200 p-1 text-teal-700 hover:bg-gray-300"
            onClick={onRemove}
            aria-label="Remove PDF"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-gray-100 px-3 py-2 text-gray-500",
        className,
      )}
    >
      <File className="h-5 w-5 flex-shrink-0" />
      <span className="truncate text-xs">Unsupported file type</span>
      {removable && (
        <button
          type="button"
          className="ml-2 rounded-full bg-gray-200 p-1 text-gray-500 hover:bg-gray-300"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
