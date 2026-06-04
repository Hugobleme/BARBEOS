import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "square" | "video" | "portrait" | "landscape";
  fallback?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  aspectRatio = "square",
  fallback,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };

  return (
    <div className={cn("relative overflow-hidden bg-muted", aspectClasses[aspectRatio], className)}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 z-10 h-full w-full" />
      )}
      
      <img
        src={error && fallback ? fallback : src}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
}
