import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Category {
  name: string;
  count: number;
  description: string;
  icon: string;
  image: string;
}

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Default categories for instant display
  const defaultCategories: Category[] = [
    {
      name: "Nuts",
      count: 0,
      description: "Premium quality nuts packed with protein and healthy fats",
      icon: "🌰",
      image: "bg-gradient-to-br from-amber-100 to-orange-100",
    },
    {
      name: "Dried Fruits",
      count: 0,
      description:
        "Naturally dried fruits with concentrated flavors and nutrients",
      icon: "🍇",
      image: "bg-gradient-to-br from-purple-100 to-pink-100",
    },
    {
      name: "Mixed Nuts",
      count: 0,
      description: "Carefully curated combinations of premium nuts",
      icon: "🥜",
      image: "bg-gradient-to-br from-yellow-100 to-amber-100",
    },
    {
      name: "Seeds",
      count: 0,
      description: "Nutrient-dense seeds perfect for healthy snacking",
      icon: "🌻",
      image: "bg-gradient-to-br from-green-100 to-emerald-100",
    },
    {
      name: "Trail Mix",
      count: 0,
      description: "Energy-packed combinations for active lifestyles",
      icon: "🥨",
      image: "bg-gradient-to-br from-red-100 to-orange-100",
    },
    {
      name: "Dates",
      count: 0,
      description: "Sweet and nutritious dates from premium sources",
      icon: "🍯",
      image: "bg-gradient-to-br from-brown-100 to-amber-100",
    },
  ];

  useEffect(() => {
    // Show default categories immediately
    setCategories(defaultCategories);
    setLoading(false);

    // Load real data in background
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories from database...");

      // Add timeout for faster response
      const fetchPromise = supabase
        .from("products")
        .select("category")
        .order("category");

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Categories fetch timeout")), 5000),
      );

      const { data, error } = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.log("Failed to fetch categories, using defaults:", error);
        return;
      }

      // Count products per category
      const categoryCounts = (data || []).reduce(
        (acc: Record<string, number>, product) => {
          acc[product.category] = (acc[product.category] || 0) + 1;
          return acc;
        },
        {},
      );

      // Update categories with real counts
      const updatedCategories = defaultCategories.map((defaultCat) => ({
        ...defaultCat,
        count: categoryCounts[defaultCat.name] || 0,
      }));

      // Add any new categories not in defaults
      Object.entries(categoryCounts).forEach(([name, count]) => {
        if (!defaultCategories.find((cat) => cat.name === name)) {
          updatedCategories.push({
            name,
            count: count as number,
            description: "Premium quality products",
            icon: "📦",
            image: "bg-gradient-to-br from-gray-100 to-slate-100",
          });
        }
      });

      // Only show categories with products
      const categoriesWithProducts = updatedCategories.filter(
        (cat) => cat.count > 0,
      );

      setCategories(categoriesWithProducts);
      console.log("Categories updated with real data");
    } catch (error) {
      console.log("Error fetching categories, using defaults:", error);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const refreshCategories = () => {
    setLoading(true);
    setCategories(defaultCategories);
    setTimeout(() => {
      setLoading(false);
      fetchCategories();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-brand-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Categories</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Explore our wide range of premium dry fruits, nuts, and healthy
            snacks carefully categorized for your convenience
          </p>
          {!loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCategories}
              className="text-brand-600"
            >
              <Package className="h-4 w-4 mr-2" />
              Refresh Categories
            </Button>
          )}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              <span className="text-gray-600">Loading categories...</span>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {categories.map((category) => (
            <Card
              key={category.name}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-brand-200"
              onClick={() => handleCategoryClick(category.name)}
            >
              <CardContent className="p-6">
                <div
                  className={`${category.image} rounded-lg p-6 mb-4 text-center relative`}
                >
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {category.name}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={`bg-white/80 ${
                      category.count === 0 ? "text-gray-500" : ""
                    }`}
                  >
                    {category.count} product{category.count !== 1 ? "s" : ""}
                  </Badge>
                  {category.count === 0 && (
                    <div className="absolute inset-0 bg-gray-100/50 rounded-lg flex items-center justify-center">
                      <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>

                <Button
                  variant="ghost"
                  className={`w-full justify-between ${
                    category.count > 0
                      ? "group-hover:bg-brand-50 group-hover:text-brand-700"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  disabled={category.count === 0}
                >
                  {category.count > 0
                    ? `Explore ${category.name}`
                    : "Coming Soon"}
                  <ArrowRight
                    className={`h-4 w-4 ${
                      category.count > 0
                        ? "group-hover:translate-x-1 transition-transform"
                        : ""
                    }`}
                  />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Categories State */}
        {!loading && categories.length === 0 && (
          <Card className="p-8 text-center">
            <CardContent>
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Categories Available
              </h3>
              <p className="text-gray-600 mb-4">
                Categories will appear here once products are added to the
                database.
              </p>
              <Button
                onClick={refreshCategories}
                className="bg-brand-600 hover:bg-brand-700"
              >
                Refresh Categories
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Featured Section */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Why Choose Our Categories?
            </h2>
            <p className="text-gray-600">
              Each category is carefully curated to bring you the finest quality
              products
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Premium Quality
              </h3>
              <p className="text-sm text-gray-600">
                Hand-selected products that meet our highest quality standards
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Natural & Fresh
              </h3>
              <p className="text-sm text-gray-600">
                Naturally processed without artificial additives or
                preservatives
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Energy Packed
              </h3>
              <p className="text-sm text-gray-600">
                Rich in nutrients, vitamins, and minerals for your healthy
                lifestyle
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-gray-600 mb-6">
            Browse all our products or contact us for special requests
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate("/products")}
              className="bg-brand-600 hover:bg-brand-700"
            >
              View All Products
            </Button>
            <Button variant="outline" onClick={() => navigate("/contact")}>
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
