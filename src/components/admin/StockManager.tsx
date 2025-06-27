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
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { supabase, type Product } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { parsePrices, formatPrice } from "@/lib/utils";

interface StockManagerProps {
  product: Product;
  onStockUpdate?: () => void;
}

interface StockAdjustment {
  weight: string;
  currentStock: number;
  adjustment: number;
  adjustmentType: "add" | "subtract" | "set";
}

export default function StockManager({
  product,
  onStockUpdate,
}: StockManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      // Initialize adjustments when dialog opens
      const initialAdjustments = parsePrices(product.prices)
        .filter((price) => price.weight && price.weight.trim() !== "")
        .map((price) => ({
          weight: price.weight,
          currentStock: price.stock_quantity || 0,
          adjustment: 0,
          adjustmentType: "add" as const,
        }));
      setAdjustments(initialAdjustments);
    }
  }, [isOpen, product.prices]);

  const updateAdjustment = (
    weight: string,
    field: keyof StockAdjustment,
    value: any,
  ) => {
    setAdjustments((prev) =>
      prev.map((adj) =>
        adj.weight === weight ? { ...adj, [field]: value } : adj,
      ),
    );
  };

  const calculateNewStock = (
    current: number,
    adjustment: number,
    type: string,
  ) => {
    switch (type) {
      case "add":
        return current + adjustment;
      case "subtract":
        return Math.max(0, current - adjustment);
      case "set":
        return Math.max(0, adjustment);
      default:
        return current;
    }
  };

  const applyStockChanges = async () => {
    try {
      setLoading(true);

      // Calculate new prices array with updated stock quantities
      const updatedPrices = parsePrices(product.prices).map((price) => {
        const adjustment = adjustments.find(
          (adj) => adj.weight === price.weight,
        );
        if (adjustment) {
          const newStock = calculateNewStock(
            price.stock_quantity || 0,
            adjustment.adjustment,
            adjustment.adjustmentType,
          );
          return {
            ...price,
            stock_quantity: newStock,
          };
        }
        return price;
      });

      // Calculate if product is in stock (any variant has stock)
      const isInStock = updatedPrices.some(
        (price) => (price.stock_quantity || 0) > 0,
      );

      // Update product in database
      const { error } = await supabase
        .from("products")
        .update({
          prices: updatedPrices,
          in_stock: isInStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (error) throw error;

      toast({
        title: "Stock Updated",
        description: "Stock quantities have been successfully updated.",
      });

      setIsOpen(false);
      onStockUpdate?.();
    } catch (error: any) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock quantities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalStock = parsePrices(product.prices).reduce(
    (sum, price) => sum + (price.stock_quantity || 0),
    0,
  );

  const lowStockVariants = parsePrices(product.prices).filter(
    (price) =>
      (price.stock_quantity || 0) > 0 && (price.stock_quantity || 0) < 10,
  );

  const outOfStockVariants = parsePrices(product.prices).filter(
    (price) => (price.stock_quantity || 0) === 0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="h-4 w-4 mr-2" />
          Manage Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Management - {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stock Overview */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStock}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Low Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {lowStockVariants.length}
                </div>
                <div className="text-xs text-gray-500">variants</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Out of Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {outOfStockVariants.length}
                </div>
                <div className="text-xs text-gray-500">variants</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Stock Adjustments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Adjust Stock Quantities</h3>

            {adjustments.map((adjustment, index) => {
              const newStock = calculateNewStock(
                adjustment.currentStock,
                adjustment.adjustment,
                adjustment.adjustmentType,
              );

              return (
                <Card key={adjustment.weight}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {adjustment.weight}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Current: {adjustment.currentStock}
                        </Badge>
                        <Badge
                          variant={
                            newStock !== adjustment.currentStock
                              ? "default"
                              : "outline"
                          }
                          className={
                            newStock > adjustment.currentStock
                              ? "bg-green-100 text-green-800"
                              : newStock < adjustment.currentStock
                                ? "bg-red-100 text-red-800"
                                : ""
                          }
                        >
                          New: {newStock}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm">Action</Label>
                        <select
                          className="w-full p-2 border rounded-md text-sm"
                          value={adjustment.adjustmentType}
                          onChange={(e) =>
                            updateAdjustment(
                              adjustment.weight,
                              "adjustmentType",
                              e.target.value as "add" | "subtract" | "set",
                            )
                          }
                        >
                          <option value="add">Add Stock</option>
                          <option value="subtract">Remove Stock</option>
                          <option value="set">Set Exact Amount</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-sm">
                          {adjustment.adjustmentType === "set"
                            ? "New Quantity"
                            : "Amount"}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={adjustment.adjustment}
                          onChange={(e) =>
                            updateAdjustment(
                              adjustment.weight,
                              "adjustment",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Quick Actions</Label>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateAdjustment(
                                adjustment.weight,
                                "adjustmentType",
                                "add",
                              );
                              updateAdjustment(
                                adjustment.weight,
                                "adjustment",
                                10,
                              );
                            }}
                          >
                            +10
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateAdjustment(
                                adjustment.weight,
                                "adjustmentType",
                                "subtract",
                              );
                              updateAdjustment(
                                adjustment.weight,
                                "adjustment",
                                1,
                              );
                            }}
                          >
                            -1
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateAdjustment(
                                adjustment.weight,
                                "adjustmentType",
                                "set",
                              );
                              updateAdjustment(
                                adjustment.weight,
                                "adjustment",
                                0,
                              );
                            }}
                          >
                            0
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Stock status indicators */}
                    <div className="flex items-center gap-2 text-sm">
                      {newStock === 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Will be out of stock
                        </Badge>
                      )}
                      {newStock > 0 && newStock < 10 && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-amber-100 text-amber-800"
                        >
                          Will be low stock
                        </Badge>
                      )}
                      {newStock >= 10 && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-100 text-green-800"
                        >
                          Good stock level
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={applyStockChanges}
              disabled={
                loading || adjustments.every((adj) => adj.adjustment === 0)
              }
              className="bg-brand-600 hover:bg-brand-700"
            >
              {loading ? "Updating..." : "Apply Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
