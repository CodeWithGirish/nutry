import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Star,
  ShoppingCart,
  Truck,
  Shield,
  Leaf,
  Award,
  Users,
  Package,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Heart,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DatabaseDebug from "@/components/DatabaseDebug";
import { supabase, type Product } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { mockProducts, isDatabaseError } from "@/lib/fallback";
import { toast } from "@/hooks/use-toast";
const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .limit(8);

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error: any) {
      console.error(
        "Error fetching featured products:",
        error.message || error,
      );

      // Use fallback products if database is unavailable
      if (isDatabaseError(error)) {
        console.log("Using fallback featured products");
        setFeaturedProducts(mockProducts.filter((p) => p.rating >= 4.5));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
    }
  };

  const categories = [
    {
      name: "Premium Nuts",
      image: "🌰",
      count: "15+ products",
      description: "Handpicked nuts for healthy snacking",
      color: "from-amber-100 to-orange-100",
    },
    {
      name: "Dried Fruits",
      image: "🍇",
      count: "12+ products",
      description: "Naturally dried, preservative-free",
      color: "from-purple-100 to-pink-100",
    },
    {
      name: "Organic Seeds",
      image: "🌻",
      count: "8+ products",
      description: "Nutrient-rich organic seeds",
      color: "from-green-100 to-emerald-100",
    },
    {
      name: "Trail Mixes",
      image: "🥨",
      count: "6+ products",
      description: "Perfect for active lifestyles",
      color: "from-red-100 to-orange-100",
    },
  ];

  const testimonialData = [
    {
      name: "Priya Sharma",
      location: "Mumbai",
      rating: 5,
      comment:
        "Amazing quality! The almonds are so fresh and crunchy. I've been ordering regularly for my family.",
      product: "Premium California Almonds",
    },
    {
      name: "Raj Patel",
      location: "Delhi",
      rating: 5,
      comment:
        "Fast delivery and excellent packaging. The trail mix is perfect for my morning runs!",
      product: "Trail Mix Supreme",
    },
    {
      name: "Ananya Kumar",
      location: "Bangalore",
      rating: 5,
      comment:
        "Love the organic certification. Finally found a trustworthy source for healthy snacks.",
      product: "Organic Walnuts",
    },
  ];

  const stats = [
    { icon: Users, label: "Happy Customers", value: "10,000+" },
    { icon: Package, label: "Products Delivered", value: "50,000+" },
    { icon: Star, label: "Average Rating", value: "4.8/5" },
    { icon: Truck, label: "Cities Served", value: "200+" },
  ];

  const features = [
    {
      icon: Shield,
      title: "Quality Assured",
      description: "Every product is handpicked and quality tested",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Free shipping on orders above ₹999",
    },
    {
      icon: Leaf,
      title: "100% Natural",
      description: "No artificial preservatives or additives",
    },
    {
      icon: Award,
      title: "Premium Quality",
      description: "Sourced directly from the finest producers",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 overflow-hidden">
        <div
          className={
            'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="%23f97316" stroke-width="0.5" opacity="0.1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E\')] opacity-30'
          }
        ></div>

        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  🌟 Premium Quality Guaranteed
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Premium
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                    {" "}
                    Dry Fruits{" "}
                  </span>
                  & Healthy Snacks
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Discover the finest collection of naturally dried fruits,
                  premium nuts, and healthy snacks. Sourced directly from the
                  best farms, delivered fresh to your doorstep.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                  onClick={() => navigate("/products")}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Shop Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                {!user && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate("/signup")}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Join NutriVault
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">4.8/5</span>
                  <span className="text-gray-600">(2,000+ reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="text-gray-600">Free delivery on ₹999+</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4 transform rotate-3">
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <div className="text-4xl mb-2">🌰</div>
                    <h3 className="font-semibold">Premium Almonds</h3>
                    <p className="text-sm text-gray-600">California's finest</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <div className="text-4xl mb-2">🍇</div>
                    <h3 className="font-semibold">Dried Fruits</h3>
                    <p className="text-sm text-gray-600">Natural sweetness</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <div className="text-4xl mb-2">🥜</div>
                    <h3 className="font-semibold">Mixed Nuts</h3>
                    <p className="text-sm text-gray-600">Energy packed</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <div className="text-4xl mb-2">🍯</div>
                    <h3 className="font-semibold">Medjool Dates</h3>
                    <p className="text-sm text-gray-600">Nature's candy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Explore Our Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our carefully curated selection of premium dry fruits,
              nuts, and healthy snacks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-orange-200"
                onClick={() =>
                  navigate(
                    `/products?category=${encodeURIComponent(category.name)}`,
                  )
                }
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`bg-gradient-to-br ${category.color} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <span className="text-3xl">{category.image}</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {category.description}
                  </p>
                  <Badge variant="secondary" className="mb-4">
                    {category.count}
                  </Badge>
                  <div className="flex items-center justify-center text-orange-600 group-hover:text-orange-700">
                    <span className="text-sm font-medium">Explore</span>
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-xl text-gray-600">
                Our most popular and highest-rated products
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/products")}
              className="hidden lg:flex border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              View All Products
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 animate-pulse rounded-lg h-96"
                ></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 lg:hidden">
            <Button
              variant="outline"
              onClick={() => navigate("/products")}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              View All Products
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose NutriVault?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to bringing you the highest quality dry fruits and
              nuts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <feature.icon className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <div className="text-3xl lg:text-4xl font-bold mb-2">
                  {stat.value}
                </div>
                <div className="text-orange-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Real reviews from real customers
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <CardContent className="text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-6 w-6 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <blockquote className="text-xl text-gray-900 mb-4 italic">
                  "{testimonialData[currentTestimonial]?.comment}"
                </blockquote>
                <div className="font-semibold text-gray-900">
                  {testimonialData[currentTestimonial]?.name}
                </div>
                <div className="text-gray-600">
                  {testimonialData[currentTestimonial]?.location} •{" "}
                  {testimonialData[currentTestimonial]?.product}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6 gap-2">
              {testimonialData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial
                      ? "bg-orange-600"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Stay Updated with NutriVault
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get the latest updates on new products, special offers, and healthy
            eating tips
          </p>

          <form
            onSubmit={handleNewsletterSignup}
            className="max-w-md mx-auto flex gap-4"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white text-gray-900"
              required
            />
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
            >
              Subscribe
            </Button>
          </form>

          <p className="text-sm text-gray-400 mt-4">
            No spam, unsubscribe at any time
          </p>
        </div>
      </section>

      {/* Call to Action */}
      {!user && (
        <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Start Your Healthy Journey?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers and discover the taste of
              premium quality
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/signup")}
                className="bg-white text-orange-600 hover:bg-gray-100"
              >
                Create Account
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/products")}
                className="border-white text-white hover:bg-white hover:text-orange-600"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Start Shopping
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
