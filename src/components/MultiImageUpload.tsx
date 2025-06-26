import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Camera,
  Link as LinkIcon,
  X,
  Plus,
  Image as ImageIcon,
  Move,
  Edit3,
  RotateCw,
  ChevronUp,
  ChevronDown,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
  onImagesChange: (images: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
  showPrimaryBadge?: boolean;
}

const MultiImageUpload = ({
  onImagesChange,
  existingImages = [],
  maxImages = 10,
  showPrimaryBadge = true,
}: MultiImageUploadProps) => {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [emojiInput, setEmojiInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const popularEmojis = [
    "🥜",
    "🌰",
    "🍇",
    "🍑",
    "🍯",
    "🌻",
    "🥨",
    "🫐",
    "🍊",
    "🍋",
    "🍓",
    "🥭",
    "🥝",
    "🍌",
    "🍒",
    "🍈",
    "🥔",
    "🌽",
    "🫘",
    "🥥",
    "🌶️",
    "🫒",
    "🥑",
    "🍅",
    "🥒",
    "🥬",
    "🥦",
    "🧄",
    "🧅",
    "🍄",
  ];

  const updateImages = (newImages: string[]) => {
    setImages(newImages);
    onImagesChange(newImages);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can upload a maximum of ${maxImages} images.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Validate file type
          if (!file.type.startsWith("image/")) {
            throw new Error(`${file.name} is not an image file`);
          }

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`${file.name} is too large. Max size is 5MB.`);
          }

          // Create unique filename
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `product-images/${fileName}`;

          // Try to upload file to Supabase Storage
          try {
            const { data, error } = await supabase.storage
              .from("product-images")
              .upload(filePath, file);

            if (error) {
              console.warn("Supabase storage upload failed:", error.message);
              toast({
                title: "Storage Warning",
                description:
                  "Image uploaded locally. Set up Supabase storage for permanent images.",
                variant: "destructive",
              });
              return URL.createObjectURL(file);
            }

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage.from("product-images").getPublicUrl(filePath);

            return publicUrl;
          } catch (storageError) {
            console.warn(
              "Storage service unavailable, using local URL:",
              storageError,
            );
            toast({
              title: "Storage Unavailable",
              description:
                "Image stored temporarily. Set up Supabase storage for permanent images.",
              variant: "destructive",
            });
            return URL.createObjectURL(file);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          throw fileError;
        }
      });

      const uploadResults = await Promise.allSettled(uploadPromises);
      const successfulUploads: string[] = [];
      const failedUploads: string[] = [];

      uploadResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successfulUploads.push(result.value);
        } else {
          failedUploads.push(files[index].name);
        }
      });

      if (successfulUploads.length > 0) {
        const newImages = [...images, ...successfulUploads];
        updateImages(newImages);
        toast({
          title: "Images uploaded successfully",
          description: `${successfulUploads.length} image(s) uploaded.`,
        });
      }

      if (failedUploads.length > 0) {
        toast({
          title: "Some uploads failed",
          description: `Failed to upload: ${failedUploads.join(", ")}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput); // Validate URL
      const newImages = [...images, urlInput.trim()];
      updateImages(newImages);
      setUrlInput("");
      toast({
        title: "Image added",
        description: "Image URL added successfully.",
      });
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL.",
        variant: "destructive",
      });
    }
  };

  const handleEmojiAdd = () => {
    if (!emojiInput.trim()) return;
    const newImages = [...images, emojiInput.trim()];
    updateImages(newImages);
    setEmojiInput("");
    toast({
      title: "Emoji added",
      description: "Emoji added as product image.",
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    updateImages(newImages);
    setEditingIndex(null);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;

    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    updateImages(newImages);
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return; // Already primary

    const newImages = [...images];
    const [selectedImage] = newImages.splice(index, 1);
    newImages.unshift(selectedImage);
    updateImages(newImages);

    toast({
      title: "Primary image updated",
      description: "This image is now the primary product image.",
    });
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditUrl(images[index]);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;

    try {
      if (editUrl.startsWith("http")) {
        new URL(editUrl); // Validate URL
      }

      const newImages = [...images];
      newImages[editingIndex] = editUrl;
      updateImages(newImages);
      setEditingIndex(null);
      setEditUrl("");

      toast({
        title: "Image updated",
        description: "Image has been updated successfully.",
      });
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL.",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditUrl("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          Product Images ({images.length}/{maxImages})
        </Label>
        {images.length > 0 && showPrimaryBadge && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            First image is primary
          </div>
        )}
      </div>

      {/* Current Images with Enhanced Management */}
      <div className="space-y-4">
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <Card
                key={index}
                className={cn(
                  "relative overflow-hidden group",
                  index === 0 && showPrimaryBadge
                    ? "ring-2 ring-yellow-400"
                    : "",
                )}
              >
                <CardContent className="p-2">
                  <div className="aspect-square bg-gray-100 rounded flex items-center justify-center relative">
                    {/* Primary Badge */}
                    {index === 0 && showPrimaryBadge && (
                      <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded z-10">
                        <Star className="h-3 w-3 inline mr-1" />
                        Primary
                      </div>
                    )}

                    {/* Image Display */}
                    {editingIndex === index ? (
                      <div className="absolute inset-0 bg-white p-2 flex flex-col gap-2 z-20">
                        <Input
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="Image URL or emoji"
                          className="text-xs"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={saveEdit}
                            className="flex-1 text-xs"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            className="flex-1 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {image.startsWith("http") ||
                        image.startsWith("blob:") ? (
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<span class="text-4xl">${image}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <span className="text-4xl">{image}</span>
                        )}

                        {/* Action Buttons */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 z-10">
                          {/* Move up */}
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0"
                              onClick={() => moveImage(index, index - 1)}
                              title="Move up"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                          )}

                          {/* Set as primary */}
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0"
                              onClick={() => setPrimaryImage(index)}
                              title="Set as primary"
                            >
                              <Star className="h-3 w-3" />
                            </Button>
                          )}

                          {/* Edit */}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 w-6 p-0"
                            onClick={() => startEdit(index)}
                            title="Edit image"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>

                          {/* Move down */}
                          {index < images.length - 1 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0"
                              onClick={() => moveImage(index, index + 1)}
                              title="Move down"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          )}

                          {/* Remove */}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 w-6 p-0"
                            onClick={() => removeImage(index)}
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Image Button */}
        {images.length < maxImages && (
          <Dialog>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:border-brand-500 transition-colors">
                <CardContent className="p-6">
                  <div className="aspect-square bg-gray-50 rounded flex items-center justify-center min-h-[120px]">
                    <div className="text-center">
                      <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">Add Image</span>
                      <span className="text-xs text-gray-400 block mt-1">
                        {images.length === 0
                          ? "Add your first image"
                          : `${images.length} of ${maxImages} added`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Product Image</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="emoji" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="emoji">Emoji</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="camera">Camera</TabsTrigger>
                  <TabsTrigger value="url">URL</TabsTrigger>
                </TabsList>

                {/* Emoji Tab */}
                <TabsContent value="emoji" className="space-y-4">
                  <div>
                    <Label htmlFor="emoji">Choose an Emoji</Label>
                    <div className="grid grid-cols-10 gap-2 p-4 border rounded-lg max-h-48 overflow-y-auto">
                      {popularEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => setEmojiInput(emoji)}
                          className="w-10 h-10 text-2xl hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="emoji"
                      value={emojiInput}
                      onChange={(e) => setEmojiInput(e.target.value)}
                      placeholder="Or type an emoji..."
                      className="flex-1"
                    />
                    <Button onClick={handleEmojiAdd} disabled={!emojiInput}>
                      Add
                    </Button>
                  </div>
                </TabsContent>

                {/* File Upload Tab */}
                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Drag and drop images here, or click to select
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      variant="outline"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Select Images"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Max 5MB per image. Supports JPG, PNG, GIF
                    </p>
                  </div>
                </TabsContent>

                {/* Camera Tab */}
                <TabsContent value="camera" className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Take a photo with camera
                    </p>
                    <Button
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploading}
                      variant="outline"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Open Camera"}
                    </Button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </TabsContent>

                {/* URL Tab */}
                <TabsContent value="url" className="space-y-4">
                  <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="imageUrl"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1"
                      />
                      <Button onClick={handleUrlAdd} disabled={!urlInput}>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Image Management Tips */}
      {images.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Image Management Tips:
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>
              • The first image is your primary product image used on product
              cards and listings
            </li>
            <li>
              • Hover over images to access edit, reorder, and delete options
            </li>
            <li>• Use the star button to set any image as the primary image</li>
            <li>• Drag and drop or use arrow buttons to reorder images</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
