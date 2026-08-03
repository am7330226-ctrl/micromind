import { Audio } from 'expo-av';

let currentSound = null;
let isPlaying = false;
let currentTrack = null;

// Free high quality ambient stream audio tracks
const AMBIENT_SOUND_URLS = {
  rain: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_6590b8f047.mp3',
  waves:
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c87ef1c0.mp3',
  forest:
    'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
  whiteNoise:
    'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
};

export async function toggleAmbientSound(trackId) {
  try {
    if (isPlaying && currentTrack === trackId) {
      await stopAmbientSound();
      return false;
    }

    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }

    const streamUrl = AMBIENT_SOUND_URLS[trackId] || AMBIENT_SOUND_URLS.rain;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: streamUrl },
      { shouldPlay: true, isLooping: true, volume: 0.6 },
    );

    currentSound = sound;
    isPlaying = true;
    currentTrack = trackId;
    return true;
  } catch (err) {
    console.error('Failed to play ambient sound:', err);
    isPlaying = false;
    currentTrack = null;
    return false;
  }
}

export async function stopAmbientSound() {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch (err) {}
    currentSound = null;
  }
  isPlaying = false;
  currentTrack = null;
}

export function getCurrentSoundState() {
  return { isPlaying, currentTrack };
}
