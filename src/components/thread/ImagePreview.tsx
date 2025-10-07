import React, { useCallback, useEffect, useState } from "react";
import { X, ZoomIn, Download, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = "Preview image",
  isOpen,
  onClose,
  className,
}) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  // 重置状态
  const resetState = useCallback(() => {
    setRotation(0);
    setScale(1);
  }, []);

  // 关闭预览时重置状态
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "r":
        case "R":
          setRotation((prev) => prev + 90);
          break;
        case "+":
        case "=":
          setScale((prev) => Math.min(prev + 0.1, 3));
          break;
        case "-":
        case "_":
          setScale((prev) => Math.max(prev - 0.1, 0.5));
          break;
        case "0":
          resetState();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, resetState]);

  // 旋转图片
  const handleRotate = useCallback(() => {
    setRotation((prev) => prev + 90);
  }, []);

  // 缩放图片
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  // 重置图片
  const handleReset = useCallback(() => {
    resetState();
  }, [resetState]);

  // 下载图片
  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = src;
    link.download = alt || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, alt]);

  // 点击背景关闭
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm",
        className
      )}
      onClick={handleBackdropClick}
    >
      {/* 工具栏 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-60 rounded-lg px-4 py-2">
        <button
          type="button"
          className="text-white hover:text-gray-300 transition-colors p-2 rounded-md hover:bg-white hover:bg-opacity-10"
          onClick={handleZoomOut}
          title="缩小 (-)"
        >
          <ZoomIn className="h-5 w-5 scale-x-[-1]" />
        </button>
        <span className="text-white text-sm min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          className="text-white hover:text-gray-300 transition-colors p-2 rounded-md hover:bg-white hover:bg-opacity-10"
          onClick={handleZoomIn}
          title="放大 (+)"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <div className="w-px h-6 bg-gray-400 mx-1" />
        <button
          type="button"
          className="text-white hover:text-gray-300 transition-colors p-2 rounded-md hover:bg-white hover:bg-opacity-10"
          onClick={handleRotate}
          title="旋转 (R)"
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="text-white hover:text-gray-300 transition-colors p-2 rounded-md hover:bg-white hover:bg-opacity-10"
          onClick={handleReset}
          title="重置 (0)"
        >
          <span className="text-xs">1:1</span>
        </button>
        <div className="w-px h-6 bg-gray-400 mx-1" />
        <button
          type="button"
          className="text-white hover:text-gray-300 transition-colors p-2 rounded-md hover:bg-white hover:bg-opacity-10"
          onClick={handleDownload}
          title="下载"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>

      {/* 关闭按钮 */}
      <button
        type="button"
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-10"
        onClick={onClose}
        title="关闭 (ESC)"
      >
        <X className="h-6 w-6" />
      </button>

      {/* 图片容器 */}
      <div className="flex items-center justify-center w-full h-full p-8">
        <div
          className="relative max-w-full max-h-full overflow-hidden"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: "transform 0.3s ease",
          }}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain cursor-move"
            draggable={false}
            style={{
              maxHeight: "80vh",
              maxWidth: "80vw",
            }}
          />
        </div>
      </div>

      {/* 快捷键提示 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-60 rounded px-3 py-1">
        ESC: 关闭 | +/-: 缩放 | R: 旋转 | 0: 重置
      </div>
    </div>
  );
};

// 简单的状态管理hook
export const useImagePreview = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const openPreview = useCallback((src: string, alt?: string) => {
    setImageSrc(src);
    setImageAlt(alt || "");
    setIsOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsOpen(false);
    // 延迟清理状态，避免关闭动画时状态突然变化
    setTimeout(() => {
      setImageSrc("");
      setImageAlt("");
    }, 300);
  }, []);

  return {
    isOpen,
    imageSrc,
    imageAlt,
    openPreview,
    closePreview,
  };
};