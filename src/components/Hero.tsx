import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Truck, Shield, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-warm-50 via-white to-brand-50 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 right-20 w-64 h-64 bg-brand-200 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-warm-200 rounded-full blur-2xl opacity-20"></div>

      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-brand-100 text-brand-700 hover:bg-brand-200 w-fit">
                ✨ Premium Quality Guaranteed
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Nature's Finest{" "}
                <span className="text-brand-600 relative">
                  Dry Fruits
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-brand-300"
                    viewBox="0 0 300 12"
                    fill="none"
                  >
                    <path
                      d="M2 10c49.7-3.1 99.7-5 149.5-5s99.8 1.9 149.5 5"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Discover our premium collection of carefully selected nuts,
                dried fruits, and healthy snacks. Fresh, nutritious, and
                delivered right to your doorstep.
              </p>
            </div>

            {/* Rating and trust indicators */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  4.9/5 from 2,847 reviews
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 text-lg"
              >
                <Link to="/products">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-brand-300 text-brand-700 hover:bg-brand-50 px-8 py-3 text-lg"
              >
                View Categories
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-brand-600" />
                <span className="text-sm text-gray-600">Free Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-600" />
                <span className="text-sm text-gray-600">Quality Assured</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-brand-600" />
                <span className="text-sm text-gray-600">Premium Grade</span>
              </div>
            </div>
          </div>

          {/* Right column - Hero Image/Products */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {/* Featured product cards */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl mb-4 flex items-center justify-center text-2xl">
                    🌰
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Premium Almonds
                  </h3>
                  <p className="text-brand-600 font-bold">$24.99/kg</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl mb-4 flex items-center justify-center text-2xl">
                    🍇
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Dried Cranberries
                  </h3>
                  <p className="text-brand-600 font-bold">$18.99/kg</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl mb-4 flex items-center justify-center text-2xl">
                    🥜
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Mixed Nuts
                  </h3>
                  <p className="text-brand-600 font-bold">$32.99/kg</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl mb-4 flex items-center justify-center text-2xl">
                    🍯
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Honey Dates
                  </h3>
                  <p className="text-brand-600 font-bold">$28.99/kg</p>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold transform rotate-12">
              Fresh Daily!
            </div>
            <div className="absolute -bottom-4 -left-4 bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-semibold transform -rotate-12">
              Organic Certified
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
