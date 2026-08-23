import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | "auto";
  fallback?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  imageClassName,
  aspectRatio = "square",
  fallback = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, [src]);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    auto: "",
  };

  const imageSrc = error && fallback ? fallback : src || fallback;

  return (
    <div className={cn("relative overflow-hidden bg-card/40", aspectClasses[aspectRatio], className)}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 z-10 h-full w-full animate-pulse bg-muted/40" />
      )}

      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          "h-full w-full object-cover max-w-full transition-all duration-700",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
          imageClassName
        )}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        loading={props.loading || "lazy"}
        decoding="async"
        {...props}
      />
    </div>
  );
}
