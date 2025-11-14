export type ChallengeMusicTrack = {
  id: string
  title: string
  duration: string
  mood: string
  file: string
  licenseSummary: string
  licenseUrl: string
}

export const challengeMusicTracks: ChallengeMusicTrack[] = [
  {
    id: 'country-song-nobody-is-you',
    title: 'Country Song Nobody Is You',
    duration: '1:56',
    mood: 'Upbeat Country',
    file: '/audio/challenge/country-song-nobody-is-you.mp3',
    licenseSummary: 'Pixabay License – free for commercial use, no attribution required',
    licenseUrl: '/audio/challenge/licenses/country-song-nobody-is-you.txt',
  },
  {
    id: 'minecraft-music',
    title: 'Minecraft Music',
    duration: '2:18',
    mood: 'Atmospheric Beats',
    file: '/audio/challenge/minecraft-music.mp3',
    licenseSummary: 'Pixabay License – free for commercial use, no attribution required',
    licenseUrl: '/audio/challenge/licenses/minecraft-music.txt',
  },
  {
    id: 'retro-arcade-music',
    title: 'Retro Arcade Music',
    duration: '1:49',
    mood: 'Chiptune Arcade',
    file: '/audio/challenge/retro-arcade-music.mp3',
    licenseSummary: 'Pixabay License – free for commercial use, no attribution required',
    licenseUrl: '/audio/challenge/licenses/retro-arcade-music.txt',
  },
  {
    id: 'tiki-taka-banana-minion-song',
    title: 'Tiki Taka Banana Minion Song',
    duration: '2:04',
    mood: 'Playful Tropical',
    file: '/audio/challenge/tiki-taka-banana-minion-song.mp3',
    licenseSummary: 'Pixabay License – free for commercial use, no attribution required',
    licenseUrl: '/audio/challenge/licenses/tiki-taka-banana-minion-song.txt',
  },
]

export const findMusicTrack = (trackId?: string | null): ChallengeMusicTrack | null => {
  if (!trackId) {
    return null
  }
  return challengeMusicTracks.find((track) => track.id === trackId) ?? null
}

