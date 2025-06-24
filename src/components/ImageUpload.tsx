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
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
}

const ImageUpload = ({
  onImagesChange,
  existingImages = [],
  maxImages = 5,
}: ImageUploadProps) => {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [emojiInput, setEmojiInput] = useState("");
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
    "🥥",
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

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from("product-images")
          .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedUrls];
      updateImages(newImages);

      toast({
        title: "Images uploaded successfully",
        description: `${uploadedUrls.length} image(s) uploaded.`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
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
  };

  return (
    <div className="space-y-4">
      <Label>
        Product Images ({images.length}/{maxImages})
      </Label>

      {/* Current Images */}
      <div className="grid grid-cols-3 gap-4">
        {images.map((image, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-2">
              <div className="aspect-square bg-gray-100 rounded flex items-center justify-center relative">
                {image.startsWith("http") ? (
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <span className="text-4xl">{image}</span>
                )}
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Image Button */}
        {images.length < maxImages && (
          <Dialog>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:border-brand-500 transition-colors">
                <CardContent className="p-2">
                  <div className="aspect-square bg-gray-50 rounded flex items-center justify-center">
                    <div className="text-center">
                      <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">Add Image</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
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
                    <div className="grid grid-cols-8 gap-2 p-4 border rounded-lg max-h-48 overflow-y-auto">
                      {popularEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => setEmojiInput(emoji)}
                          className="w-10 h-10 text-2xl hover:bg-gray-100 rounded flex items-center justify-center"
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
    </div>
  );
};

export default ImageUpload;
