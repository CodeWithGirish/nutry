import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  Shield,
  Package,
  Heart,
  Edit,
  Save,
  X,
  RotateCcw,
  ShoppingCart,
  MapPin,
  Calendar,
  Star,
  CheckCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items?: any[];
}

const Profile = () => {
  const { user, profile, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const { getWishlistCount } = useWishlist();
  const navigate = useNavigate();

  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  // Dynamic data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      setEditForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
      fetchUserData();
    }
  }, [user, profile]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          status,
          total_amount,
          created_at,
          order_items(*)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
      } else {
        setOrders(ordersData || []);

        // Calculate stats
        const totalSpent = (ordersData || []).reduce(
          (sum, order) => sum + order.total_amount,
          0,
        );

        setStats({
          totalOrders: ordersData?.length || 0,
          totalSpent,
          wishlistCount: getWishlistCount(),
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          address: editForm.address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });

      setIsEditing(false);
      // Refresh auth context to get updated profile
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (order: Order) => {
    if (!order.order_items || order.order_items.length === 0) {
      toast({
        title: "Cannot reorder",
        description: "No items found in this order",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add all items from the order to cart
      for (const item of order.order_items) {
        await addToCart(
          item.product_id,
          item.weight,
          item.price,
          item.quantity,
        );
      }

      toast({
        title: "Items added to cart",
        description: `${order.order_items.length} items from order #${order.order_number} have been added to your cart`,
      });

      navigate("/cart");
    } catch (error) {
      console.error("Error reordering:", error);
      toast({
        title: "Error",
        description: "Failed to add items to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Please Sign In
            </h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to view your profile and order history.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="bg-brand-600 hover:bg-brand-700"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-brand-600" />
                    </div>
                    <h3 className="font-semibold text-lg">
                      {profile?.full_name || "User"}
                    </h3>
                    {isAdmin && (
                      <Badge className="bg-purple-100 text-purple-700 mt-2">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{profile?.email}</span>
                      </div>
                      {profile?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{profile.phone}</span>
                        </div>
                      )}
                      {profile?.address && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{profile.address}</span>
                        </div>
                      )}

                      <Button
                        onClick={() => setIsEditing(true)}
                        className="w-full bg-brand-600 hover:bg-brand-700"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={editForm.full_name}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              full_name: e.target.value,
                            })
                          }
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={editForm.address}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              address: e.target.value,
                            })
                          }
                          placeholder="Enter your address"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleEditProfile}
                          disabled={saving}
                          className="flex-1 bg-brand-600 hover:bg-brand-700"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setEditForm({
                              full_name: profile?.full_name || "",
                              phone: profile?.phone || "",
                              address: profile?.address || "",
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Account Overview */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                      <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <Package className="h-8 w-8 text-brand-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {stats.totalOrders}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Orders
                        </div>
                      </div>
                      <div className="text-center">
                        <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {stats.wishlistCount}
                        </div>
                        <div className="text-sm text-gray-600">
                          Wishlist Items
                        </div>
                      </div>
                      <div className="text-center">
                        <Badge className="h-8 w-8 rounded-full bg-green-100 text-green-600 mx-auto mb-2 flex items-center justify-center">
                          ₹
                        </Badge>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(stats.totalSpent)}
                        </div>
                        <div className="text-sm text-gray-600">Total Spent</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Orders</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/track-order")}
                    >
                      View All Orders
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                      <span className="ml-2 text-gray-600">
                        Loading orders...
                      </span>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No orders yet</p>
                      <Button
                        className="bg-brand-600 hover:bg-brand-700"
                        onClick={() => navigate("/products")}
                      >
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:border-brand-200 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-brand-600" />
                            </div>
                            <div>
                              <p className="font-medium">
                                #{order.order_number}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatDate(order.created_at)} •{" "}
                                {order.order_items?.length || 0} items
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-medium">
                                {formatPrice(order.total_amount)}
                              </p>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `/track-order?order=${order.order_number}`,
                                  )
                                }
                              >
                                Track
                              </Button>
                              {order.status === "delivered" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReorder(order)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Reorder
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2"
                      onClick={() => navigate("/products")}
                    >
                      <ShoppingCart className="h-6 w-6" />
                      <span className="text-sm">Shop Now</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2"
                      onClick={() => navigate("/wishlist")}
                    >
                      <Heart className="h-6 w-6" />
                      <span className="text-sm">Wishlist</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2"
                      onClick={() => navigate("/track-order")}
                    >
                      <Package className="h-6 w-6" />
                      <span className="text-sm">Track Orders</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2"
                      onClick={() => navigate("/contact")}
                    >
                      <Mail className="h-6 w-6" />
                      <span className="text-sm">Support</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
