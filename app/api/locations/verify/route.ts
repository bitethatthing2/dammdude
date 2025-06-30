import { NextRequest, NextResponse } from 'next/server';
import { WolfpackLocationService } from '@/lib/services/wolfpack-location.service';
import { WolfpackErrorHandler } from '@/lib/services/wolfpack-backend.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid coordinates', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Find nearest location
    const nearest = WolfpackLocationService.findNearestLocation({ latitude, longitude });

    if (!nearest.location || !nearest.locationData) {
      return NextResponse.json({
        location_id: null,
        name: null,
        can_join: false,
        distance: nearest.distance,
        message: 'No Side Hustle Bar locations nearby'
      });
    }

    const canJoin = nearest.distance <= nearest.locationData.radius;

    return NextResponse.json({
      location_id: nearest.locationData.id,
      name: nearest.locationData.name,
      can_join: canJoin,
      distance: nearest.distance,
      formatted_distance: WolfpackLocationService.formatDistance(nearest.distance),
      address: nearest.locationData.address
    });

  } catch (error) {
    console.error('Location verification error:', error);
    const userError = WolfpackErrorHandler.handleLocationError(error);

    return NextResponse.json(
      { error: userError.message, code: 'LOCATION_ERROR' },
      { status: 500 }
    );
  }
}