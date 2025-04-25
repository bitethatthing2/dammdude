"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { SendNotificationRequest, SendNotificationResponse } from '@/lib/types/api';
import { Loader2, Send, Bell, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface NotificationResult {
  success: boolean;
  message: string;
  messageId?: string;
  recipients?: number;
}

export const NotificationSender = () => {
  // Basic notification fields
  const [title, setTitle] = useState('Your order is ready!');
  const [body, setBody] = useState('Come to the bar to pick up your order.');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<NotificationResult | null>(null);
  const { toast } = useToast();
  
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Target selection
  const [targetType, setTargetType] = useState<'all'>('all');
  const [token, setToken] = useState('');
  const [topic, setTopic] = useState('');
  
  // Additional options
  const [orderId, setOrderId] = useState('');
  const [link, setLink] = useState('');
  const [linkButtonText, setLinkButtonText] = useState('View Details');
  const [showLinkButton, setShowLinkButton] = useState(false);
  const [image, setImage] = useState('');
  const [actionButton, setActionButton] = useState('');
  const [actionButtonText, setActionButtonText] = useState('Take Action');
  const [showActionButton, setShowActionButton] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Platform-specific configurations
  const [showPlatformConfig, setShowPlatformConfig] = useState(false);
  const [androidChannelId, setAndroidChannelId] = useState('default');
  const [androidPriority, setAndroidPriority] = useState('high');
  const [iosSound, setIosSound] = useState('default');
  const [iosBadge, setIosBadge] = useState<number | undefined>(undefined);
  
  const handleSendNotification = async () => {
    if (!title || !body) return;
    
    setIsSending(true);
    setResult(null);
    setHasError(false);
    setErrorMessage('');
    
    try {
      // Build request based on target type
      const request: SendNotificationRequest = { 
        title, 
        body,
        sendToAll: true,
        ...(orderId && { orderId }),
        ...(link && { link }),
        ...(showLinkButton && link && { linkButtonText }),
        ...(image && { image }),
        ...(showActionButton && actionButton && { actionButton }),
        ...(showActionButton && actionButtonText && { actionButtonText }),
        // Platform specific options - these might need to be added to the type definition
        ...(showPlatformConfig && {
          androidConfig: {
            channelId: androidChannelId,
            priority: androidPriority
          },
          iosConfig: {
            sound: iosSound,
            ...(iosBadge !== undefined && { badge: iosBadge })
          }
        })
      };
      
      try {
        // Send notification via our API route
        const response = await fetch('/api/send-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send notification');
        }
        
        setResult({
          success: data.success,
          message: data.message || 'Notification sent successfully',
          messageId: data.messageId,
          recipients: data.recipients
        });
        
        // Show toast notification
        toast({
          title: 'Notification Sent',
          description: data.message || 'Notification sent successfully',
          variant: 'default',
          className: 'bg-background text-foreground border border-input'
        });
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        setHasError(true);
        setErrorMessage(fetchError instanceof Error ? fetchError.message : 'Network error occurred');
        throw fetchError;
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
      setResult({ 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to send notification'
      });
      
      // Show error toast
      toast({
        title: 'Notification Failed',
        description: err instanceof Error ? err.message : 'Failed to send notification',
        variant: 'destructive',
        className: 'bg-destructive text-destructive-foreground border border-destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Add error boundary effect
  useEffect(() => {
    // Reset error state on component mount
    setHasError(false);
    setErrorMessage('');
    
    return () => {
      // Clean up on unmount
    };
  }, []);

  // If there's an error, show a simplified version of the component
  if (hasError) {
    return (
      <div className="space-y-4 p-4 border rounded-md bg-card">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Send Notification
        </h2>
        <div className="p-4 border border-destructive rounded-md bg-destructive/10">
          <p className="text-destructive-foreground">Error loading notification sender: {errorMessage}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-background text-foreground border border-input"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-md bg-card">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Send Notification
      </h2>
      
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced" onClick={() => setShowAdvanced(true)}>Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="bg-background text-foreground"
              aria-label="Notification title"
              title="Enter the notification title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message"
              className="bg-background text-foreground"
              rows={3}
              aria-label="Notification message"
              title="Enter the notification message"
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <input 
                type="radio" 
                id="all" 
                name="targetType" 
                value="all" 
                checked={true} 
                readOnly
                className="h-4 w-4"
                title="Send to all devices"
                aria-label="Send to all devices"
              />
              <Label htmlFor="all">Send to all devices</Label>
            </div>
          </div>
          
          <Button 
            onClick={handleSendNotification} 
            disabled={isSending || !title || !body}
            className="w-full bg-primary text-primary-foreground border-0"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
          
          {result && (
            <div className={`p-3 rounded-md ${result.success ? 'bg-primary/20' : 'bg-destructive/20'}`}>
              <p className="text-sm font-medium">{result.message}</p>
              {result.recipients && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sent to {result.recipients} {result.recipients === 1 ? 'recipient' : 'recipients'}
                </p>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link & Buttons
            </Label>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="linkInput"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="URL to open (e.g., /orders/123)"
                  className="bg-background text-foreground"
                  aria-label="URL to open when notification is clicked"
                  title="Enter the URL to open when the notification is clicked"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="showLinkButton" 
                  checked={showLinkButton} 
                  onChange={(e) => setShowLinkButton(e.target.checked)} 
                  className="h-4 w-4"
                  aria-label="Add link button"
                  title="Add a button that opens the link"
                />
                <Label htmlFor="showLinkButton">Add link button</Label>
                {showLinkButton && (
                  <Input
                    id="linkButtonTextInput"
                    value={linkButtonText}
                    onChange={(e) => setLinkButtonText(e.target.value)}
                    placeholder="Button text"
                    className="ml-2 w-40 bg-background text-foreground"
                    aria-label="Link button text"
                    title="Enter the text for the link button"
                  />
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="showActionButton" 
                  checked={showActionButton} 
                  onChange={(e) => setShowActionButton(e.target.checked)} 
                  className="h-4 w-4"
                  aria-label="Add action button"
                  title="Add a custom action button"
                />
                <Label htmlFor="showActionButton">Add action button</Label>
              </div>
              
              {showActionButton && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="actionButtonInput"
                    value={actionButton}
                    onChange={(e) => setActionButton(e.target.value)}
                    placeholder="Action key (e.g., accept)"
                    className="bg-background text-foreground"
                    aria-label="Action button key"
                    title="Enter the key for the action button"
                  />
                  <Input
                    id="actionButtonTextInput"
                    value={actionButtonText}
                    onChange={(e) => setActionButtonText(e.target.value)}
                    placeholder="Button text"
                    className="bg-background text-foreground"
                    aria-label="Action button text"
                    title="Enter the text for the action button"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orderId">Order ID (optional)</Label>
            <Input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID for tracking"
              className="bg-background text-foreground"
              aria-label="Order ID"
              title="Enter the order ID for tracking"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Image URL (optional)</Label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="bg-background text-foreground"
              aria-label="Image URL"
              title="Enter the URL for the notification image"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="showPlatformConfig" 
                checked={showPlatformConfig} 
                onChange={(e) => setShowPlatformConfig(e.target.checked)} 
                className="h-4 w-4"
                aria-label="Show platform-specific options"
                title="Show platform-specific configuration options"
              />
              <Label htmlFor="showPlatformConfig">Platform-specific options</Label>
            </div>
            
            {showPlatformConfig && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div>
                  <Label className="text-sm font-medium">Android</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label htmlFor="androidChannelId" className="text-xs">Channel ID</Label>
                      <Input
                        id="androidChannelId"
                        value={androidChannelId}
                        onChange={(e) => setAndroidChannelId(e.target.value)}
                        placeholder="default"
                        className="bg-background text-foreground"
                        aria-label="Android channel ID"
                        title="Enter the Android notification channel ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="androidPriority" className="text-xs">Priority</Label>
                      <select
                        id="androidPriority"
                        value={androidPriority}
                        onChange={(e) => setAndroidPriority(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        aria-label="Android notification priority"
                        title="Select the Android notification priority"
                      >
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">iOS</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label htmlFor="iosSound" className="text-xs">Sound</Label>
                      <Input
                        id="iosSound"
                        value={iosSound}
                        onChange={(e) => setIosSound(e.target.value)}
                        placeholder="default"
                        className="bg-background text-foreground"
                        aria-label="iOS notification sound"
                        title="Enter the iOS notification sound"
                      />
                    </div>
                    <div>
                      <Label htmlFor="iosBadge" className="text-xs">Badge</Label>
                      <Input
                        id="iosBadge"
                        type="number"
                        value={iosBadge === undefined ? '' : iosBadge}
                        onChange={(e) => setIosBadge(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Badge number"
                        className="bg-background text-foreground"
                        aria-label="iOS badge number"
                        title="Enter the iOS app badge number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleSendNotification} 
            disabled={isSending || !title || !body}
            className="w-full bg-primary text-primary-foreground border-0"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
          
          {result && (
            <div className={`p-3 rounded-md ${result.success ? 'bg-primary/20' : 'bg-destructive/20'}`}>
              <p className="text-sm font-medium">{result.message}</p>
              {result.recipients && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sent to {result.recipients} {result.recipients === 1 ? 'recipient' : 'recipients'}
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
