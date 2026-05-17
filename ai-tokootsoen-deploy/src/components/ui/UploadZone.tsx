"use client";

import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  multiple?: boolean;
  previews?: string[];
  className?: string;
}

export default function UploadZone({
  onUpload,
  multiple = true,
  previews = [],
  className,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={cn(
        "group relative border-2 border-dashed rounded-card p-6 text-center cursor-pointer",
        "transition-all duration-300 ease-out overflow-hidden",
        isDragOver
          ? "border-primary-500 bg-primary-50 scale-[1.02] shadow-lg shadow-primary-500/15"
          : "border-border-light hover:border-primary-300 bg-bg-page hover:bg-primary-50/40 hover:shadow-sm",
        className
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        onUpload(files);
      }}
    >
      {/* 拖拽时的脉冲光环 */}
      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-primary-200/40 animate-pulse" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept="image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) onUpload(files);
          e.target.value = "";
        }}
      />
      <div className="relative flex flex-col items-center gap-2">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
            isDragOver
              ? "bg-primary-100 scale-110"
              : "bg-bg-card group-hover:bg-primary-50 group-hover:scale-105"
          )}
        >
          <svg
            className={cn(
              "w-6 h-6 transition-colors duration-300",
              isDragOver ? "text-primary-600" : "text-text-hint group-hover:text-primary-500"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
        <span
          className={cn(
            "text-sm transition-colors duration-300",
            isDragOver ? "text-primary-600 font-medium" : "text-text-hint group-hover:text-primary-500"
          )}
        >
          {isDragOver ? "松开以上传图片" : "点击或拖拽上传图片"}
        </span>
      </div>
      {previews.length > 0 && (
        <div className="relative flex gap-2 mt-4 flex-wrap justify-center stagger-fade">
          {previews.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="w-16 h-16 object-cover rounded-lg border border-border-light shadow-sm hover:scale-110 hover:shadow-md transition-transform duration-200"
            />
          ))}
        </div>
      )}
    </div>
  );
}
