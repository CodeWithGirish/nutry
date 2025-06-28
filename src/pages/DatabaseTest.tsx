import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { supabase, testDatabaseConnection } from "@/lib/supabase";

const DatabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<
    "testing" | "connected" | "error" | "idle"
  >("idle");
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runConnectionTest = async () => {
    setConnectionStatus("testing");
    setError(null);
    setTestResults(null);

    try {
      // Test basic connection
      const isConnected = await testDatabaseConnection();

      // Test specific tables
      const tests = {
        products: false,
        cart: false,
        orders: false,
        profiles: false,
      };

      // Test products table
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id")
          .limit(1);
        tests.products = !error;
        if (error) console.log("Products error:", error);
      } catch (e) {
        tests.products = false;
      }

      // Test cart table
      try {
        const { data, error } = await supabase
          .from("cart")
          .select("id")
          .limit(1);
        tests.cart = !error;
        if (error) console.log("Cart error:", error);
      } catch (e) {
        tests.cart = false;
      }

      // Test orders table
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id")
          .limit(1);
        tests.orders = !error;
        if (error) console.log("Orders error:", error);
      } catch (e) {
        tests.orders = false;
      }

      // Test profiles table
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .limit(1);
        tests.profiles = !error;
        if (error) console.log("Profiles error:", error);
      } catch (e) {
        tests.profiles = false;
      }

      setTestResults({
        generalConnection: isConnected,
        tables: tests,
      });

      setConnectionStatus(isConnected ? "connected" : "error");
    } catch (err: any) {
      setError(err.message || "Connection test failed");
      setConnectionStatus("error");
    }
  };

  useEffect(() => {
    runConnectionTest();
  }, []);

  const getStatusIcon = (status: string | boolean) => {
    if (status === "testing") {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (status === true || status === "connected") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status === false || status === "error") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: boolean | string) => {
    if (status === true || status === "connected") {
      return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
    }
    if (status === false || status === "error") {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Testing</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Connection Test
              {getStatusIcon(connectionStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Status:</span>
              {getStatusBadge(connectionStatus)}
            </div>

            <Button
              onClick={runConnectionTest}
              disabled={connectionStatus === "testing"}
              className="w-full"
            >
              {connectionStatus === "testing" ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Connection Again
                </>
              )}
            </Button>

            {testResults && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">General Connection:</h3>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Supabase Connection</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.generalConnection)}
                      {getStatusBadge(testResults.generalConnection)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Table Access:</h3>
                  <div className="space-y-2">
                    {Object.entries(testResults.tables).map(
                      ([table, status]) => (
                        <div
                          key={table}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <span className="capitalize">{table} Table</span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status as boolean)}
                            {getStatusBadge(status as boolean)}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h3 className="font-medium text-red-800 mb-2">
                  Error Details:
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-medium text-blue-800 mb-2">Database Info:</h3>
              <div className="text-blue-700 text-sm space-y-1">
                <p>
                  <strong>URL:</strong> https://truzxbzzgmfrifiygmgr.supabase.co
                </p>
                <p>
                  <strong>Mode:</strong> {import.meta.env.MODE}
                </p>
                <p>
                  <strong>Time:</strong> {new Date().toISOString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseTest;
