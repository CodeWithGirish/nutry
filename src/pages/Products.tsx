import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Filter, Grid, List, Star, Package, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase, type Product } from "@/lib/supabase";
import {
  parsePrices,
  getMinPrice,
  getMaxPrice,
  formatPrice,
} from "@/lib/utils";
import { mockProducts, isDatabaseError, getErrorMessage } from "@/lib/fallback";

const Products = () => {
  const { category: categoryParam } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || categoryParam || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryFilter ? [categoryFilter] : [],
  );
  const [sortBy, setSortBy] = useState("featured");
  const [showOrganic, setShowOrganic] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [showOnSale, setShowOnSale] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [categories, setCategories] = useState<
    Array<{ name: string; count: number }>
  >([]);

  // Cache for faster loading
  const [productCache, setProductCache] = useState<Product[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const now = Date.now();

    // Use cache if available and fresh
    if (productCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
      console.log("Using cached products");
      setProducts(productCache);
      generateCategories(productCache);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Fetching products from database...");

      // Add timeout to prevent long waits
      const fetchPromise = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Fetch timeout")), 8000),
      );

      const { data, error } = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error("Supabase error:", error.message || error);

        // Use fallback products if it's a database connection error
        if (isDatabaseError(error)) {
          console.log(
            "Using fallback products due to database connection error",
          );
          setProducts(mockProducts);
          generateCategories(mockProducts);
          setIsDemoMode(true);
          setError(""); // Clear error since we have fallback data
          return;
        }

        setError(getErrorMessage(error));
        return;
      }

      console.log("Products fetched:", data?.length || 0);

      // Process products with robust price parsing
      const processedProducts = (data || []).map((product) => ({
        ...product,
        prices: parsePrices(product.prices),
      }));

      setProducts(processedProducts);
      setProductCache(processedProducts);
      setLastFetchTime(now);
      generateCategories(processedProducts);
    } catch (error: any) {
      console.error("Error fetching products:", error.message || error);

      // Use fallback products if it's a database connection error
      if (isDatabaseError(error)) {
        console.log("Using fallback products due to network error");
        setProducts(mockProducts);
        generateCategories(mockProducts);
        setIsDemoMode(true);
        setError(""); // Clear error since we have fallback data
      } else if (error instanceof Error && error.message.includes("timeout")) {
        setError(
          "Loading is taking longer than usual. Please refresh the page.",
        );
      } else {
        setError("An unexpected error occurred while loading products.");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateCategories = (productList: Product[]) => {
    const categoryCounts = productList.reduce(
      (acc: Record<string, number>, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      },
      {},
    );

    const categoryList = Object.entries(categoryCounts).map(
      ([name, count]) => ({
        name,
        count,
      }),
    );

    setCategories(categoryList);
  };

  // Memoized filtered products for better performance
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter - case insensitive, multiple terms
    if (searchQuery) {
      const searchTerms = searchQuery
        .toLowerCase()
        .split(" ")
        .filter((term) => term.length > 0);
      filtered = filtered.filter((product) => {
        const searchableText =
          `${product.name} ${product.description} ${product.category}`.toLowerCase();
        return searchTerms.every((term) => searchableText.includes(term));
      });
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) =>
        selectedCategories.includes(product.category),
      );
    }

    // Price filter
    filtered = filtered.filter((product) => {
      const minPrice = getMinPrice(product.prices);
      const maxPrice = getMaxPrice(product.prices);
      return minPrice >= priceRange[0] && maxPrice <= priceRange[1];
    });

    // Special filters
    if (showOrganic) {
      filtered = filtered.filter((product) => product.is_organic);
    }

    if (showInStock) {
      filtered = filtered.filter((product) => product.in_stock);
    }

    if (showOnSale) {
      filtered = filtered.filter((product) => product.original_price !== null);
    }

    if (minRating > 0) {
      filtered = filtered.filter((product) => product.rating >= minRating);
    }

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => {
          const aMin = getMinPrice(a.prices);
          const bMin = getMinPrice(b.prices);
          return aMin - bMin;
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const aMax = getMaxPrice(a.prices);
          const bMax = getMaxPrice(b.prices);
          return bMax - aMax;
        });
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "featured":
      default:
        filtered.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return b.rating - a.rating;
        });
        break;
    }

    return filtered;
  }, [
    products,
    searchQuery,
    selectedCategories,
    priceRange,
    showOrganic,
    showInStock,
    showOnSale,
    minRating,
    sortBy,
  ]);

  const handleCategoryChange = (categoryName: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryName]);
    } else {
      setSelectedCategories(
        selectedCategories.filter((cat) => cat !== categoryName),
      );
    }
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 5000]);
    setShowOrganic(false);
    setShowInStock(false);
    setShowOnSale(false);
    setMinRating(0);
  };

  const refreshProducts = () => {
    setProductCache([]);
    setLastFetchTime(0);
    loadProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {categoryFilter
                  ? `${categoryFilter.charAt(0).toUpperCase()}${categoryFilter.slice(1)}`
                  : searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : "Our Products"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Discover our premium collection of nuts, dried fruits, and
                healthy snacks
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4">
              <Badge className="bg-brand-100 text-brand-700 text-sm sm:text-base lg:text-lg px-3 py-1 sm:px-4 sm:py-2">
                {filteredProducts.length} Products
              </Badge>
              {!loading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshProducts}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 order-1">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="p-4 sm:p-6">
                {/* Mobile Filter Header - Collapsible */}
                <div className="lg:hidden">
                  <Button
                    variant="ghost"
                    onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                    className="w-full flex items-center justify-between p-3 mb-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-brand-600" />
                      <span className="font-semibold text-gray-900">Filters</span>
                      <Badge className="bg-brand-100 text-brand-700 text-xs">
                        {filteredProducts.length}
                      </Badge>
                    </div>
                    {isMobileFiltersOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Desktop Filter Header - Always Visible */}
                <div className="hidden lg:flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-brand-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Filters
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-brand-600"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Filter Content - Collapsible on Mobile */}
                <div className={isMobileFiltersOpen ? 'block lg:block' : 'hidden lg:block'}>
                  {/* Mobile Clear All Button */}
                  <div className="lg:hidden flex justify-end mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-brand-600"
                    >
                      Clear All
                    </Button>
                  </div>

                  {/* Categories */}
                  <div className="space-y-4 mb-6 lg:mb-8">
                  <h3 className="font-medium text-gray-900">Categories</h3>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div
                        key={category.name}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={category.name}
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={(checked) =>
                            handleCategoryChange(category.name, !!checked)
                          }
                        />
                        <label
                          htmlFor={category.name}
                          className="text-sm text-gray-600 cursor-pointer flex-1"
                        >
                          {category.name}
                        </label>
                        <span className="text-xs text-gray-400">
                          ({category.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-4 mb-8">
                  <h3 className="font-medium text-gray-900">Price Range</h3>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={5000}
                      step={100}
                      className="mb-4"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{formatPrice(priceRange[0])}</span>
                      <span>{formatPrice(priceRange[1])}</span>
                    </div>
                  </div>
                </div>

                {/* Special Filters */}
                <div className="space-y-4 mb-8">
                  <h3 className="font-medium text-gray-900">Special Filters</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="organic"
                        checked={showOrganic}
                        onCheckedChange={setShowOrganic}
                      />
                      <label
                        htmlFor="organic"
                        className="text-sm text-gray-600 cursor-pointer"
                      >
                        Organic
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sale"
                        checked={showOnSale}
                        onCheckedChange={setShowOnSale}
                      />
                      <label
                        htmlFor="sale"
                        className="text-sm text-gray-600 cursor-pointer"
                      >
                        On Sale
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="instock"
                        checked={showInStock}
                        onCheckedChange={setShowInStock}
                      />
                      <label
                        htmlFor="instock"
                        className="text-sm text-gray-600 cursor-pointer"
                      >
                        In Stock
                      </label>
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Rating</h3>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rating-${rating}`}
                          checked={minRating === rating}
                          onCheckedChange={(checked) =>
                            setMinRating(checked ? rating : 0)
                          }
                        />
                        <label
                          htmlFor={`rating-${rating}`}
                          className="text-sm text-gray-600 cursor-pointer flex items-center gap-1"
                        >
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span>& up</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3 order-2">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Showing {filteredProducts.length} of {products.length}{" "}
                  products
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px] lg:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="rating">Customer Rating</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                  <div className="text-left">
                    <p className="text-gray-900 font-medium">
                      Loading products...
                    </p>
                    <p className="text-sm text-gray-600">
                      This may take a moment
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="p-8 text-center">
                <CardContent>
                  <div className="text-red-500 mb-4">
                    <Package className="h-12 w-12 mx-auto mb-2" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Unable to Load Products
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button
                    onClick={refreshProducts}
                    className="bg-brand-600 hover:bg-brand-700"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* No Products State */}
            {!loading &&
              !error &&
              filteredProducts.length === 0 &&
              products.length === 0 && (
                <Card className="p-8 text-center">
                  <CardContent>
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Products Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We couldn't find any products. Please check back later or
                      run the database setup script.
                    </p>
                    <Button
                      onClick={refreshProducts}
                      className="bg-brand-600 hover:bg-brand-700"
                    >
                      Refresh Products
                    </Button>
                  </CardContent>
                </Card>
              )}

            {/* No Results After Filtering */}
            {!loading &&
              !error &&
              filteredProducts.length === 0 &&
              products.length > 0 && (
                <Card className="p-8 text-center">
                  <CardContent>
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Products Match Your{" "}
                      {searchQuery ? "Search" : "Filters"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery
                        ? `No products found for "${searchQuery}". Try different keywords.`
                        : "Try adjusting your filters to see more results."}
                    </p>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="border-brand-300 text-brand-600"
                    >
                      Clear All Filters
                    </Button>
                  </CardContent>
                </Card>
              )}

            {/* Products Display */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                    : "space-y-4 sm:space-y-6"
                }
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;