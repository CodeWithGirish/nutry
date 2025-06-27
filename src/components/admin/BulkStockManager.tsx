import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package2,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
} from "lucide-react";
import { supabase, type Product } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { parsePrices, formatPrice } from "@/lib/utils";

interface BulkStockManagerProps {
  products: Product[];
  onStockUpdate?: () => void;
}

interface ProductSelection {
  productId: string;
  selected: boolean;
}

interface BulkOperation {
  type: "add" | "subtract" | "set" | "low_stock_alert";
  amount?: number;
  weight?: string;
  category?: string;
}

export default function BulkStockManager({
  products,
  onStockUpdate,
}: BulkStockManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>(
    [],
  );
  const [operation, setOperation] = useState<BulkOperation>({
    type: "add",
    amount: 0,
  });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  React.useEffect(() => {
    if (isOpen) {
      // Initialize selections when dialog opens
      setSelectedProducts(
        products.map((product) => ({
          productId: product.id,
          selected: false,
        })),
      );
    }
  }, [isOpen, products]);

  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }

      // Stock filter
      if (stockFilter === "low") {
        const hasLowStock = parsePrices(product.prices).some(
          (price) =>
            (price.stock_quantity || 0) > 0 && (price.stock_quantity || 0) < 10,
        );
        if (!hasLowStock) return false;
      } else if (stockFilter === "out") {
        const hasNoStock = parsePrices(product.prices).every(
          (price) => (price.stock_quantity || 0) === 0,
        );
        if (!hasNoStock) return false;
      }

      return true;
    });
  }, [products, categoryFilter, stockFilter]);

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.map((sel) =>
        sel.productId === productId ? { ...sel, selected: !sel.selected } : sel,
      ),
    );
  };

  const selectAllFiltered = () => {
    setSelectedProducts((prev) =>
      prev.map((sel) => ({
        ...sel,
        selected: filteredProducts.some((p) => p.id === sel.productId),
      })),
    );
  };

  const deselectAll = () => {
    setSelectedProducts((prev) =>
      prev.map((sel) => ({ ...sel, selected: false })),
    );
  };

  const getSelectedProducts = () => {
    const selectedIds = selectedProducts
      .filter((sel) => sel.selected)
      .map((sel) => sel.productId);
    return products.filter((product) => selectedIds.includes(product.id));
  };

  const applyBulkOperation = async () => {
    try {
      setLoading(true);
      const selectedProductList = getSelectedProducts();

      if (selectedProductList.length === 0) {
        toast({
          title: "No Products Selected",
          description: "Please select at least one product.",
          variant: "destructive",
        });
        return;
      }

      const updates = [];

      for (const product of selectedProductList) {
        let updatedPrices = [...parsePrices(product.prices)];

        // Apply the operation based on type
        if (operation.type === "low_stock_alert") {
          // This would typically trigger an alert system
          continue;
        }

        if (operation.weight) {
          // Apply to specific weight variant
          updatedPrices = updatedPrices.map((price) => {
            if (price.weight === operation.weight) {
              let newStock = price.stock_quantity || 0;

              switch (operation.type) {
                case "add":
                  newStock += operation.amount || 0;
                  break;
                case "subtract":
                  newStock = Math.max(0, newStock - (operation.amount || 0));
                  break;
                case "set":
                  newStock = operation.amount || 0;
                  break;
              }

              return { ...price, stock_quantity: newStock };
            }
            return price;
          });
        } else {
          // Apply to all variants
          updatedPrices = updatedPrices.map((price) => {
            let newStock = price.stock_quantity || 0;

            switch (operation.type) {
              case "add":
                newStock += operation.amount || 0;
                break;
              case "subtract":
                newStock = Math.max(0, newStock - (operation.amount || 0));
                break;
              case "set":
                newStock = operation.amount || 0;
                break;
            }

            return { ...price, stock_quantity: newStock };
          });
        }

        // Calculate total stock and in_stock status
        const totalStock = updatedPrices.reduce(
          (sum, price) => sum + (price.stock_quantity || 0),
          0,
        );
        const isInStock = updatedPrices.some(
          (price) => (price.stock_quantity || 0) > 0,
        );

        updates.push({
          id: product.id,
          prices: updatedPrices,
          stock_quantity: totalStock,
          in_stock: isInStock,
          updated_at: new Date().toISOString(),
        });
      }

      // Perform bulk update
      for (const update of updates) {
        const { error } = await supabase
          .from("products")
          .update({
            prices: update.prices,
            stock_quantity: update.stock_quantity,
            in_stock: update.in_stock,
            updated_at: update.updated_at,
          })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast({
        title: "Bulk Update Complete",
        description: `Successfully updated ${updates.length} products.`,
      });

      setIsOpen(false);
      onStockUpdate?.();
    } catch (error: any) {
      console.error("Error performing bulk operation:", error);
      toast({
        title: "Error",
        description: "Failed to perform bulk operation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportStockData = () => {
    const stockData = products.map((product) => ({
      Name: product.name,
      Category: product.category,
      ...parsePrices(product.prices).reduce(
        (acc, price) => ({
          ...acc,
          [`Stock_${price.weight.replace(/[^a-zA-Z0-9]/g, "_")}`]:
            price.stock_quantity || 0,
        }),
        {},
      ),
      Total_Stock: product.stock_quantity || 0,
      In_Stock: product.in_stock ? "Yes" : "No",
    }));

    const csvContent = [
      Object.keys(stockData[0]).join(","),
      ...stockData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Stock data has been exported to CSV.",
    });
  };

  const categories = Array.from(
    new Set(
      products
        .map((p) => p.category)
        .filter((category) => category && category.trim() !== ""),
    ),
  );
  const weights = Array.from(
    new Set(
      products.flatMap((p) =>
        parsePrices(p.prices)
          .map((price) => price.weight)
          .filter((weight) => weight && weight.trim() !== ""),
      ),
    ),
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Package2 className="h-4 w-4 mr-2" />
          Bulk Stock Management
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Bulk Stock Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters and Export */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label>Filters:</Label>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories
                  .filter((category) => category && category.trim() !== "")
                  .map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Stock Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="low">Low Stock Only</SelectItem>
                <SelectItem value="out">Out of Stock Only</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <Button variant="outline" size="sm" onClick={exportStockData}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Product Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Select Products ({getSelectedProducts().length} selected)
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                  Select All Filtered
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
              {filteredProducts.map((product) => {
                const selection = selectedProducts.find(
                  (sel) => sel.productId === product.id,
                );
                const stockInfo = parsePrices(product.prices);
                const lowStockCount = stockInfo.filter(
                  (price) =>
                    (price.stock_quantity || 0) > 0 &&
                    (price.stock_quantity || 0) < 10,
                ).length;
                const outOfStockCount = stockInfo.filter(
                  (price) => (price.stock_quantity || 0) === 0,
                ).length;

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selection?.selected || false}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        {product.category} • Total Stock:{" "}
                        {product.stock_quantity || 0}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {lowStockCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 text-xs"
                        >
                          {lowStockCount} Low
                        </Badge>
                      )}
                      {outOfStockCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {outOfStockCount} Out
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Bulk Operation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bulk Operation</h3>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Operation Type</Label>
                <Select
                  value={operation.type}
                  onValueChange={(value: any) =>
                    setOperation({ ...operation, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Stock</SelectItem>
                    <SelectItem value="subtract">Remove Stock</SelectItem>
                    <SelectItem value="set">Set Exact Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="0"
                  value={operation.amount || ""}
                  onChange={(e) =>
                    setOperation({
                      ...operation,
                      amount: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="10"
                />
              </div>

              <div>
                <Label>Weight Variant (Optional)</Label>
                <Select
                  value={operation.weight || "all"}
                  onValueChange={(value) =>
                    setOperation({
                      ...operation,
                      weight: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Variants</SelectItem>
                    {weights
                      .filter((weight) => weight && weight.trim() !== "")
                      .map((weight) => (
                        <SelectItem key={weight} value={weight}>
                          {weight}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={applyBulkOperation}
                  disabled={loading || getSelectedProducts().length === 0}
                  className="w-full bg-brand-600 hover:bg-brand-700"
                >
                  {loading ? "Applying..." : "Apply Operation"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <div className="text-sm text-gray-500">
              {getSelectedProducts().length} products selected for bulk
              operation
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
