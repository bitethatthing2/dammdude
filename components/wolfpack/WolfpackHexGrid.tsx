import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Heart, 
  User,
  X,
  ArrowLeft
} from 'lucide-react';

// Properly typed Supabase client interfaces based on actual backend schema
interface SupabaseResponse<T> {
  data: T | null;
  error: PostgrestError | null;
}

interface PostgrestError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

interface SupabaseQueryBuilder<T> {
  eq: (column: string, value: string | number | boolean) => SupabaseQueryBuilder<T>;
  order: (column: string, options: { ascending: boolean }) => SupabaseQueryBuilder<T>;
  limit: (count: number) => Promise<SupabaseResponse<T[]>>;
  maybeSingle: () => Promise<SupabaseResponse<T>>;
}

interface SupabaseSelectBuilder<T> {
  eq: (column: string, value: string | number | boolean) => SupabaseQueryBuilder<T>;
  order: (column: string, options: { ascending: boolean }) => SupabaseQueryBuilder<T>;
  limit: (count: number) => Promise<SupabaseResponse<T[]>>;
  maybeSingle: () => Promise<SupabaseResponse<T>>;
}

interface SupabaseInsertBuilder<T> {
  insert: (data: Partial<T>) => Promise<SupabaseResponse<T>>;
}

interface SupabaseUpdateBuilder<T> {
  update: (data: Partial<T>) => SupabaseUpdateQueryBuilder<T>;
}

interface SupabaseUpdateQueryBuilder<T> {
  eq: (column: string, value: string) => Promise<SupabaseResponse<T>>;
}

interface SupabaseTable<T> extends SupabaseInsertBuilder<T>, SupabaseUpdateBuilder<T> {
  select: (columns: string) => SupabaseSelectBuilder<T>;
}

interface SupabaseChannelSubscription {
  unsubscribe: () => void;
}

interface RealtimeFilter {
  event: string;
  schema: string;
  table: string;
  filter: string;
}

interface SupabaseChannel {
  on: (
    event: string, 
    filter: RealtimeFilter, 
    callback: () => void
  ) => SupabaseChannelBuilder;
}

interface SupabaseChannelBuilder {
  subscribe: () => SupabaseChannelSubscription;
}

interface JoinWolfpackResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface SupabaseClient {
  from: <T>(table: string) => SupabaseTable<T>;
  channel: (name: string) => SupabaseChannel;
  rpc: (functionName: 'join_wolfpack_membership') => Promise<SupabaseResponse<JoinWolfpackResult>>;
}

// Exact interfaces matching your backend schema
interface WolfpackMemberDisplay {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  table_location: string | null;
  status: string | null;
  is_active: boolean | null;
  joined_at: string;
  last_active: string | null;
  location_id: string | null;
  session_id: string | null;
  emoji: string | null;
  current_vibe: string | null;
  role: string | null;
  position_x?: number | null;
  position_y?: number | null;
  isCurrentUser?: boolean;
}

interface FoodDrinkCategory {
  id: string;
  name: string;
  type: 'food' | 'drink';
  description?: string | null;
  display_order?: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  icon: string | null;
  color?: string | null;
}

