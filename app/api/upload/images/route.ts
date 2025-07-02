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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Handle profile image upload - use direct storage upload
    if (imageType === 'profile') {
      try {
        // Generate unique filename for profile images
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const userFolder = user.id.substring(0, 8); // Match the pattern used by handle_image_upload
        const fileName = `profile/${userFolder}/${timestamp}-${randomString}.${fileExt}`;

        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to the 'images' bucket
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          return NextResponse.json(
            { error: `Failed to upload file to storage: ${uploadError.message}` },
            { status: 500 }
          );
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        // Create image record in database
        const { data: imageData, error: imageRecordError } = await supabase.rpc('create_image_record', {
          p_name: file.name,
          p_url: publicUrl,
          p_size: file.size,
          p_type: 'profile'
        });

        if (imageRecordError) {
          console.error('Error creating image record:', imageRecordError);
          // Don't fail the whole operation, but log the error
        }

        let imageId: string | null = null;
        if (imageData && typeof imageData === 'object' && 'id' in imageData) {
          // Ensure imageId is a string
          const rawId = imageData.id;
          imageId = typeof rawId === 'string' ? rawId : String(rawId);
        }

        // Prepare update object with proper typing
        const updateData: {
          profile_pic_url: string;
          profile_image_url: string;
          custom_avatar_id?: string;
        } = {
          profile_pic_url: publicUrl,
          profile_image_url: publicUrl
        };

        // Only add custom_avatar_id if we have a valid string imageId
        if (imageId && typeof imageId === 'string') {
          updateData.custom_avatar_id = imageId;
        }

        // Update user profile with the new image URL
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
          // Don't fail the whole operation if profile update fails
        }

        return NextResponse.json({
          success: true,
          image_id: imageId,
          image_url: publicUrl,
          message: 'Profile image uploaded successfully'
        });

      } catch (error) {
        console.error('Profile upload error:', error);
        return NextResponse.json(
          { error: 'Failed to upload profile image' },
          { status: 500 }
        );
      }
    }

    // For menu item images, use the existing RPC function logic
    // Fixed: Use p_user_id instead of p_id
    const { data: rawImageId, error: uploadError } = await supabase.rpc('handle_image_upload', {
      p_user_id: user.id,  // Changed from p_id to p_user_id
      p_file_name: file.name,
      p_file_size: file.size,
      p_mime_type: file.type,
      p_image_type: imageType
    });

    if (uploadError) {
      console.error('Error creating image record:', uploadError);
      return NextResponse.json(
        { error: 'Failed to create image record' },
        { status: 500 }
      );
    }

    // Ensure imageId is a string
    const imageId = rawImageId ? String(rawImageId) : null;

    if (!imageId) {
      return NextResponse.json(
        { error: 'Failed to get image ID from database' },
        { status: 500 }
      );
    }

    // Build the URL based on how the function constructs it
    const userFolder = user.id.substring(0, 8);
    const storagePath = `${imageType}/${userFolder}/${imageId}_${file.name}`;
    const publicUrl = `https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/images/${storagePath}`;

    // Now we need to actually upload the file to storage
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: storageError } = await supabase.storage
        .from('images')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (storageError) {
        console.error('Storage upload error:', storageError);
        // Clean up the database record since upload failed
        await supabase.from('images').delete().eq('id', imageId);
        return NextResponse.json(
          { error: `Failed to upload file to storage: ${storageError.message}` },
          { status: 500 }
        );
      }
    } catch (storageUploadError) {
      console.error('Storage upload exception:', storageUploadError);
      // Clean up the database record since upload failed
      await supabase.from('images').delete().eq('id', imageId);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // If itemId is provided and this is a menu item image, update the item
    if (itemId && imageType === 'menu_item' && imageId) {
      try {
        // Validate itemId is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(itemId)) {
          console.error('Invalid itemId format:', itemId);
          return NextResponse.json(
            { error: 'Invalid item ID format' },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase.rpc('admin_update_item_image', {
          p_item_id: itemId,
          p_image_url: publicUrl
        });

        if (updateError) {
          console.error('Error linking image to menu item:', updateError);
          // Don't fail the upload, just log the error
        }
      } catch (linkError) {
        console.error('Exception linking image to menu item:', linkError);
        // Don't fail the upload, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      image_id: imageId,
      image_url: publicUrl,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Unexpected error in image upload:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

// Keep your existing GET endpoint with minor improvements
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
      // Validate itemId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(itemId)) {
        return NextResponse.json(
          { error: 'Invalid item ID format' },
          { status: 400 }
        );
      }

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
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}