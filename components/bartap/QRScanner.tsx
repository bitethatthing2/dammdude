"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { verifyAndStoreTableSession } from '@/lib/utils/table-utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CameraOff, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * QR code scanner component using device camera
 * Parses table ID from scanned URL and validates against database
 */
export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  
  // Initialize scanner on component mount
  useEffect(() => {
    let qrScanner: Html5Qrcode | null = null;
    
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const scannerId = 'qr-reader';
      
      // Create scanner container if it doesn't exist
      if (!document.getElementById(scannerId)) {
        const scannerContainer = document.createElement('div');
        scannerContainer.id = scannerId;
        scannerContainer.style.width = '100%';
        scannerContainer.style.display = 'none';
        document.body.appendChild(scannerContainer);
      }
      
      try {
        qrScanner = new Html5Qrcode(scannerId);
        setScanner(qrScanner);
        setScannerReady(true);
      } catch (err) {
        console.error('Failed to initialize QR scanner:', err);
        setError('Could not initialize camera scanner. Please try the manual entry method.');
        setHasCamera(false);
      }
    }
    
    // Clean up on unmount
    return () => {
      if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().catch(console.error);
      }
    };
  }, []);
  
  // Start scanning
  const startScanner = async () => {
    if (!scanner || !scannerReady) {
      setError('Scanner not ready. Please try again.');
      return;
    }
    
    setError(null);
    setIsScanning(true);
    
    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => handleScanSuccess(decodedText),
        (errorMessage) => {
          console.log(errorMessage);
          // Don't set error for normal camera operation
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Could not access the camera. Please ensure camera permissions are granted and try again.');
      setIsScanning(false);
    }
  };
  
  // Stop scanning
  const stopScanner = async () => {
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };
  
  // Handle successful QR code scan
  const handleScanSuccess = async (decodedText: string) => {
    try {
      // Stop scanning first
      await stopScanner();
      
      // Parse table ID from QR code URL
      // Expected format: https://domain.com/table/[tableId]
      const url = new URL(decodedText);
      const pathParts = url.pathname.split('/');
      const tableIndex = pathParts.indexOf('table');
      
      if (tableIndex === -1 || tableIndex === pathParts.length - 1) {
        throw new Error('Invalid QR code format');
      }
      
      const tableId = pathParts[tableIndex + 1];
      
      // Use shared utility to verify table and create session
      const result = await verifyAndStoreTableSession(tableId, supabase);
      
      if (!result.success || !result.table) {
        setError(result.error || 'Invalid table QR code. Please try again or use the manual entry method.');
        return;
      }
      
      const tableData = result.table;
      
      // Show success message
      toast.success('Table identified', {
        description: `You're now at Table ${tableData.name}${tableData.section ? ` (${tableData.section})` : ''}`,
      });
      
      // Redirect to bar-tap page
      router.push(`/bar-tap?table=${tableData.id}`);
    } catch (error) {
      console.error('Error processing QR code:', error);
      setError('Could not process the QR code. Please try again or use the manual entry method.');
    }
  };
  
  // Reset state if there's an error
  const resetScanner = () => {
    stopScanner();
    setError(null);
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
        {isScanning ? (
          <div id="qr-scanner-view" className="absolute inset-0">
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-64 h-64 border-2 border-primary border-dashed rounded-lg"></div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            {hasCamera ? (
              <>
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  Camera will appear here when started
                </p>
              </>
            ) : (
              <>
                <CameraOff className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  Camera access unavailable
                </p>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        {isScanning ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={stopScanner}
          >
            <CameraOff className="h-4 w-4 mr-2" />
            Stop Scanning
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={startScanner}
            disabled={!scannerReady || !hasCamera}
          >
            <Camera className="h-4 w-4 mr-2" />
            Start Camera
          </Button>
        )}
        
        {error && (
          <Button
            variant="outline"
            onClick={resetScanner}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <p className="text-center text-sm text-muted-foreground pt-2">
        Point your camera at the QR code on your table
      </p>
    </div>
  );
}
