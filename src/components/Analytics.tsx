import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Eye,
  Heart,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AnalyticsProps {
  timeRange: string;
}

const Analytics = ({ timeRange }: AnalyticsProps) => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [orderData, setOrderData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    orderGrowth: 0,
    avgOrderValue: 0,
    avgOrderGrowth: 0,
    customerCount: 0,
    customerGrowth: 0,
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      console.log("Starting analytics data fetch...");

      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        fetchRevenueData(),
        fetchOrderData(),
        fetchProductData(),
        fetchCategoryData(),
        fetchStats(),
      ]);

      // Log any failures but don't break the entire analytics
      const failedFetches = results.filter(
        (result) => result.status === "rejected",
      );
      if (failedFetches.length > 0) {
        console.warn(
          `${failedFetches.length} analytics fetches failed, using fallback data`,
        );
      } else {
        console.log("All analytics data fetched successfully");
      }
    } catch (error: any) {
      console.error("Error fetching analytics:", error.message || error);
      // Analytics will show fallback data from individual fetch functions
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      // Get last 30 days of order data to calculate daily revenue
      const { data: orders, error } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch product data:", error);
        throw new Error("Database connection failed");
      }

      // Group orders by date and calculate daily revenue
      const dailyRevenue: Record<string, { revenue: number; orders: number }> =
        {};

      (orders || []).forEach((order) => {
        const date = new Date(order.created_at).toISOString().split("T")[0];
        if (!dailyRevenue[date]) {
          dailyRevenue[date] = { revenue: 0, orders: 0 };
        }
        dailyRevenue[date].revenue += order.total_amount || 0;
        dailyRevenue[date].orders += 1;
      });

      // Fill in missing dates with zero values and format for chart
      const formattedData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split("T")[0];
        const dayData = dailyRevenue[dateKey] || { revenue: 0, orders: 0 };

        formattedData.push({
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue: dayData.revenue,
          orders: dayData.orders,
          customers: Math.floor(dayData.orders * 0.8), // Estimate customers
        });
      }

      setRevenueData(formattedData);
      console.log("Revenue data fetched successfully:", formattedData.length);
    } catch (error: any) {
      console.error("Failed to fetch revenue data:", error);
      setRevenueData([]);
    }
  };

  const fetchOrderData = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("status");

      if (error) {
        console.error("Failed to fetch order data:", error);
        setOrderData([]);
        return;
      }

      // Count orders by status
      const statusCounts = (orders || []).reduce(
        (acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const orderStatuses = [
        { name: "Pending", value: statusCounts.pending || 0, color: "#fbbf24" },
        {
          name: "Confirmed",
          value: statusCounts.confirmed || 0,
          color: "#3b82f6",
        },
        { name: "Shipped", value: statusCounts.shipped || 0, color: "#8b5cf6" },
        {
          name: "Delivered",
          value: statusCounts.delivered || 0,
          color: "#10b981",
        },
        {
          name: "Cancelled",
          value: statusCounts.cancelled || 0,
          color: "#ef4444",
        },
      ];

      setOrderData(orderStatuses);
      console.log("Order status data fetched successfully");
    } catch (error: any) {
      console.error("Failed to fetch order data:", error);
      setOrderData([]);
    }
  };

  const fetchProductData = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("name, category, rating, review_count")
        .order("review_count", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Failed to fetch product data:", error);
        throw new Error("Database connection failed");
      }

      const formattedData = (data || []).map((product) => ({
        name: product.name.substring(0, 20) + "...",
        sales: 0, // Real sales data would come from order_items table
        revenue: 0, // Real revenue data would come from order_items table
        rating: product.rating,
        reviews: product.review_count,
      }));

      setProductData(formattedData);
      console.log("Product data fetched successfully:", formattedData.length);
    } catch (error: any) {
      console.error("Failed to fetch product data:", error);
      setProductData([]);
    }
  };

  const fetchCategoryData = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .order("category");

      if (error) {
        console.error("Failed to fetch category data:", error);
        throw new Error("Database connection failed");
      }

      // Count products per category
      const categoryCount = (data || []).reduce(
        (acc: Record<string, number>, product) => {
          acc[product.category] = (acc[product.category] || 0) + 1;
          return acc;
        },
        {},
      );

      const colors = [
        "#e8914c",
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#06b6d4",
        "#84cc16",
      ];

      const formattedData = Object.entries(categoryCount).map(
        ([category, count], index) => ({
          name: category,
          products: count,
          sales: 0, // Real sales data would come from order analysis
          revenue: 0, // Real revenue data would come from order analysis
          color: colors[index % colors.length],
        }),
      );

      setCategoryData(formattedData);
      console.log("Category data fetched successfully:", formattedData.length);
    } catch (error: any) {
      console.error("Failed to fetch category data:", error);
      setCategoryData([]);
    }
  };

  const fetchStats = async () => {
    try {
      console.log("Fetching analytics stats...");

      // Fetch current period stats with error handling
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        );

      if (ordersError) {
        console.warn("Error fetching orders for stats:", ordersError);
      }

      const { count: customerCount, error: customerError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "user");

      if (customerError) {
        console.warn("Error fetching customer count:", customerError);
      }

      // Calculate stats from available data
      const totalRevenue =
        !ordersError && orders
          ? orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
          : 0;

      const totalOrders = !ordersError && orders ? orders.length : 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Use actual customer count
      const actualCustomerCount = !customerError ? customerCount || 0 : 0;

      // Real growth calculations would require historical data comparison
      setStats({
        totalRevenue,
        revenueGrowth: 0, // Real growth calculation would compare with previous period
        totalOrders,
        orderGrowth: 0, // Real growth calculation would compare with previous period
        avgOrderValue,
        avgOrderGrowth: 0, // Real growth calculation would compare with previous period
        customerCount: actualCustomerCount,
        customerGrowth: 0, // Real growth calculation would compare with previous period
      });

      console.log("Analytics stats fetched successfully");
    } catch (error: any) {
      console.error("Error fetching analytics stats:", error.message || error);
      setStats({
        totalRevenue: 0,
        revenueGrowth: 0,
        totalOrders: 0,
        orderGrowth: 0,
        avgOrderValue: 0,
        avgOrderGrowth: 0,
        customerCount: 0,
        customerGrowth: 0,
      });
    }
  };

  const StatCard = ({
    title,
    value,
    growth,
    icon: Icon,
    format = "currency",
  }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {format === "currency"
                ? `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : format === "number"
                  ? value.toLocaleString()
                  : value}
            </p>
            <div className="flex items-center mt-1">
              {growth > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span
                className={`text-sm ${growth > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {Math.abs(growth)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          </div>
          <Icon className="h-8 w-8 text-brand-600" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          growth={stats.revenueGrowth}
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          growth={stats.orderGrowth}
          icon={ShoppingCart}
          format="number"
        />
        <StatCard
          title="Average Order Value"
          value={stats.avgOrderValue}
          growth={stats.avgOrderGrowth}
          icon={TrendingUp}
          format="currency"
        />
        <StatCard
          title="Total Customers"
          value={stats.customerCount}
          growth={stats.customerGrowth}
          icon={Users}
          format="number"
        />
      </div>

      {/* Revenue and Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Orders Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#e8914c"
                strokeWidth={3}
                name="Revenue (₹)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {orderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#e8914c" name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productData.slice(0, 5).map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{product.name}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600">
                      Sales: {product.sales}
                    </span>
                    <span className="text-sm text-gray-600">
                      Revenue: ₹{product.revenue.toLocaleString("en-IN")}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{product.rating}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < Math.floor(product.rating)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        ({product.reviews})
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-brand-100 text-brand-700">
                  #{index + 1}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
