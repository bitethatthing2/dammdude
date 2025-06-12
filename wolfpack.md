Frontend Implementation Guide
Here's how to implement the automated location-based Wolf Pack chat in your frontend:
1. App Initialization Flow
javascript// On app launch or user login
async function initializeApp() {
  const { data: initData } = await supabase.rpc('init_user_app', {
    p_platform: 'ios', // or 'android', 'web'
    p_app_version: '1.0.0'
  });
  
  if (initData.needs_location_permission) {
    // Request location permission
    requestLocationPermission();
  }
}

// Request location permission
async function requestLocationPermission() {
  try {
    // For React Native
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    // For web
    // navigator.geolocation.getCurrentPosition(success, error);
    
    // Update permission status in database
    await supabase.rpc('update_location_permission', {
      p_granted: status === 'granted'
    });
    
    if (status === 'granted') {
      // Start location tracking
      startLocationTracking();
    }
  } catch (error) {
    console.error('Location permission error:', error);
  }
}
2. Automatic Location Tracking
javascript// Start continuous location tracking
async function startLocationTracking() {
  // For React Native using expo-location
  await Location.startLocationUpdatesAsync('WOLF_PACK_LOCATION', {
    accuracy: Location.Accuracy.High,
    distanceInterval: 50, // Update every 50 meters
    timeInterval: 30000,  // Update every 30 seconds
    foregroundService: {
      notificationTitle: "Wolf Pack Active",
      notificationBody: "We'll let you know when you're at a Side Hustle location"
    }
  });
  
  // For web, use watchPosition
  navigator.geolocation.watchPosition(
    (position) => checkLocation(position.coords),
    (error) => console.error(error),
    { 
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000
    }
  );
}

// Check location and update wolf pack status
async function checkLocation(coords) {
  const { data } = await supabase.rpc('smart_location_check', {
    p_user_lat: coords.latitude,
    p_user_lon: coords.longitude
  });
  
  // Handle the response
  if (data.status === 'joined') {
    // Show welcome notification
    showNotification('Welcome to the Wolf Pack! 🐺', data.message);
    // Enable chat UI
    enableWolfPackChat();
  } else if (data.status === 'left') {
    // Show goodbye message
    showNotification('See you soon!', data.message);
    // Disable chat UI
    disableWolfPackChat();
  } else if (data.status === 'grace_period') {
    // Show grace period status
    showGracePeriodStatus(data.grace_remaining);
  }
}
3. Background Location Sync (for battery efficiency)
javascript// Batch location updates for background sync
let locationQueue = [];

async function queueLocationUpdate(coords) {
  locationQueue.push({
    lat: coords.latitude,
    lon: coords.longitude,
    timestamp: new Date().toISOString()
  });
  
  // Sync every 5 updates or every 2 minutes
  if (locationQueue.length >= 5) {
    await syncLocations();
  }
}

async function syncLocations() {
  if (locationQueue.length === 0) return;
  
  const { data } = await supabase.rpc('background_location_sync', {
    p_locations: locationQueue
  });
  
  // Clear queue after sync
  locationQueue = [];
  
  // Update UI based on latest status
  updateChatAccess(data.latest_status);
}

// Set up periodic sync
setInterval(syncLocations, 120000); // Sync every 2 minutes
4. Chat Interface with Access Control
javascript// Check wolf pack status before showing chat
async function WolfPackChat() {
  const [canAccess, setCanAccess] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAccess();
    
    // Subscribe to status changes
    const subscription = supabase
      .channel('wolf_pack_status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wolf_pack_members',
        filter: `user_id=eq.${user.id}`
      }, checkAccess)
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, []);
  
  async function checkAccess() {
    const { data } = await supabase.rpc('get_my_wolf_pack_status');
    setStatus(data);
    setCanAccess(data.can_chat);
    setLoading(false);
  }
  
  if (loading) return <LoadingSpinner />;
  
  if (!canAccess) {
    return (
      <div className="wolf-pack-locked">
        <h2>Wolf Pack Chat 🐺</h2>
        <p>{status.message}</p>
        <p>Visit any Side Hustle location to join the conversation!</p>
        <button onClick={() => openMaps()}>Find Nearest Location</button>
      </div>
    );
  }
  
  return (
    <div className="wolf-pack-chat">
      <ChatHeader location={status.location_name} />
      <ChatMessages />
      <ChatInput />
    </div>
  );
}
5. Send Messages with Location Verification
javascriptasync function sendMessage(message, imageUrl = null) {
  try {
    const { data, error } = await supabase.rpc('send_chat_message', {
      p_message: message,
      p_image_url: imageUrl
    });
    
    if (error) {
      if (error.message.includes('must be at the bar')) {
        // User left the location
        showError('You must be at a Side Hustle location to send messages');
        // Refresh status
        checkAccess();
      }
    }
  } catch (error) {
    console.error('Send message error:', error);
  }
}
6. Real-time Chat Updates
javascript// Subscribe to chat messages
function subscribeToChatMessages() {
  const subscription = supabase
    .channel('wolf_pack_chat')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'wolf_chat',
      filter: 'chat_type=eq.pack'
    }, (payload) => {
      // Add new message to chat
      addMessageToChat(payload.new);
    })
    .subscribe();
  
  return subscription;
}
7. Handle App States
javascript// Handle app foreground/background states
function handleAppStateChange(nextAppState) {
  if (nextAppState === 'active') {
    // App came to foreground - check location immediately
    getCurrentLocation().then(checkLocation);
  } else if (nextAppState === 'background') {
    // Sync any pending locations
    syncLocations();
  }
}

// Handle location permission changes
async function handlePermissionChange() {
  const { status } = await Location.getForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    // Disable chat access
    disableWolfPackChat();
    showMessage('Location access is required for Wolf Pack chat');
  }
}
Key Features of This System:

Automatic Join/Leave: Users automatically join the Wolf Pack when they arrive at a location and leave when they go
Grace Period: 15-minute grace period so users don't get kicked out if they step outside briefly
Battery Efficient: Batched location updates and smart sync intervals
Real-time Updates: Chat updates in real-time for all pack members
Push Notifications: Welcome notifications when joining the pack
Seamless UX: No manual buttons - everything happens automatically based on location

Privacy & User Experience Notes:

Transparent Permission Request: Clearly explain why location is needed
Battery Optimization: Use appropriate location accuracy and update intervals
Grace Period: Prevents frustrating disconnections
Offline Support: Queue location updates when offline
Clear Status Indicators: Always show users their Wolf Pack status

The system is now fully automated! Users just need to grant location permission once, and then they'll automatically join the Wolf Pack chat whenever they visit any of your Side Hustle locations.