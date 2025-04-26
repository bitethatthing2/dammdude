import { TestNotificationButton } from "@/components/admin/TestNotificationButton";
import { SimpleNotificationGuide } from "@/components/shared/temp/SimpleNotificationGuide";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestNotificationsPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Notification System Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enable Notifications</CardTitle>
            <CardDescription>
              Request permission and register for push notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to enable notifications. This will request permission
              and register your device for push notifications.
            </p>
            
            <div className="flex gap-4">
              <SimpleNotificationGuide variant="button" />
              <SimpleNotificationGuide variant="icon" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Send Test Notification</CardTitle>
            <CardDescription>
              Send a test notification to all registered devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to send a test notification to all registered devices.
              Make sure you have enabled notifications first.
            </p>
            
            <TestNotificationButton />
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <p className="text-xs text-muted-foreground">
              Note: If you don&apos;t see the notification, check the browser console for errors.
              The notification will only appear if your browser is in the background or if you&apos;re
              viewing a different tab.
            </p>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Notification System Debugging</CardTitle>
          <CardDescription>
            Information to help debug notification issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Browser Support</h3>
              <p className="text-sm text-muted-foreground">
                Notifications are supported in Chrome, Firefox, Safari, and Edge.
                They are not supported in Internet Explorer.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Common Issues</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Permissions not granted - Check browser settings</li>
                <li>Service worker not registered - Check console for errors</li>
                <li>Network issues - Ensure you&apos;re online</li>
                <li>Firebase configuration - Ensure environment variables are set correctly</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium">Testing Steps</h3>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>Enable notifications using the button above</li>
                <li>Send a test notification</li>
                <li>Switch to another tab or minimize the browser</li>
                <li>Check if the notification appears</li>
                <li>If not, check the console for errors</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
