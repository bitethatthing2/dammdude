// app/api/table-identification/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get table_id from cookies
    const tableId = request.cookies.get('table_id')?.value;
    
    if (!tableId) {
      return NextResponse.json({ 
        error: 'No table ID found',
        needsSetup: true 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      tableId,
      success: true 
    });
    
  } catch (error) {
    console.error('Error in table identification:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tableId } = await request.json();
    
    if (!tableId) {
      return NextResponse.json({ 
        error: 'Table ID is required' 
      }, { status: 400 });
    }
    
    // Create response with cookie
    const response = NextResponse.json({ 
      success: true,
      tableId 
    });
    
    // Set cookie
    response.cookies.set('table_id', tableId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Error setting table ID:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}