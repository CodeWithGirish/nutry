import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

const ProductImageGallery = ({
  images,
  productName,
  className,
}: ProductImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Get all product images (handle both new images array and legacy single image)
  const productImages = images && images.length > 0 ? images : ["🥜"];

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex(
      (prev) => (prev - 1 + productImages.length) % productImages.length,
    );
  };

  const nextLightboxImage = () => {
    setLightboxIndex((prev) => (prev + 1) % productImages.length);
    setZoom(1);
  };

  const prevLightboxImage = () => {
    setLightboxIndex(
      (prev) => (prev - 1 + productImages.length) % productImages.length,
    );
    setZoom(1);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
    setZoom(1);
  };

  const currentImage = productImages[selectedImageIndex];
  const lightboxImage = productImages[lightboxIndex];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image Display */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-square bg-gradient-to-br from-warm-50 to-brand-50 flex items-center justify-center relative group">
            {/* Main Image */}
            {currentImage?.startsWith("http") ||
            currentImage?.startsWith("blob:") ? (
              <img
                src={currentImage}
                alt={productName}
                className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                onClick={() => openLightbox(selectedImageIndex)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-9xl cursor-pointer" onclick="openLightbox(${selectedImageIndex})">${currentImage}</span>`;
                  }
                }}
              />
            ) : (
              <span
                className="text-9xl cursor-pointer transition-transform hover:scale-105"
                onClick={() => openLightbox(selectedImageIndex)}
              >
                {currentImage}
              </span>
            )}

            {/* Navigation Arrows - only show if multiple images */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-white hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-white hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}

            {/* Expand Button */}
            <button
              onClick={() => openLightbox(selectedImageIndex)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-white hover:scale-110"
              aria-label="View full screen"
            >
              <Expand className="w-5 h-5 text-gray-700" />
            </button>

            {/* Image Counter */}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {selectedImageIndex + 1} of {productImages.length}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Images */}
      {productImages.length > 1 && (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-32 overflow-y-auto">
          {productImages.map((image, index) => (
            <Card
              key={index}
              className={cn(
                "cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all flex-shrink-0",
                index === selectedImageIndex
                  ? "ring-2 ring-brand-500 shadow-md"
                  : "hover:shadow-md",
              )}
              onClick={() => setSelectedImageIndex(index)}
            >
              <CardContent className="p-1">
                <div className="aspect-square bg-gradient-to-br from-warm-50 to-brand-50 rounded flex items-center justify-center overflow-hidden">
                  {image?.startsWith("http") || image?.startsWith("blob:") ? (
                    <img
                      src={image}
                      alt={`${productName} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-lg">${image}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-lg">{image}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-screen-lg w-full h-full md:h-auto md:max-h-[90vh] p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              onClick={() => setIsLightboxOpen(false)}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-2">
              <Button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <div className="text-white bg-black/50 px-3 py-1 rounded-full text-sm flex items-center">
                {Math.round(zoom * 100)}%
              </div>
              <Button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Arrows - only show if multiple images */}
            {productImages.length > 1 && (
              <>
                <Button
                  onClick={prevLightboxImage}
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12 z-50"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  onClick={nextLightboxImage}
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12 z-50"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Main Lightbox Image */}
            <div className="flex items-center justify-center w-full h-full p-8 overflow-auto">
              {lightboxImage?.startsWith("http") ||
              lightboxImage?.startsWith("blob:") ? (
                <img
                  src={lightboxImage}
                  alt={`${productName} ${lightboxIndex + 1}`}
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-9xl text-white" style="transform: scale(${zoom})">${lightboxImage}</span>`;
                    }
                  }}
                />
              ) : (
                <span
                  className="text-9xl text-white transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                >
                  {lightboxImage}
                </span>
              )}
            </div>

            {/* Image Counter */}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm z-50">
                {lightboxIndex + 1} of {productImages.length}
              </div>
            )}

            {/* Thumbnail Strip for quick navigation */}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                <div className="flex gap-2 max-w-md overflow-x-auto pb-2">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setLightboxIndex(index);
                        setZoom(1);
                      }}
                      className={cn(
                        "flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all",
                        index === lightboxIndex
                          ? "border-white ring-2 ring-brand-500"
                          : "border-white/50 hover:border-white",
                      )}
                    >
                      {image?.startsWith("http") ||
                      image?.startsWith("blob:") ? (
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-sm">
                          {image}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductImageGallery;
