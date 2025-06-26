import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  Phone,
  Mail,
  LogOut,
  Settings,
  Package,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();

  const getNavigation = () => {
    if (!user) {
      // First-time visitors see limited navigation
      return [
        { name: "Home", href: "/" },
        { name: "Products", href: "/products" },
        { name: "About", href: "/about" },
      ];
    }

    // Admin users only see admin navigation
    if (isAdmin) {
      return [{ name: "Admin Dashboard", href: "/admin-dashboard" }];
    }

    // Regular logged-in users see full navigation
    return [
      { name: "Home", href: "/" },
      { name: "Products", href: "/products" },
      { name: "Categories", href: "/categories" },
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ];
  };

  const navigation = getNavigation();

  const isActive = (href: string) => location.pathname === href;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      // Clear any local state if needed
      setIsMobileMenuOpen(false);
      navigate("/");
    } catch (error: any) {
      console.error("Error signing out:", error.message || error);
    }
  };

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  return (
    <header className="bg-white border-b border-warm-200 sticky top-0 z-50">
      {/* Main navigation */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-2 rounded-lg">
              <span className="text-white font-bold text-lg sm:text-xl">
                🥜
              </span>
            </div>
            <div className="hidden xs:block sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-brand-800">
                NutriVault
              </h1>
              <p className="text-xs text-brand-600 hidden sm:block">
                Premium Dry Fruits
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm lg:text-base font-medium transition-colors hover:text-brand-600 whitespace-nowrap",
                  isActive(item.href)
                    ? "text-brand-600 border-b-2 border-brand-600 pb-1"
                    : "text-gray-700",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            {/* Search - Hidden for admin users */}
            {!isAdmin && (
              <form
                onSubmit={handleSearch}
                className="hidden md:flex items-center relative"
              >
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-48 lg:w-64 xl:w-72"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </form>
            )}

            {/* User Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {user && !isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative hidden sm:flex"
                  onClick={() => navigate("/wishlist")}
                >
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {wishlistCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center bg-brand-500 text-white text-xs">
                      {wishlistCount}
                    </Badge>
                  )}
                </Button>
              )}

              {!isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative hidden sm:flex"
                  onClick={() => navigate("/cart")}
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center bg-brand-500 text-white text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 sm:gap-2"
                    >
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden lg:inline text-sm max-w-20 truncate">
                        {profile?.full_name || "User"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {!isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/profile")}>
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/track-order")}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          My Orders
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuItem
                          onClick={() => navigate("/admin-dashboard")}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-1 sm:gap-2"
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden lg:inline text-sm">Sign In</span>
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 bg-white shadow-lg">
            <div className="flex flex-col space-y-4 px-2">
              {/* Mobile search - Hidden for admin users */}
              {!isAdmin && (
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </form>
              )}

              {/* Mobile navigation */}
              <nav className="flex flex-col space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "text-base font-medium py-3 px-4 rounded-lg transition-colors",
                      isActive(item.href)
                        ? "bg-brand-100 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Mobile user actions */}
              {user && !isAdmin && (
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Link
                    to="/wishlist"
                    className="flex items-center justify-between py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <Heart className="h-5 w-5" />
                      Wishlist
                    </span>
                    {wishlistCount > 0 && (
                      <Badge className="bg-brand-500 text-white">
                        {wishlistCount}
                      </Badge>
                    )}
                  </Link>
                  <Link
                    to="/cart"
                    className="flex items-center justify-between py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <ShoppingCart className="h-5 w-5" />
                      Cart
                    </span>
                    {cartCount > 0 && (
                      <Badge className="bg-brand-500 text-white">
                        {cartCount}
                      </Badge>
                    )}
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                </div>
              )}

              {/* Mobile auth actions */}
              {!user && (
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full py-3"
                    onClick={() => {
                      navigate("/login");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="w-full bg-brand-600 hover:bg-brand-700 py-3"
                    onClick={() => {
                      navigate("/signup");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;
