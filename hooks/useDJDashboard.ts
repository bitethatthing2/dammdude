// hooks/useDJDashboard.ts
// Unified hook that combines DJ permissions, wolfpack data, and dashboard functionality

import { useState, useEffect, useCallback, useRef } from 'react'
import { djDashboardService, LOCATION_CONFIG } from '@/lib/supabase-client'
import { enhancedWolfpackClient, type EnhancedWolfpackMember, type WolfpackStats } from '@/lib/supabase/enhanced-wolfpack-client'
import type { 
  Database, 
  DJDashboardState, 
  ActiveBroadcastLive, 
  WolfpackLiveStats, 
  BroadcastAnalytics,
  User,
  LocationKey 
} from '@/types/database.types'
import { toast } from 'sonner'

export interface DJDashboardData {
  // Core DJ data
  dashboardState: DJDashboardState | null
  activeBroadcasts: ActiveBroadcastLive[]
  analytics: BroadcastAnalytics | null
  isLive: boolean
  sessionId: string | null

  // Wolfpack data
  wolfpackMembers: EnhancedWolfpackMember[]
  wolfpackStats: WolfpackStats | null
  liveStats: WolfpackLiveStats | null

  // User data
  currentUser: User | null
  userMembership: any | null

  // UI state
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  lastUpdated: string | null
}

export interface DJPermissions {
  isActiveDJ: boolean
  canSendMassMessages: boolean
  canManageEvents: boolean
  canViewAnalytics: boolean
  assignedLocation: LocationKey | null
  permissions: any
}

export interface DJDashboardActions {
  // Core actions
  refreshData: (showLoading?: boolean) => Promise<void>
  toggleLiveStatus: () => Promise<void>
  
  // Broadcast actions
  sendQuickVibeCheck: () => Promise<void>
  sendSingleLadiesSpotlight: (customMessage?: string) => Promise<void>
  createBroadcast: (data: Database['public']['Tables']['dj_broadcasts']['Insert']) => Promise<void>
  
  // Wolfpack actions
  refreshWolfpackData: () => Promise<void>
  getMembersByGender: (gender?: string) => EnhancedWolfpackMember[]
  getMembersByTier: (tier?: string) => EnhancedWolfpackMember[]
  getTopVibers: (limit?: number) => EnhancedWolfpackMember[]
  
  // Real-time management
  subscribeToRealtime: () => void
  unsubscribeFromRealtime: () => void
}

