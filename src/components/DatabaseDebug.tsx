import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const DatabaseDebug = () => {
  const [connectionStatus, setConnectionStatus] = useState<
    "testing" | "connected" | "error" | "idle"
  >("idle");
  const [lastError, setLastError] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const testConnection = async () => {
    setConnectionStatus("testing");
    setTestResults([]);

    const tests = [
      {
        name: "Basic Connection",
        test: async () => {
          const { data, error } = await supabase
            .from("products")
            .select("id")
            .limit(1);
          return { data, error };
        },
      },
      {
        name: "Cart Table",
        test: async () => {
          const { data, error } = await supabase
            .from("cart")
            .select("id")
            .limit(1);
          return { data, error };
        },
      },
      {
        name: "Orders Table",
        test: async () => {
          const { data, error } = await supabase
            .from("orders")
            .select("id")
            .limit(1);
          return { data, error };
        },
      },
      {
        name: "Wishlist Table",
        test: async () => {
          const { data, error } = await supabase
            .from("wishlist")
            .select("id")
            .limit(1);
          return { data, error };
        },
      },
    ];

    const results = [];
    let hasError = false;

    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({
          name: test.name,
          status: result.error ? "error" : "success",
          error: result.error,
          data: result.data,
        });

        if (result.error) {
          hasError = true;
          setLastError(result.error);
        }
      } catch (error) {
        results.push({
          name: test.name,
          status: "error",
          error: error,
          data: null,
        });
        hasError = true;
        setLastError(error);
      }
    }

    setTestResults(results);
    setConnectionStatus(hasError ? "error" : "connected");
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "testing":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Debug
          {getStatusIcon(connectionStatus)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Overall Status:</span>
          <Badge
            className={getStatusColor(
              connectionStatus === "connected" ? "success" : "error",
            )}
          >
            {connectionStatus}
          </Badge>
        </div>

        <Button
          onClick={testConnection}
          disabled={connectionStatus === "testing"}
          className="w-full"
        >
          {connectionStatus === "testing" ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retest Connection
            </>
          )}
        </Button>

        {testResults.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">Test Results:</h4>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm">{result.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                    {result.status === "success" && result.data && (
                      <span className="text-xs text-gray-500">
                        ({result.data.length} records)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {lastError && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">Last Error:</h4>
              <div className="bg-red-50 p-3 rounded text-sm">
                <p>
                  <strong>Message:</strong> {lastError.message}
                </p>
                {lastError.code && (
                  <p>
                    <strong>Code:</strong> {lastError.code}
                  </p>
                )}
                {lastError.details && (
                  <p>
                    <strong>Details:</strong> {lastError.details}
                  </p>
                )}
                {lastError.hint && (
                  <p>
                    <strong>Hint:</strong> {lastError.hint}
                  </p>
                )}
                {lastError.status && (
                  <p>
                    <strong>Status:</strong> {lastError.status}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseDebug;
