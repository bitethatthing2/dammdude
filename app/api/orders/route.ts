import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { notifyStaffOfNewOrder } from '@/lib/actions/order-actions';
import { CartItem } from '@/types/wolfpack-unified';

interface CreateOrderRequest {
  items: CartItem[];
  notes?: string;
  total: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateOrderRequest = await request.json();
    const { items, notes, total } = body;

    // Validate request
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: 'Invalid order total' },
        { status: 400 }
      );
    }

    // Get user's wolfpack membership to determine table location
    const { data: wolfpackData, error: wolfpackError } = await supabase
      .from('wolfpack_memberships')
      .select('table_location')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (wolfpackError || !wolfpackData) {
      return NextResponse.json(
        { error: 'Must be a WolfPack member to place orders' },
        { status: 403 }
      );
    }

    // Create order items array for database storage using unified structure
    const orderItems = items.map(item => ({
      id: item.id,
      item_id: item.item_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || null,
      customizations: item.customizations || null,
      image_url: item.image_url || null,
      subtotal: item.subtotal
    }));

    // Create the order
    const { data: orderData, error: orderError } = await supabase
      .from('bartender_orders')
      .insert({
        customer_id: user.id,
        table_location: wolfpackData.table_location,
        tab_id: wolfpackData.table_location, // Using table_location as tab_id for now
        items: JSON.stringify(orderItems),
        total_amount: total,
        status: 'pending',
        customer_notes: notes || null
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order summary for staff notification
    const itemSummary = items
      .map(item => `${item.quantity}x ${item.name}`)
      .join(', ');

    // Notify staff of new order
    const notificationResult = await notifyStaffOfNewOrder(
      orderData.id,
      wolfpackData.table_location || 'Unknown Table',
      itemSummary
    );

    if (!notificationResult.success) {
      console.warn('Failed to notify staff of new order:', notificationResult.error);
      // Don't fail the entire request if notification fails
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderData.id,
        status: orderData.status,
        table_location: orderData.table_location,
        total_amount: orderData.total_amount,
        created_at: orderData.created_at
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's orders
    const { data: orders, error: ordersError } = await supabase
      .from('bartender_orders')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders || []
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
