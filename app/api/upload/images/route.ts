import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const itemId = formData.get('itemId') as string;
    const imageType = formData.get('imageType') as string || 'menu_item';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user (for admin operations)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Convert file to base64 for Supabase function
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // Call existing Supabase handle_image_upload function
    const { data: uploadResult, error: uploadError } = await supabase.rpc('handle_image_upload', {
      p_user_id: user.id,
      p_file_name: file.name,
      p_file_size: file.size,
      p_mime_type: file.type,
      p_image_type: imageType
    }) as { data: { image_id: string; public_url: string } | null; error: any };

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // If itemId is provided and this is a menu item image, update the item
    if (itemId && imageType === 'menu_item' && uploadResult?.image_id) {
      const { error: updateError } = await supabase.rpc('admin_update_item_image', {
        p_item_id: itemId,
        p_image_url: uploadResult.public_url
      });

      if (updateError) {
        console.error('Error linking image to menu item:', updateError);
        // Don't fail the upload, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      image_id: uploadResult?.image_id || null,
      image_url: uploadResult?.public_url || null,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Unexpected error in image upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve images
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageType = searchParams.get('imageType');
    const itemId = searchParams.get('itemId');

    const supabase = await createClient();

    let query = supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (imageType) {
      query = query.eq('image_type', imageType);
    }

    if (itemId) {
      // Get image for specific menu item
      const { data: itemData, error: itemError } = await supabase
        .from('food_drink_items')
        .select('image_id')
        .eq('id', itemId)
        .single();

      if (itemError) {
        return NextResponse.json(
          { error: 'Menu item not found' },
          { status: 404 }
        );
      }

      if (itemData.image_id) {
        query = query.eq('id', itemData.image_id);
      } else {
        return NextResponse.json({ data: [] });
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching images:', error);
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });

  } catch (error) {
    console.error('Unexpected error in image fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
