import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WolfpackBackendService, WOLFPACK_TABLES } from '@/lib/services/wolfpack-backend.service';
import { WolfpackAuthService } from '@/lib/services/wolfpack-auth.service';
import { WolfpackErrorHandler } from '@/lib/services/wolfpack-error.service';

// Get recent orders for wolfpack members at current location
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify user is wolfpack member at this location
    const membershipResult = await WolfpackBackendService.get(
      WOLFPACK_TABLES.WOLFPACK_MEMBERSHIPS,
      { user_id: user.id, location_id: locationId, status: 'active' }
    );

    if (membershipResult.error || !membershipResult.data?.[0]) {
      return NextResponse.json(
        { error: 'Not a wolfpack member at this location', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Get recent orders from wolfpack members at this location
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        created_at,
        order_items (
          id,
          quantity,
          unit_price,
          menu_items (
            name,
            image_url
          )
        ),
        users!inner (
          id,
          first_name,
          avatar_url,
          wolfpack_memberships!inner (
            location_id,
            status
          )
        )
      `)
      .eq('users.wolfpack_memberships.location_id', locationId)
      .eq('users.wolfpack_memberships.status', 'active')
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Transform the data for frontend consumption
    const transformedOrders = orders?.map(order => ({
      id: order.id,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      customer: {
        id: order.users.id,
        display_name: order.users.first_name || 'Anonymous Wolf',
        avatar_url: order.users.avatar_url
      },
      items: order.order_items?.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        name: item.menu_items?.name || 'Unknown Item',
        image_url: item.menu_items?.image_url
      })) || [],
      item_count: order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    })) || [];

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      location_id: locationId,
      total_count: transformedOrders.length
    });

  } catch (error) {
    console.error('Get wolfpack orders error:', error);
    const userError = WolfpackErrorHandler.handleSupabaseError(error, {
      operation: 'get_wolfpack_orders'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// Place order as wolfpack member with shared visibility
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { location_id, items, share_with_pack = true, table_location } = body;

    if (!location_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Location ID and order items are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify user is wolfpack member at this location
    const membershipResult = await WolfpackBackendService.get(
      WOLFPACK_TABLES.WOLFPACK_MEMBERSHIPS,
      { user_id: user.id, location_id: location_id, status: 'active' }
    );

    const membership = membershipResult.data?.[0];
    if (membershipResult.error || !membership) {
      return NextResponse.json(
        { error: 'Not a wolfpack member at this location', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const { data: menuItem } = await supabase
        .from('menu_items')
        .select('id, name, price, available')
        .eq('id', item.menu_item_id)
        .single();

      if (!menuItem || !menuItem.available) {
        return NextResponse.json(
          { error: `Menu item ${item.menu_item_id} not available`, code: 'ITEM_UNAVAILABLE' },
          { status: 400 }
        );
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      processedItems.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: menuItem.price,
        name: menuItem.name
      });
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        location_id: location_id,
        status: 'pending',
        total_amount: totalAmount,
        order_type: 'wolfpack',
        table_location: table_location || membership.table_location,
        created_at: new Date().toISOString()
      })
      .select('id, created_at')
      .single();

    if (orderError || !order) {
      throw orderError || new Error('Failed to create order');
    }

    // Create order items
    const orderItems = processedItems.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Clean up the order if items failed
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    // Share order with wolfpack if requested
    if (share_with_pack) {
      const displayName = WolfpackAuthService.getUserDisplayName(user);
      const itemNames = processedItems.map(item => `${item.quantity}x ${item.name}`).join(', ');
      
      const shareMessage = `🍽️ ${displayName} just ordered: ${itemNames} ($${totalAmount.toFixed(2)})`;

      await WolfpackBackendService.insert(
        WOLFPACK_TABLES.WOLF_CHAT,
        {
          session_id: `location_${location_id}`,
          user_id: user.id,
          display_name: displayName,
          avatar_url: WolfpackAuthService.getUserAvatarUrl(user),
          content: shareMessage,
          message_type: 'text',
          created_at: new Date().toISOString(),
          is_flagged: false
        }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: 'pending',
        total_amount: totalAmount,
        created_at: order.created_at,
        items: processedItems,
        shared_with_pack: share_with_pack
      }
    });

  } catch (error) {
    console.error('Create wolfpack order error:', error);
    const userError = WolfpackErrorHandler.handleSupabaseError(error, {
      operation: 'create_wolfpack_order'
    });

    return NextResponse.json(
      { error: userError.message, code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}