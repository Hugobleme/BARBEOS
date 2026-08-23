import { useState } from "react";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  aspectRatio?: "square" | "video" | "photo" | "auto" | "portrait";
  fallback?: string;
}

export function Image({
  src,
  alt,
  className = "",
  imageClassName = "",
  aspectRatio = "auto",
  fallback = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    photo: "aspect-[4/3]",
    portrait: "aspect-[3/4]",
    auto: "aspect-auto",
  };

  const imageSrc = error && fallback ? fallback : src || fallback;

  return (
    <div className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        className={`w-full h-full object-cover max-w-full transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imageClassName}`}
        {...props}
      />
    </div>
  );
}
