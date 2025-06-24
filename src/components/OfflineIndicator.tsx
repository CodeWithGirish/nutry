import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi, AlertTriangle } from "lucide-react";

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check if we're starting in offline mode
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-hide the alert after 5 seconds when coming back online
  useEffect(() => {
    if (isOnline && !showOfflineAlert) {
      const timer = setTimeout(() => {
        setShowOfflineAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineAlert]);

  if (showOfflineAlert && !isOnline) {
    return (
      <div className="fixed top-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>You're offline. Some features may be limited.</span>
              <Badge
                variant="outline"
                className="ml-2 text-orange-700 border-orange-300"
              >
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show connection restored message briefly
  if (isOnline && showOfflineAlert) {
    return (
      <div className="fixed top-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Alert className="border-green-200 bg-green-50">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <span>Connection restored!</span>
              <Badge
                variant="outline"
                className="ml-2 text-green-700 border-green-300"
              >
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
