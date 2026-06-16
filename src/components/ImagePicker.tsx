import { useRef, type ReactNode } from "react";

interface ImagePickerProps {
  onFile: (file: File) => void;
  children: ReactNode;
}

/** Wraps arbitrary trigger content with a hidden file input. */
export function ImagePicker({ onFile, children }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.type.startsWith("image/")) onFile(file);
          e.target.value = "";
        }}
      />
      <span onClick={() => inputRef.current?.click()} className="contents">
        {children}
      </span>
    </>
  );
}