export function useDJDashboard(location?: LocationKey) {
  // State management
  const [dashboardData, setDashboardData] = useState<DJDashboardData>({
    dashboardState: null,
    activeBroadcasts: [],
    analytics: null,
    isLive: false,
    sessionId: null,
    wolfpackMembers: [],
    wolfpackStats: null,
    liveStats: null,
    currentUser: null,
    userMembership: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
    lastUpdated: null
  })

  const [permissions, setPermissions] = useState<DJPermissions>({
    isActiveDJ: false,
    canSendMassMessages: false,
    canManageEvents: false,
    canViewAnalytics: false,
    assignedLocation: null,
    permissions: null
  })

  // Refs for cleanup
  const realtimeChannelRef = useRef<any>(null)
  const wolfpackChannelRef = useRef<any>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get current location config
  const currentLocation = location || permissions.assignedLocation || 'salem'
  const locationConfig = LOCATION_CONFIG[currentLocation]

  // Load initial data and permissions
  const loadInitialData = useCallback(async () => {
    try {
      setDashboardData(prev => ({ ...prev, isLoading: true, error: null }))

      // Load current user and validate permissions
      const currentUser = await djDashboardService.getCurrentUser()
      if (!currentUser) {
        throw new Error('Authentication required')
      }

      // Validate DJ permissions
      const djPermissions = await djDashboardService.validateDJPermissions(currentUser.id)
      setPermissions({
        isActiveDJ: djPermissions.isActiveDJ,
        canSendMassMessages: djPermissions.canSendMassMessages,
        canManageEvents: djPermissions.permissions?.can_manage_events || djPermissions.isActiveDJ,
        canViewAnalytics: djPermissions.permissions?.can_view_analytics || djPermissions.isActiveDJ,
        assignedLocation: djPermissions.assignedLocation as LocationKey,
        permissions: djPermissions.permissions
      })

      // Only proceed if user has DJ permissions
      if (!djPermissions.isActiveDJ) {
        setDashboardData(prev => ({ 
          ...prev, 
          isLoading: false, 
          currentUser,
          error: 'DJ permissions required' 
        }))
        return
      }

      // Load dashboard data in parallel
      const [
        dashboardResult,
        wolfpackMembers,
        wolfpackStats,
        userMembership
      ] = await Promise.all([
        djDashboardService.fetchDashboardData(currentUser.id, locationConfig.id),
        enhancedWolfpackClient.getWolfpackMembers(locationConfig.id),
        enhancedWolfpackClient.getWolfpackStats(locationConfig.id),
        enhancedWolfpackClient.getCurrentUserProfile()
      ])

      setDashboardData(prev => ({
        ...prev,
        dashboardState: dashboardResult.dashboardState,
        activeBroadcasts: dashboardResult.activeBroadcasts,
        analytics: dashboardResult.analytics,
        liveStats: dashboardResult.wolfpackStats,
        isLive: dashboardResult.dashboardState?.is_live || false,
        wolfpackMembers: wolfpackMembers.data || [],
        wolfpackStats: wolfpackStats.data,
        currentUser,
        userMembership: userMembership.data,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      }))

    } catch (error) {
      console.error('Error loading initial data:', error)
      setDashboardData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }))
    }
  }, [locationConfig.id])

  // Refresh data function
  const refreshData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setDashboardData(prev => ({ ...prev, isLoading: true }))
      } else {
        setDashboardData(prev => ({ ...prev, isRefreshing: true }))
      }

      const currentUser = dashboardData.currentUser
      if (!currentUser || !permissions.isActiveDJ) return

      // Refresh data in parallel
      const [
        dashboardResult,
        wolfpackMembers,
        wolfpackStats
      ] = await Promise.all([
        djDashboardService.fetchDashboardData(currentUser.id, locationConfig.id),
        enhancedWolfpackClient.getWolfpackMembers(locationConfig.id),
        enhancedWolfpackClient.getWolfpackStats(locationConfig.id)
      ])

      setDashboardData(prev => ({
        ...prev,
        dashboardState: dashboardResult.dashboardState,
        activeBroadcasts: dashboardResult.activeBroadcasts,
        analytics: dashboardResult.analytics,
        liveStats: dashboardResult.wolfpackStats,
        isLive: dashboardResult.dashboardState?.is_live || false,
        wolfpackMembers: wolfpackMembers.data || [],
        wolfpackStats: wolfpackStats.data,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastUpdated: new Date().toISOString()
      }))

    } catch (error) {
      console.error('Error refreshing data:', error)
      setDashboardData(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Failed to refresh data'
      }))
    }
  }, [dashboardData.currentUser, permissions.isActiveDJ, locationConfig.id])

  // Toggle live status
  const toggleLiveStatus = useCallback(async () => {
    try {
      const currentUser = dashboardData.currentUser
      if (!currentUser) return

      const newLiveStatus = !dashboardData.isLive

      await djDashboardService.updateLiveStatus(currentUser.id, newLiveStatus)
      
      setDashboardData(prev => ({ ...prev, isLive: newLiveStatus }))

      toast.success(
        newLiveStatus 
          ? '🎵 You are now LIVE! Your audience can see you.' 
          : '📴 You are now offline.'
      )

      // Create system broadcast when going live
      if (newLiveStatus) {
        await djDashboardService.createBroadcast({
          dj_id: currentUser.id,
          location_id: locationConfig.id,
          broadcast_type: 'general',
          title: '🎵 DJ is LIVE!',
          message: `The DJ is now live at ${locationConfig.displayName}! Get ready to party!`,
          priority: 'high',
          duration_seconds: 10,
          status: 'active',
          auto_close: true,
          background_color: '#000000',
          text_color: '#ffffff',
          accent_color: '#ffffff',
          animation_type: 'pulse',
          emoji_burst: ['🎵', '🎶', '🎤']
        })
      }

      // Refresh data to show new broadcast
      await refreshData(false)

    } catch (error) {
      console.error('Error toggling live status:', error)
      toast.error('Unable to change live status. Please try again.')
    }
  }, [dashboardData.currentUser, dashboardData.isLive, locationConfig, refreshData])

  // Send quick vibe check
  const sendQuickVibeCheck = useCallback(async () => {
    try {
      const currentUser = dashboardData.currentUser
      if (!currentUser) return

      await djDashboardService.sendQuickVibeCheck(currentUser.id, locationConfig.id)
      
      toast.success('✨ Vibe check sent! Check responses in Active tab.')
      await refreshData(false)

    } catch (error) {
      console.error('Error sending vibe check:', error)
      toast.error('Failed to send vibe check')
    }
  }, [dashboardData.currentUser, locationConfig.id, refreshData])

  // Send single ladies spotlight
  const sendSingleLadiesSpotlight = useCallback(async (customMessage?: string) => {
    try {
      const currentUser = dashboardData.currentUser
      if (!currentUser) return

      await djDashboardService.sendSingleLadiesSpotlight(
        currentUser.id, 
        locationConfig.id, 
        customMessage
      )
      
      toast.success('💃 Ladies spotlight is ON! Let them shine!')
      await refreshData(false)

    } catch (error) {
      console.error('Error sending ladies spotlight:', error)
      toast.error('Failed to activate spotlight')
    }
  }, [dashboardData.currentUser, locationConfig.id, refreshData])

  // Create broadcast
  const createBroadcast = useCallback(async (broadcastData: Database['public']['Tables']['dj_broadcasts']['Insert']) => {
    try {
      await djDashboardService.createBroadcast(broadcastData)
      
      toast.success('📢 Broadcast sent successfully!')
      await refreshData(false)

    } catch (error) {
      console.error('Error creating broadcast:', error)
      toast.error('Failed to send broadcast')
    }
  }, [refreshData])

  // Refresh wolfpack data
  const refreshWolfpackData = useCallback(async () => {
    try {
      const [wolfpackMembers, wolfpackStats] = await Promise.all([
        enhancedWolfpackClient.getWolfpackMembers(locationConfig.id),
        enhancedWolfpackClient.getWolfpackStats(locationConfig.id)
      ])

      setDashboardData(prev => ({
        ...prev,
        wolfpackMembers: wolfpackMembers.data || [],
        wolfpackStats: wolfpackStats.data,
        lastUpdated: new Date().toISOString()
      }))

    } catch (error) {
      console.error('Error refreshing wolfpack data:', error)
    }
  }, [locationConfig.id])

  // Helper functions for member filtering
  const getMembersByGender = useCallback((gender?: string) => {
    if (!gender) return dashboardData.wolfpackMembers
    return dashboardData.wolfpackMembers.filter(member => member.user_gender === gender)
  }, [dashboardData.wolfpackMembers])

  const getMembersByTier = useCallback((tier?: string) => {
    if (!tier) return dashboardData.wolfpackMembers
    return dashboardData.wolfpackMembers.filter(member => member.tier === tier)
  }, [dashboardData.wolfpackMembers])

  const getTopVibers = useCallback((limit = 5) => {
    return dashboardData.wolfpackMembers
      .filter(member => member.current_vibe && member.is_active)
      .sort((a, b) => {
        const aLastActive = a.last_active ? new Date(a.last_active).getTime() : 0
        const bLastActive = b.last_active ? new Date(b.last_active).getTime() : 0
        return bLastActive - aLastActive
      })
      .slice(0, limit)
  }, [dashboardData.wolfpackMembers])

  // Real-time subscription management
  const subscribeToRealtime = useCallback(() => {
    if (!permissions.isActiveDJ || !dashboardData.currentUser) return

    // Subscribe to DJ dashboard changes
    realtimeChannelRef.current = djDashboardService.subscribeToRealtime(locationConfig.id, {
      onBroadcastChange: () => {
        refreshData(false)
      },
      onResponseChange: (payload) => {
        // Update response counts in real-time
        setDashboardData(prev => ({
          ...prev,
          activeBroadcasts: prev.activeBroadcasts.map(broadcast =>
            broadcast.id === payload.new?.broadcast_id
              ? {
                  ...broadcast,
                  interaction_count: (broadcast.interaction_count || 0) + 1,
                  unique_participants: (broadcast.unique_participants || 0) + 1
                }
              : broadcast
          )
        }))
      },
      onDashboardStateChange: () => {
        refreshData(false)
      }
    })

    // Subscribe to wolfpack changes
    wolfpackChannelRef.current = enhancedWolfpackClient.subscribeToWolfpackChanges(locationConfig.id, {
      onMemberJoined: (member) => {
        setDashboardData(prev => ({
          ...prev,
          wolfpackMembers: [...prev.wolfpackMembers, member],
          lastUpdated: new Date().toISOString()
        }))
        toast.success(`${member.display_name || 'Someone'} joined the wolfpack! 🐺`)
      },
      onMemberLeft: (userId) => {
        setDashboardData(prev => ({
          ...prev,
          wolfpackMembers: prev.wolfpackMembers.filter(m => m.user_id !== userId),
          lastUpdated: new Date().toISOString()
        }))
      },
      onMemberUpdated: (member) => {
        setDashboardData(prev => ({
          ...prev,
          wolfpackMembers: prev.wolfpackMembers.map(m => 
            m.user_id === member.user_id ? member : m
          ),
          lastUpdated: new Date().toISOString()
        }))
      },
      onStatsChanged: (stats) => {
        setDashboardData(prev => ({
          ...prev,
          wolfpackStats: stats,
          lastUpdated: new Date().toISOString()
        }))
      },
      onError: (error) => {
        console.error('Wolfpack realtime error:', error)
      }
    })

  }, [permissions.isActiveDJ, dashboardData.currentUser, locationConfig.id, refreshData])

  // Unsubscribe from real-time
  const unsubscribeFromRealtime = useCallback(() => {
    if (realtimeChannelRef.current) {
      djDashboardService.unsubscribeFromRealtime(realtimeChannelRef.current)
      realtimeChannelRef.current = null
    }

    if (wolfpackChannelRef.current) {
      enhancedWolfpackClient.unsubscribe(wolfpackChannelRef.current)
      wolfpackChannelRef.current = null
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Set up real-time subscriptions when DJ permissions are confirmed
  useEffect(() => {
    if (permissions.isActiveDJ && dashboardData.currentUser && !dashboardData.isLoading) {
      subscribeToRealtime()

      // Set up refresh interval
      refreshIntervalRef.current = setInterval(() => {
        refreshData(false)
      }, 30000) // Refresh every 30 seconds
    }

    return () => {
      unsubscribeFromRealtime()
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [permissions.isActiveDJ, dashboardData.currentUser, dashboardData.isLoading, subscribeToRealtime, unsubscribeFromRealtime, refreshData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromRealtime()
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [unsubscribeFromRealtime])

  // Actions object
  const actions: DJDashboardActions = {
    refreshData,
    toggleLiveStatus,
    sendQuickVibeCheck,
    sendSingleLadiesSpotlight,
    createBroadcast,
    refreshWolfpackData,
    getMembersByGender,
    getMembersByTier,
    getTopVibers,
    subscribeToRealtime,
    unsubscribeFromRealtime
  }

  return {
    // Data
    data: dashboardData,
    permissions,
    locationConfig,
    
    // Actions
    actions,
    
    // Convenience getters
    isReady: !dashboardData.isLoading && permissions.isActiveDJ,
    hasError: !!dashboardData.error,
    memberCount: dashboardData.wolfpackMembers.length,
    activeBroadcastCount: dashboardData.activeBroadcasts.filter(b => b.status === 'active').length,
    energyLevel: dashboardData.liveStats?.energy_level || 0,
    
    // Computed stats
    stats: {
      totalMembers: dashboardData.wolfpackMembers.length,
      activeMembers: dashboardData.wolfpackMembers.filter(m => m.is_active).length,
      onlineMembers: dashboardData.wolfpackMembers.filter(m => m.user_is_online).length,
      totalBroadcasts: dashboardData.activeBroadcasts.length,
      activeBroadcasts: dashboardData.activeBroadcasts.filter(b => b.status === 'active').length,
      totalResponses: dashboardData.analytics?.total_responses || 0,
      uniqueResponders: dashboardData.analytics?.unique_responders || 0,
      avgResponseTime: dashboardData.analytics?.avg_response_time_seconds || 0
    }
  }
}

export type UseDJDashboardReturn = ReturnType<typeof useDJDashboard>