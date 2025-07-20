import { useState, useEffect, useCallback } from 'react'
import { 
  getFeedPosts, 
  getPost, 
  getUserPosts, 
  createPost, 
  updatePost, 
  deletePost,
  incrementViewCount,
  getPostStats
} from '@/lib/database/posts'
import { Database } from '@/types/database.types'

type WolfpackVideo = Database['public']['Tables']['wolfpack_videos']['Row'] & {
  user?: Pick<Database['public']['Tables']['users']['Row'], 'id' | 'first_name' | 'last_name' | 'avatar_url' | 'display_name'>
  like_count?: number
  comment_count?: number
  user_liked?: boolean
}

interface UsePostsReturn {
  posts: WolfpackVideo[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<void>
  refetch: () => Promise<void>
  createNewPost: (postData: {
    title?: string
    description?: string
    video_url: string
    thumbnail_url?: string
    duration?: number
  }) => Promise<WolfpackVideo>
}

export function useFeedPosts(limit = 20): UsePostsReturn {
  const [posts, setPosts] = useState<WolfpackVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const loadPosts = useCallback(async (reset = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentOffset = reset ? 0 : offset
      const newPosts = await getFeedPosts(limit, currentOffset)
      
      if (reset) {
        setPosts(newPosts)
        setOffset(newPosts.length)
      } else {
        setPosts(prev => [...prev, ...newPosts])
        setOffset(prev => prev + newPosts.length)
      }
      
      setHasMore(newPosts.length === limit)
    } catch (err) {
      console.error('Error loading posts:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [limit, offset])

  useEffect(() => {
    loadPosts(true)
  }, []) // Only run on mount, loadPosts handles its own dependencies

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await loadPosts(false)
  }, [hasMore, loading, loadPosts])

  const refetch = useCallback(async () => {
    setOffset(0)
    await loadPosts(true)
  }, [loadPosts])

  const createNewPost = useCallback(async (postData: {
    title?: string
    description?: string
    video_url: string
    thumbnail_url?: string
    duration?: number
  }) => {
    try {
      const newPost = await createPost(postData)
      
      // Add to beginning of posts
      setPosts(prev => [newPost, ...prev])
      
      return newPost
    } catch (err) {
      console.error('Error creating post:', err)
      throw err
    }
  }, [])

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    createNewPost
  }
}

interface UseSinglePostReturn {
  post: WolfpackVideo | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updatePostData: (updates: {
    title?: string
    description?: string
    thumbnail_url?: string
  }) => Promise<void>
  deletePostData: () => Promise<void>
  recordView: () => Promise<void>
  stats: {
    views: number
    likes: number
    comments: number
  }
}

export function usePost(postId: string): UseSinglePostReturn {
  const [post, setPost] = useState<WolfpackVideo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [stats, setStats] = useState({ views: 0, likes: 0, comments: 0 })

  const loadPost = useCallback(async () => {
    if (!postId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const [postData, postStats] = await Promise.all([
        getPost(postId),
        getPostStats(postId)
      ])
      
      setPost(postData)
      setStats(postStats)
    } catch (err) {
      console.error('Error loading post:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    loadPost()
  }, [loadPost])

  const refetch = useCallback(async () => {
    await loadPost()
  }, [loadPost])

  const updatePostData = useCallback(async (updates: {
    title?: string
    description?: string
    thumbnail_url?: string
  }) => {
    if (!postId) throw new Error('No post ID')
    
    try {
      const updatedPost = await updatePost(postId, updates)
      setPost(updatedPost)
    } catch (err) {
      console.error('Error updating post:', err)
      throw err
    }
  }, [postId])

  const deletePostData = useCallback(async () => {
    if (!postId) throw new Error('No post ID')
    
    try {
      await deletePost(postId)
      setPost(null)
    } catch (err) {
      console.error('Error deleting post:', err)
      throw err
    }
  }, [postId])

  const recordView = useCallback(async () => {
    if (!postId) return
    
    try {
      await incrementViewCount(postId)
      setStats(prev => ({ ...prev, views: prev.views + 1 }))
    } catch (err) {
      console.error('Error recording view:', err)
      // Don't throw as this is not critical
    }
  }, [postId])

  return {
    post,
    loading,
    error,
    refetch,
    updatePostData,
    deletePostData,
    recordView,
    stats
  }
}

export function useUserPosts(userId: string, limit = 20) {
  const [posts, setPosts] = useState<WolfpackVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const loadPosts = useCallback(async (reset = false) => {
    if (!userId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const currentOffset = reset ? 0 : offset
      const newPosts = await getUserPosts(userId, limit, currentOffset)
      
      if (reset) {
        setPosts(newPosts)
        setOffset(newPosts.length)
      } else {
        setPosts(prev => [...prev, ...newPosts])
        setOffset(prev => prev + newPosts.length)
      }
      
      setHasMore(newPosts.length === limit)
    } catch (err) {
      console.error('Error loading user posts:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId, limit, offset])

  useEffect(() => {
    loadPosts(true)
  }, [userId]) // Reset when userId changes

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await loadPosts(false)
  }, [hasMore, loading, loadPosts])

  const refetch = useCallback(async () => {
    setOffset(0)
    await loadPosts(true)
  }, [loadPosts])

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refetch
  }
}