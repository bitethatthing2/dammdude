import { FcmTokenRegistration } from "@/components/shared/FcmTokenRegistration";
import { NotificationUtilities } from "@/components/admin/NotificationUtilities";
import { TestNotificationButton } from "@/components/admin/TestNotificationButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Test page for notifications
 */
export default function TestNotificationsPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Notification Testing</h1>
      
      <Tabs defaultValue="register">
        <TabsList className="mb-4">
          <TabsTrigger value="register">Register Device</TabsTrigger>
          <TabsTrigger value="test">Test Notifications</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="register" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Enable Notifications</h2>
            <p className="mb-4 text-muted-foreground">
              Register this device to receive push notifications. You'll need to grant permission
              when prompted by your browser.
            </p>
            
            <FcmTokenRegistration />
          </div>
        </TabsContent>
        
        <TabsContent value="test" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Send Test Notification</h2>
            <p className="mb-4 text-muted-foreground">
              Send a test notification to this device. Make sure you've enabled notifications first.
            </p>
            
            <TestNotificationButton />
          </div>
        </TabsContent>
        
        <TabsContent value="utilities" className="space-y-6">
          <NotificationUtilities />
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Debugging Tips</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Check the browser console for any errors related to Firebase or notifications.</li>
          <li>Make sure you've granted notification permissions to this site.</li>
          <li>If you're not receiving notifications, try refreshing the page and registering again.</li>
          <li>Use the Utilities tab to clean up invalid tokens if notifications aren't being delivered.</li>
          <li>For more detailed testing, run the <code>notification-cleanup.js</code> script from the command line.</li>
        </ul>
      </div>
    </div>
  );
}
