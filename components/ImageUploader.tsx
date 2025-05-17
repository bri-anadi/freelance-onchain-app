// components/ImageUploader.tsx

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onChange, disabled = false }: ImageUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image and under 5MB
      if (!file.type.startsWith('image/')) {
        console.error('File must be an image');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        console.error('File size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Notify parent component
      onChange(file);
    }
  };

  const handleUploadClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    if (disabled) return;

    setImagePreview(null);
    onChange(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`mt-4 ${disabled ? 'opacity-70' : ''}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />

      {!imagePreview ? (
        <div
          className={`border-2 border-dashed rounded-md p-6 text-center ${
            disabled ? 'cursor-not-allowed bg-muted/20' : 'cursor-pointer hover:bg-muted/50'
          } transition-colors`}
          onClick={handleUploadClick}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Upload proof of completed work (PNG, JPG)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Images help with AI verification of your work
          </p>
        </div>
      ) : (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Evidence"
            className="max-h-48 mx-auto rounded-md"
          />
          {!disabled && (
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
