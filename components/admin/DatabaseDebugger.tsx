"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2, Check, X, AlertTriangle } from 'lucide-react';

/**
 * Temporary component for diagnosing database connection issues
 * Can be added to admin dashboard for troubleshooting
 */
export function DatabaseDebugger() {
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<null | { 
    healthy: boolean; 
    error?: string;
    details?: string;
    latency?: string;
  }>(null);
  const [directQueryStatus, setDirectQueryStatus] = useState<null | {
    success: boolean;
    error?: string;
    data?: any;
  }>(null);
  
  // Run health check
  const checkHealth = async () => {
    setIsChecking(true);
    setHealthStatus(null);
    setDirectQueryStatus(null);
    
    try {
      // Check the API endpoint
      const response = await fetch('/api/admin/db-health-check');
      const data = await response.json();
      setHealthStatus(data);
      
      // Try direct Supabase query
      const supabase = getSupabaseBrowserClient();
      const { data: queryData, error: queryError } = await supabase
        .from('orders')
        .select('count')
        .limit(1);
      
      if (queryError) {
        setDirectQueryStatus({
          success: false,
          error: queryError.message
        });
      } else {
        setDirectQueryStatus({
          success: true,
          data: queryData
        });
      }
    } catch (err) {
      setHealthStatus({
        healthy: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        details: 'Error occurred during health check'
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <Card className="bg-muted/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
          Database Connection Debugger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Use this tool to diagnose database connection issues. This component can be removed after debugging is complete.
          </p>
          
          <div className="space-y-2">
            <Button
              size="sm"
              onClick={checkHealth}
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Database Connection'
              )}
            </Button>
            
            {healthStatus !== null && (
              <div className="p-3 rounded-md bg-background">
                <div className="flex items-center">
                  <div className="mr-2">
                    {healthStatus.healthy ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {healthStatus.healthy ? 'API Health Check: Healthy' : 'API Health Check: Error'}
                    </p>
                    {healthStatus.latency && (
                      <p className="text-xs text-muted-foreground">Latency: {healthStatus.latency}</p>
                    )}
                    {healthStatus.error && (
                      <p className="text-xs text-red-500 mt-1">{healthStatus.error}</p>
                    )}
                    {healthStatus.details && (
                      <p className="text-xs text-muted-foreground mt-1">{healthStatus.details}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {directQueryStatus !== null && (
              <div className="p-3 rounded-md bg-background">
                <div className="flex items-center">
                  <div className="mr-2">
                    {directQueryStatus.success ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {directQueryStatus.success ? 'Direct Query: Success' : 'Direct Query: Failed'}
                    </p>
                    {directQueryStatus.error && (
                      <p className="text-xs text-red-500 mt-1">{directQueryStatus.error}</p>
                    )}
                    {directQueryStatus.data && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Data: {JSON.stringify(directQueryStatus.data)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}