# Wolf Pack Membership Error - Immediate Fix Guide

## Current Error Analysis

**Console Error:** `Error checking wolfpack membership: Object`
**Location:** `useWolfpackMembership.ts:54` in `checkMembership` function
**Issue:** Generic error logging provides no useful debugging information

## Immediate Fix Steps

### Step 1: Replace Error Logging in `useWolfpackMembership.ts`

Replace line 54 and surrounding error handling with this comprehensive logging:

```typescript
// In useWolfpackMembership.ts, replace the catch block around line 54:

} catch (err) {
  // DETAILED ERROR LOGGING - Replace the generic console.error
  console.error('🚨 WOLFPACK MEMBERSHIP ERROR - Full Details:');
  console.error('Error Object:', err);
  console.error('Error Message:', err?.message);
  console.error('Error Code:', err?.code);
  console.error('Error Details:', err?.details);
  console.error('Error Hint:', err?.hint);
  console.error('Error Stack:', err?.stack);
  console.error('User ID:', user?.id);
  console.error('User Email:', user?.email);
  console.error('Current URL:', window.location.href);
  
  // Handle specific Supabase error codes
  let userFriendlyMessage = 'Failed to check membership';
  
  if (err?.code === 'PGRST116') {
    console.log('✅ Normal: No membership record found (user not in wolfpack)');
    setMembership(null);
    setError(null); // This is not an error condition
    setIsLoading(false);
    return;
  } else if (err?.code === 'PGRST301') {
    console.error('🔑 JWT Authentication expired or invalid');
    userFriendlyMessage = 'Session expired. Please log in again.';
  } else if (err?.code === '42P01') {
    console.error('🗄️ Database table does not exist');
    userFriendlyMessage = 'Database configuration error';
  } else if (err?.code === 'PGRST204') {
    console.error('🔒 RLS policy blocking access');
    userFriendlyMessage = 'Permission denied';
  } else {
    console.error('❓ Unknown error type');
    userFriendlyMessage = err?.message || 'Unknown error occurred';
  }
  
  setError(userFriendlyMessage);
  setMembership(null);
}
```

### Step 2: Fix Database Query Pattern

Replace the membership query with the correct pattern:

```typescript
// Replace the query around line 30-40 in checkMembership function:

try {
  setIsLoading(true);
  setError(null);

  // Check for existing membership using CORRECT query pattern
  const { data: membershipData, error: membershipError } = await supabase
    .from('wolfpack_memberships')  // Verify this is the correct table name
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();  // Use maybeSingle() instead of single()

  // Handle the response properly
  if (membershipError) {
    throw membershipError;  // This will be caught by our detailed error handler
  }

  // Success case
  if (membershipData) {
    console.log('✅ Found active membership:', membershipData);
    setMembership(membershipData);
  } else if (isVipUser) {
    console.log('🌟 Creating VIP membership...');
    // VIP auto-creation logic here
  } else {
    console.log('ℹ️ No active membership found (normal for non-members)');
    setMembership(null);
  }
} catch (err) {
  // Use the detailed error handling from Step 1
}
```

### Step 3: Add Debug Helper Function

Add this function to help diagnose the issue:

```typescript
// Add this function to useWolfpackMembership.ts or create a separate debug file:

export const debugWolfpackMembership = async (userId: string) => {
  const supabase = getSupabaseBrowserClient();
  
  console.log('🔍 DEBUGGING WOLFPACK MEMBERSHIP');
  console.log('User ID:', userId);
  
  try {
    // Test 1: Check if user exists in auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth User:', user ? '✅ Found' : '❌ Not found');
    console.log('Auth Error:', authError);
    
    // Test 2: Check table structure
    const { data: tableTest, error: tableError } = await supabase
      .from('wolfpack_memberships')
      .select('*')
      .limit(0);
    console.log('Table Access:', tableError ? '❌ Failed' : '✅ Success');
    console.log('Table Error:', tableError);
    
    // Test 3: Count total memberships
    const { count, error: countError } = await supabase
      .from('wolfpack_memberships')
      .select('*', { count: 'exact', head: true });
    console.log('Total Memberships:', count);
    console.log('Count Error:', countError);
    
    // Test 4: Try to find user's membership
    const { data: userMembership, error: userError } = await supabase
      .from('wolfpack_memberships')
      .select('*')
      .eq('user_id', userId);
    console.log('User Memberships Found:', userMembership?.length || 0);
    console.log('User Membership Data:', userMembership);
    console.log('User Query Error:', userError);
    
    return {
      authWorking: !authError,
      tableAccessible: !tableError,
      totalMemberships: count,
      userMemberships: userMembership?.length || 0,
      errors: { authError, tableError, countError, userError }
    };
    
  } catch (error) {
    console.error('🚨 Debug function failed:', error);
    return { error };
  }
};
```

### Step 4: Immediate Testing

Run this in your browser console to debug the current issue:

```javascript
// Open browser console and run this to debug:
debugWolfpackMembership('your-user-id-here');

// Or if you have access to the current user:
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  debugWolfpackMembership(user.id);
}
```

## Expected Outcomes

After implementing these fixes, you should see:

1. **Detailed error information** instead of "Object"
2. **Specific error codes** that help identify the root cause
3. **Clear indication** of whether this is a normal "no membership" case or an actual error
4. **Debug information** to help troubleshoot database access issues

## Most Likely Root Causes

Based on the generic "Object" error, this is probably:

1. **RLS Policy Issue** - User can't read their own membership record
2. **Table Name Mismatch** - Code looking for wrong table name
3. **JWT Expiration** - Authentication token is invalid
4. **Database Connection** - Supabase client not properly configured

## Performance Issues (CLS)

The Cumulative Layout Shift (CLS) issues suggest the membership checking is causing layout reflows. After fixing the membership errors, also consider:

```typescript
// Add loading states to prevent layout shifts
const [isLoadingMembership, setIsLoadingMembership] = useState(true);

// Use skeleton loading components instead of conditional rendering
return isLoadingMembership ? (
  <SkeletonComponent />
) : (
  <ActualContent />
);
```

Run these fixes and check the console for the detailed error information!
