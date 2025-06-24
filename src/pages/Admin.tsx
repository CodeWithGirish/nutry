import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Analytics from "@/components/Analytics";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Package,
  Users,
  ShoppingCart,
  Mail,
  FileText,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  Eye,
  TrendingUp,
  DollarSign,
  Send,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, type Product, type Order } from "@/lib/supabase";
import { sendOrderConfirmationEmail, sendOrderShippedEmail } from "@/lib/email";
import { parsePrices, formatPrice } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("30d");

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    image_url: "🥜",
    images: [] as string[],
    prices: [{ weight: "250g", price: 0 }],
    original_price: null as number | null,
    is_organic: false,
    in_stock: true,
    features: [] as string[],
  });

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchData();
  }, [user, isAdmin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchReviews(),
        fetchStats(),
      ]);
    } catch (error: any) {
      console.error("Error fetching data:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setProducts(data || []);
  };

  const fetchOrders = async () => {
    try {
      // First fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items(*)
        `,
        )
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Get unique user IDs to fetch user details
      const userIds = [
        ...new Set((ordersData || []).map((order) => order.user_id)),
      ];

      let usersData: any[] = [];
      if (userIds.length > 0) {
        try {
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

          if (!userError) {
            usersData = userData || [];
          }
        } catch (userFetchError) {
          console.warn(
            "Could not fetch user profiles for orders:",
            userFetchError,
          );
        }
      }

      // Create user map for efficient lookup
      const userMap = usersData.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      // Enrich orders with user data
      const enrichedOrders = (ordersData || []).map((order: any) => ({
        ...order,
        user_name: userMap[order.user_id]?.full_name || "Guest User",
        user_email: userMap[order.user_id]?.email || "",
      }));

      setOrders(enrichedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Set empty array as fallback
      setOrders([]);
    }
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("product_reviews")
      .select(
        `
        *,
        products(name),
        profiles(full_name, email)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    setReviews(data || []);
  };

  const fetchStats = async () => {
    // Fetch total orders
    const { count: ordersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    // Fetch total revenue
    const { data: revenueData } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("payment_status", "paid");

    const totalRevenue =
      revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) ||
      0;

    // Fetch total products
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Fetch total customers
    const { count: customersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    setStats({
      totalOrders: ordersCount || 0,
      totalRevenue,
      totalProducts: productsCount || 0,
      totalCustomers: customersCount || 0,
    });
  };

  const handleAddProduct = async () => {
    try {
      const productData = {
        ...newProduct,
        images: newProduct.images,
        features: newProduct.features.filter((f) => f.trim()),
      };

      const { data, error } = await supabase
        .from("products")
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      setProducts([data, ...products]);
      setIsAddProductOpen(false);
      setNewProduct({
        name: "",
        description: "",
        category: "",
        image_url: "🥜",
        images: [],
        prices: [{ weight: "250g", price: 0 }],
        original_price: null,
        is_organic: false,
        in_stock: true,
        features: [],
      });

      toast({
        title: "Product added successfully!",
        description: "The new product has been added to your inventory.",
      });
    } catch (error: any) {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .update(editingProduct)
        .eq("id", editingProduct.id)
        .select()
        .single();

      if (error) throw error;

      setProducts(products.map((p) => (p.id === editingProduct.id ? data : p)));
      setEditingProduct(null);

      toast({
        title: "Product updated successfully!",
        description: "The product has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      setProducts(products.filter((p) => p.id !== productId));

      toast({
        title: "Product deleted successfully!",
        description: "The product has been removed from your inventory.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );

      // Send email notification for status changes
      if (status === "shipped") {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          await sendOrderShippedEmail(
            orderId,
            // @ts-ignore
            order.profiles?.email,
            order,
          );
        }
      }

      toast({
        title: "Order status updated!",
        description: `Order has been marked as ${status}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportOrdersToCSV = () => {
    const csvContent = [
      [
        "Order ID",
        "Customer",
        "Email",
        "Total",
        "Status",
        "Payment Method",
        "Date",
      ],
      ...orders.map((order) => [
        order.id,
        // @ts-ignore
        order.profiles?.full_name || "N/A",
        // @ts-ignore
        order.profiles?.email || "N/A",
        order.total_amount,
        order.status,
        order.payment_method,
        new Date(order.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const addPriceVariant = (type: "new" | "edit") => {
    if (type === "new") {
      setNewProduct({
        ...newProduct,
        prices: [...newProduct.prices, { weight: "", price: 0 }],
      });
    } else if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        prices: [...editingProduct.prices, { weight: "", price: 0 }],
      });
    }
  };

  const removePriceVariant = (index: number, type: "new" | "edit") => {
    if (type === "new") {
      setNewProduct({
        ...newProduct,
        prices: newProduct.prices.filter((_, i) => i !== index),
      });
    } else if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        prices: editingProduct.prices.filter((_, i) => i !== index),
      });
    }
  };

  const updatePriceVariant = (
    index: number,
    field: "weight" | "price",
    value: string | number,
    type: "new" | "edit",
  ) => {
    if (type === "new") {
      const updatedPrices = [...newProduct.prices];
      updatedPrices[index] = { ...updatedPrices[index], [field]: value };
      setNewProduct({ ...newProduct, prices: updatedPrices });
    } else if (editingProduct) {
      const updatedPrices = [...editingProduct.prices];
      updatedPrices[index] = { ...updatedPrices[index], [field]: value };
      setEditingProduct({ ...editingProduct, prices: updatedPrices });
    }
  };

  const addFeature = (type: "new" | "edit") => {
    if (type === "new") {
      setNewProduct({
        ...newProduct,
        features: [...newProduct.features, ""],
      });
    } else if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        features: [...editingProduct.features, ""],
      });
    }
  };

  const updateFeature = (
    index: number,
    value: string,
    type: "new" | "edit",
  ) => {
    if (type === "new") {
      const updatedFeatures = [...newProduct.features];
      updatedFeatures[index] = value;
      setNewProduct({ ...newProduct, features: updatedFeatures });
    } else if (editingProduct) {
      const updatedFeatures = [...editingProduct.features];
      updatedFeatures[index] = value;
      setEditingProduct({ ...editingProduct, features: updatedFeatures });
    }
  };

  const removeFeature = (index: number, type: "new" | "edit") => {
    if (type === "new") {
      setNewProduct({
        ...newProduct,
        features: newProduct.features.filter((_, i) => i !== index),
      });
    } else if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        features: editingProduct.features.filter((_, i) => i !== index),
      });
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your store, products, and orders
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Badge className="bg-purple-100 text-purple-800 text-lg px-4 py-2">
              Admin Panel
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalOrders}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-brand-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalProducts}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalCustomers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Analytics timeRange={timeRange} />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Management</CardTitle>
                <Dialog
                  open={isAddProductOpen}
                  onOpenChange={setIsAddProductOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-brand-600 hover:bg-brand-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Product Name</Label>
                          <Input
                            id="name"
                            value={newProduct.name}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                name: e.target.value,
                              })
                            }
                            placeholder="Premium Almonds"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={newProduct.category}
                            onValueChange={(value) =>
                              setNewProduct({
                                ...newProduct,
                                category: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Nuts">Nuts</SelectItem>
                              <SelectItem value="Dried Fruits">
                                Dried Fruits
                              </SelectItem>
                              <SelectItem value="Seeds">Seeds</SelectItem>
                              <SelectItem value="Trail Mix">
                                Trail Mix
                              </SelectItem>
                              <SelectItem value="Dates">Dates</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newProduct.description}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              description: e.target.value,
                            })
                          }
                          placeholder="Describe your product..."
                          rows={3}
                        />
                      </div>

                      {/* Image Upload */}
                      <ImageUpload
                        onImagesChange={(images) =>
                          setNewProduct({
                            ...newProduct,
                            images,
                            image_url: images[0] || "🥜",
                          })
                        }
                        existingImages={newProduct.images}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="originalPrice">
                            Original Price (Optional)
                          </Label>
                          <Input
                            id="originalPrice"
                            type="number"
                            step="0.01"
                            value={newProduct.original_price || ""}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                original_price: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              })
                            }
                            placeholder="29.99"
                          />
                        </div>
                      </div>

                      {/* Price Variants */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Price Variants</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addPriceVariant("new")}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Variant
                          </Button>
                        </div>
                        {newProduct.prices.map((price, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Input
                              placeholder="250g"
                              value={price.weight}
                              onChange={(e) =>
                                updatePriceVariant(
                                  index,
                                  "weight",
                                  e.target.value,
                                  "new",
                                )
                              }
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="24.99"
                              value={price.price || ""}
                              onChange={(e) =>
                                updatePriceVariant(
                                  index,
                                  "price",
                                  parseFloat(e.target.value) || 0,
                                  "new",
                                )
                              }
                              className="flex-1"
                            />
                            {newProduct.prices.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removePriceVariant(index, "new")}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Features */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Product Features</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addFeature("new")}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Feature
                          </Button>
                        </div>
                        {newProduct.features.map((feature, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Input
                              placeholder="e.g., Organic certified"
                              value={feature}
                              onChange={(e) =>
                                updateFeature(index, e.target.value, "new")
                              }
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFeature(index, "new")}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="organic"
                            checked={newProduct.is_organic}
                            onCheckedChange={(checked) =>
                              setNewProduct({
                                ...newProduct,
                                is_organic: !!checked,
                              })
                            }
                          />
                          <Label htmlFor="organic">Organic</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="inStock"
                            checked={newProduct.in_stock}
                            onCheckedChange={(checked) =>
                              setNewProduct({
                                ...newProduct,
                                in_stock: !!checked,
                              })
                            }
                          />
                          <Label htmlFor="inStock">In Stock</Label>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleAddProduct}
                          className="bg-brand-600 hover:bg-brand-700"
                          disabled={!newProduct.name || !newProduct.description}
                        >
                          Add Product
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddProductOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Products Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price Range</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {product.image_url}
                              </span>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-500">
                                  {product.description.substring(0, 50)}...
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>
                            $
                            {Math.min(
                              ...parsePrices(product.prices).map(
                                (p) => p.price,
                              ),
                            )}{" "}
                            - $
                            {Math.max(
                              ...parsePrices(product.prices).map(
                                (p) => p.price,
                              ),
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{product.rating}</span>
                              <span className="text-xs text-gray-500">
                                ({product.review_count})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                product.in_stock
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }
                            >
                              {product.in_stock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingProduct(product)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Order Management</CardTitle>
                <Button onClick={exportOrdersToCSV} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            {order.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {/* @ts-ignore */}
                            <div>
                              <p className="font-medium">
                                {/* @ts-ignore */}
                                {order.profiles?.full_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {/* @ts-ignore */}
                                {order.profiles?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.order_items?.length || 0} items
                          </TableCell>
                          <TableCell>
                            ${order.total_amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                order.payment_status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : order.payment_status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }
                            >
                              {order.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) =>
                                updateOrderStatus(order.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">
                                  Confirmed
                                </SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">
                                  Delivered
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {review.profiles?.full_name}
                            </h4>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {/* @ts-ignore */}
                            Product: {review.products?.name}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <h5 className="font-medium mb-1">{review.title}</h5>
                      )}
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">
                      Notification Settings
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="emailNotifications" defaultChecked />
                        <Label htmlFor="emailNotifications">
                          Email notifications for new orders
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="smsNotifications" />
                        <Label htmlFor="smsNotifications">
                          SMS notifications for urgent orders
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="restockNotifications" defaultChecked />
                        <Label htmlFor="restockNotifications">
                          Send restock notifications to customers
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4">Store Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input id="storeName" defaultValue="NutriVault" />
                      </div>
                      <div>
                        <Label htmlFor="storeEmail">Contact Email</Label>
                        <Input
                          id="storeEmail"
                          defaultValue="info@nutrivault.com"
                          type="email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="storePhone">Phone Number</Label>
                        <Input
                          id="storePhone"
                          defaultValue="+1 (555) 123-4567"
                          type="tel"
                        />
                      </div>
                      <div>
                        <Label htmlFor="storeAddress">Address</Label>
                        <Input
                          id="storeAddress"
                          defaultValue="123 Health Street, Los Angeles, CA 90210"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4">Payment Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="stripeEnabled" defaultChecked />
                        <Label htmlFor="stripeEnabled">
                          Enable Stripe payments
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="codEnabled" defaultChecked />
                        <Label htmlFor="codEnabled">
                          Enable Cash on Delivery
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button className="bg-brand-600 hover:bg-brand-700">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
