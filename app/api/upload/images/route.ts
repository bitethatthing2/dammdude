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

    // Handle profile image upload differently
    if (imageType === 'profile') {
      try {
        // Generate unique filename for profile images
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${user.id}/profile/${timestamp}-${randomString}.${fileExt}`;

        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Try to upload to 'profiles' bucket first
        let uploadResult = await supabase.storage
          .from('profiles')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false
          });

        let bucketName = 'profiles';

        // If profiles bucket doesn't exist, try 'avatars'
        if (uploadResult.error) {
          console.log('Profiles bucket failed, trying avatars bucket:', uploadResult.error.message);
          
          uploadResult = await supabase.storage
            .from('avatars')
            .upload(fileName, buffer, {
              contentType: file.type,
              upsert: false
            });
          
          bucketName = 'avatars';

          if (uploadResult.error) {
            console.error('Storage upload error:', uploadResult.error);
            return NextResponse.json(
              { error: `Failed to upload file to storage: ${uploadResult.error.message}` },
              { status: 500 }
            );
          }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        // Update user profile with the new image URL
        const { error: updateError } = await supabase
          .from('users')
          .update({
            profile_pic_url: publicUrl,
            profile_image_url: publicUrl
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
          // Don't fail the whole operation if profile update fails
        }

        return NextResponse.json({
          success: true,
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
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // Define the return type for the RPC function
    type ImageUploadResult = {
      image_id: string;
      public_url: string;
    };

    // Call the RPC function to upload the image
    // @ts-expect-error: Custom RPC function not in generated types
        const { data: uploadResult, error: uploadError } = await supabase.rpc('admin_upload_image', {
          p_image_data: base64Data,
          p_image_type: imageType,
          p_user_id: user.id
        });

    const typedUploadResult = uploadResult as ImageUploadResult | null;

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // If itemId is provided and this is a menu item image, update the item
    if (itemId && imageType === 'menu_item' && typedUploadResult?.image_id) {
      const { error: updateError } = await supabase.rpc('admin_update_item_image', {
        p_item_id: itemId,
        p_image_url: typedUploadResult.public_url
      });

      if (updateError) {
        console.error('Error linking image to menu item:', updateError);
        // Don't fail the upload, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      image_id: typedUploadResult?.image_id || null,
      image_url: typedUploadResult?.public_url || null,
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

// Keep your existing GET endpoint as is
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