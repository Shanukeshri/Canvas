import { NextResponse } from 'next/server';
import { SoundTrack } from '@/types';

const SOUND_CATALOG: SoundTrack[] = [
  { id: 'sound-1', name: 'Gentle Rain', category: 'Nature', volume: 65, isPlaying: false, type: 'rain' },
  { id: 'sound-2', name: 'Cozy Fireplace', category: 'Ambient', volume: 40, isPlaying: false, type: 'fireplace' },
  { id: 'sound-3', name: 'Deep Brown Noise', category: 'Noise', volume: 25, isPlaying: false, type: 'brown' },
  { id: 'sound-4', name: 'Ocean Waves', category: 'Nature', volume: 50, isPlaying: false, type: 'ocean' },
  { id: 'sound-5', name: 'Quiet Library', category: 'Ambient', volume: 30, isPlaying: false, type: 'library' },
  { id: 'sound-6', name: 'Midnight Cafe', category: 'Ambient', volume: 35, isPlaying: false, type: 'cafe' },
  { id: 'sound-7', name: 'Smooth White Noise', category: 'Noise', volume: 20, isPlaying: false, type: 'white' },
  { id: 'sound-8', name: 'Soft Pink Noise', category: 'Noise', volume: 20, isPlaying: false, type: 'pink' },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: SOUND_CATALOG,
  });
}