interface WolfPackInteraction {
  id?: string;
  sender_id: string;
  receiver_id: string;
  interaction_type: 'wink' | 'message' | 'wave' | 'drink_offer';
  location_id: string | null;
  message_content?: string | null;
  metadata?: Record<string, unknown> | null;
  status: string;
  read_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface WolfpackChatMessage {
  id?: string;
  session_id: string;
  user_id: string | null;
  display_name: string;
  avatar_url?: string | null;
  content: string;
  message_type: string;
  image_url?: string | null;
  created_at?: string;
  edited_at?: string | null;
  is_flagged?: boolean | null;
  is_deleted?: boolean | null;
}

interface MenuCategory {
  name: string;
  type: 'food' | 'drink';
  icon: string | null;
  item_count: number;
}

interface HexGridProps {
  sessionId: string | null;
  currentUserId?: string;
  locationId: string | null;
  supabase: SupabaseClient;
}

export default function WolfpackHexGrid({ 
  sessionId, 
  currentUserId = 'user1',
  locationId = 'loc1',
  supabase
}: HexGridProps) {
  const [selectedMember, setSelectedMember] = useState<WolfpackMemberDisplay | null>(null);
  const [showBartenderMenu, setShowBartenderMenu] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [quickReply, setQuickReply] = useState<string>('');
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(false);
  const [members, setMembers] = useState<WolfpackMemberDisplay[]>([]);
  const [isConnected] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load wolfpack members
  const loadMembers = useCallback(async (): Promise<void> => {
    // Add null check for supabase
    if (!supabase) {
      console.warn('Supabase client not available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from<WolfpackMemberDisplay>('wolfpack_members_unified')
        .select(`
          id,
          user_id,
          display_name,
          avatar_url,
          table_location,
          status,
          is_active,
          joined_at,
          last_active,
          location_id,
          session_id,
          emoji,
          current_vibe,
          role,
          position_x,
          position_y
        `)
        .eq('location_id', locationId || '')
        .eq('is_active', true)
        .order('joined_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      const processedMembers: WolfpackMemberDisplay[] = data ? data.map((member: WolfpackMemberDisplay) => ({
        ...member,
        isCurrentUser: member.user_id === currentUserId
      })) : [];

      setMembers(processedMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      setError('Failed to load wolfpack members');
    }
  }, [locationId, currentUserId, supabase]);

  // Load menu categories
  const loadMenuCategories = useCallback(async (): Promise<void> => {
    // Add null check for supabase
    if (!supabase) {
      console.warn('Supabase client not available');
      return;
    }

    setLoadingMenu(true);
    try {
      const { data, error } = await supabase
        .from<FoodDrinkCategory>('food_drink_categories')
        .select('name, type, icon')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(20);

      if (error) {
        throw error;
      }

      const categories: MenuCategory[] = (data || []).map((category) => ({
        name: category.name,
        type: category.type,
        icon: category.icon,
        item_count: Math.floor(Math.random() * 10) + 1 // TODO: Get actual count from backend
      }));

      setMenuCategories(categories);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoadingMenu(false);
    }
  }, [supabase]);

  // Initialize data - only run when supabase is available
  useEffect(() => {
    if (supabase) {
      loadMembers();
    }
  }, [loadMembers, supabase]);

  useEffect(() => {
    if (showBartenderMenu && menuCategories.length === 0 && supabase) {
      loadMenuCategories();
    }
  }, [showBartenderMenu, menuCategories.length, loadMenuCategories, supabase]);

  // Set up real-time subscriptions - add null checks
  useEffect(() => {
    if (!locationId || !supabase) return;

    const channel = supabase
      .channel(`wolfpack_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolfpack_members_unified',
          filter: `location_id=eq.${locationId}`
        },
        () => {
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [locationId, loadMembers, supabase]);

  // Send wolfpack interaction
  const sendInteraction = useCallback(async (targetUserId: string, type: 'wink' | 'message' | 'wave' | 'drink_offer'): Promise<void> => {
    if (!currentUserId) {
      alert('You must be logged in to send interactions');
      return;
    }

    // Add null check for supabase
    if (!supabase) {
      alert('Connection not available');
      return;
    }

    try {
      const { error } = await supabase
        .from<WolfPackInteraction>('wolf_pack_interactions')
        .insert({
          sender_id: currentUserId,
          receiver_id: targetUserId,
          interaction_type: type,
          location_id: locationId,
          status: 'sent',
          metadata: {
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        throw error;
      }

      const alerts: Record<string, string> = {
        wink: 'Wink sent! 😉',
        message: 'Opening chat...',
        wave: 'Wave sent! 👋',
        drink_offer: 'Drink offer sent! 🍻'
      };
      
      alert(alerts[type]);
    } catch (err) {
      console.error('Error sending interaction:', err);
      alert('Failed to send interaction');
    }
  }, [currentUserId, locationId, supabase]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (): Promise<void> => {
    if (!quickReply.trim() || !sessionId || !currentUserId) return;

    // Add null check for supabase
    if (!supabase) {
      alert('Connection not available');
      return;
    }

    try {
      const { error } = await supabase
        .from<WolfpackChatMessage>('wolfpack_chat_messages')
        .insert({
          session_id: sessionId,
          user_id: currentUserId,
          display_name: members.find(m => m.user_id === currentUserId)?.display_name || 'Anonymous',
          content: quickReply,
          message_type: 'text'
        });

      if (error) {
        throw error;
      }

      setQuickReply('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  }, [quickReply, sessionId, currentUserId, members, supabase]);

  // Get member icon based on role
  const getMemberIcon = useCallback((member: WolfpackMemberDisplay): string => {
    if (member.role === 'dj') return '🎵';
    if (member.role === 'bartender') return '🍺'; 
    return member.emoji || '🐾';
  }, []);

  // Get member colors based on role
  const getMemberColors = useCallback((member: WolfpackMemberDisplay): string => {
    if (member.role === 'dj') return 'bg-violet-600 border-violet-400 text-white';
    if (member.role === 'bartender') return 'bg-green-600 border-green-400 text-white';
    if (member.isCurrentUser) return 'bg-blue-600 border-blue-400 text-white';
    return 'bg-slate-600 border-slate-400 text-white';
  }, []);

  // Hexagonal positioning system
  const getHexagonalPosition = useCallback((index: number, total: number): { x: number; y: number } => {
    if (total === 1) return { x: 50, y: 50 };
    
    const positions = [
      { x: 50, y: 25 },
      { x: 75, y: 37.5 },
      { x: 75, y: 62.5 },
      { x: 50, y: 75 },
      { x: 25, y: 62.5 },
      { x: 25, y: 37.5 },
    ];
    
    if (index < positions.length) {
      return positions[index];
    }
    
    const angle = (index / total) * 2 * Math.PI;
    return {
      x: 50 + Math.cos(angle) * 30,
      y: 50 + Math.sin(angle) * 25
    };
  }, []);

  // Show loading state if supabase is not available
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading state
  if (!isConnected && members.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 flex h-14 items-center">
          <button className="mr-4 p-2 hover:bg-gray-100 rounded-lg" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold">Wolfpack Chat</h1>
            <p className="text-sm text-gray-600">
              {members.length} WOLVES ONLINE {!isConnected && '(Reconnecting...)'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Hexagonal Layout */}
      <main className="relative min-h-[calc(100vh-3.5rem)] pb-24">
        {/* Central Hexagonal Platform */}
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="relative w-96 h-96 max-w-[90vw] max-h-[60vh]">
            {/* Central hexagon */}
            <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" aria-hidden="true">
              <polygon 
                points="200,50 300,100 300,200 200,250 100,200 100,100" 
                fill="rgba(0,0,0,0.05)" 
                stroke="rgba(0,0,0,0.2)" 
                strokeWidth="2"
                className="animate-pulse"
              />
              <g stroke="rgba(0,0,0,0.1)" strokeWidth="1">
                <line x1="200" y1="50" x2="200" y2="150" />
                <line x1="300" y1="100" x2="200" y2="150" />
                <line x1="300" y1="200" x2="200" y2="150" />
                <line x1="200" y1="250" x2="200" y2="150" />
                <line x1="100" y1="200" x2="200" y2="150" />
                <line x1="100" y1="100" x2="200" y2="150" />
              </g>
            </svg>

            {/* Wolf Pack Members */}
            <AnimatePresence>
              {members.map((member, index) => {
                const position = getHexagonalPosition(index, members.length);
                const colorClass = getMemberColors(member);
                const icon = getMemberIcon(member);
                
                return (
                  <motion.div
                    key={member.id}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={() => setSelectedMember(member)}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 20, 
                      delay: index * 0.1 
                    }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {/* Main Avatar Circle */}
                    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-2 transition-all duration-300 ${colorClass}`}>
                      {icon}
                      
                      {/* Role indicator ring */}
                      {(member.role === 'dj' || member.role === 'bartender') && (
                        <div className={`absolute -inset-1 rounded-full border-2 animate-pulse ${
                          member.role === 'dj' ? 'border-violet-400' : 'border-green-400'
                        }`} />
                      )}
                      
                      {/* Activity pulse */}
                      <div className="absolute -inset-2 rounded-full border-2 border-current opacity-60 animate-ping" />
                    </div>
                    
                    {/* Role badge */}
                    {member.role && (member.role === 'dj' || member.role === 'bartender') && (
                      <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-bold text-white rounded ${
                        member.role === 'dj' ? 'bg-violet-600' : 'bg-green-600'
                      }`}>
                        {member.role === 'dj' ? 'DJ' : 'BAR'}
                      </div>
                    )}
                    
                    {/* Current user indicator */}
                    {member.isCurrentUser && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                    )}
                    
                    {/* Name label */}
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border whitespace-nowrap">
                      {member.display_name || 'Anonymous'}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Bartender Menu Card */}
        {members.filter(m => m.role === 'bartender').length > 0 && (
          <motion.div 
            className="absolute top-4 right-4"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div 
              className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setShowBartenderMenu(true)}
            >
              <div className="text-center">
                <h3 className="font-bold mb-2">Bartender</h3>
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">
                  🍺
                </div>
                <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                  Food &amp; Drink Menu
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>You</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Other Wolves</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span>Bartender</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse"></div>
              <span>DJ</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t p-4">
        <div className="container mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <input 
              placeholder="Quick Replies"
              value={quickReply}
              onChange={(e) => setQuickReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
            <button className="p-2 border rounded-lg hover:bg-gray-50" aria-label="User menu">
              <User className="h-4 w-4" />
            </button>
          </div>
          
          {/* Navigation dots */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((page) => (
              <button
                key={page}
                className={`w-2 h-2 rounded-full ${
                  currentPage === page ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentPage(page)}
                aria-label={`Go to page ${page + 1}`}
              />
            ))}
          </div>
        </div>
      </footer>

      {/* Member Profile Dialog */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedMember.display_name || 'Anonymous'}
              </h3>
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${getMemberColors(selectedMember)}`}>
                  {getMemberIcon(selectedMember)}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {selectedMember.display_name || 'Anonymous'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedMember.table_location}
                  </p>
                  {selectedMember.role && (
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded inline-block">
                      {selectedMember.role === 'dj' ? 'DJ' : 
                       selectedMember.role === 'bartender' ? 'Bartender' : 
                       selectedMember.role}
                    </div>
                  )}
                </div>
              </div>

              {selectedMember.current_vibe && (
                <div>
                  <h4 className="font-medium mb-1">Current Vibe</h4>
                  <p className="text-sm text-gray-600">{selectedMember.current_vibe}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-1">Status</h4>
                <p className="text-sm text-gray-600">{selectedMember.status}</p>
              </div>
              
              {!selectedMember.isCurrentUser && (
                <div className="flex gap-2 pt-4">
                  <button 
                    onClick={() => sendInteraction(selectedMember.user_id, 'message')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                  <button 
                    onClick={() => sendInteraction(selectedMember.user_id, 'wink')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    <Heart className="w-4 h-4" />
                    Wink
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bartender Menu Dialog */}
      {showBartenderMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    🍺 Bartender Menu
                  </h2>
                  <p className="text-gray-600">Order drinks and food directly from our menu</p>
                </div>
                <button 
                  onClick={() => setShowBartenderMenu(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingMenu ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading menu...</p>
                </div>
              ) : menuCategories.length > 0 ? (
                <div className="space-y-6">
                  {/* Drink Categories */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-green-600 flex items-center gap-2">
                      🍹 Drinks
                    </h4>
                    <div className="grid gap-2">
                      {menuCategories
                        .filter(cat => cat.type === 'drink')
                        .map((category) => (
                          <div
                            key={category.name}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {category.icon || '🍹'} {category.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {category.item_count} items available
                                </div>
                              </div>
                              <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {category.item_count}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <hr />

                  {/* Food Categories */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-orange-600 flex items-center gap-2">
                      🍽️ Food
                    </h4>
                    <div className="grid gap-2">
                      {menuCategories
                        .filter(cat => cat.type === 'food')
                        .map((category) => (
                          <div
                            key={category.name}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {category.icon || '🍽️'} {category.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {category.item_count} items available
                                </div>
                              </div>
                              <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {category.item_count}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* View Full Menu Button */}
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 text-lg">
                    📋 View Full Menu ({menuCategories.reduce((total, cat) => total + cat.item_count, 0)} items)
                  </button>
                </div>
              ) : (
                /* Fallback when no categories loaded */
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="font-medium">🍺 Craft Beer Selection</div>
                    <div className="text-sm text-gray-600">Local and imported beers</div>
                  </div>
                  <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="font-medium">🍸 Signature Cocktails</div>
                    <div className="text-sm text-gray-600">House specials and classics</div>
                  </div>
                  <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="font-medium">🌮 Bar Bites</div>
                    <div className="text-sm text-gray-600">Nachos, wings, and more</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}