// Canciones de DELTARUNE (Toby Fox), guardadas en Cloudinary: portfolio/music/<playlist>/<file>.mp3
// Generado a partir de lo subido. 'next' = canción que suena justo después (ej. Field -> Garden of Hopes and Dreams)

export type Playlist = 'menu' | 'game' | 'room'

export interface MusicTrack {
  title: string
  file: string
  url: string
  weight?: number // solo en la sala secreta: probabilidad relativa
  next?: string // file de la canción que va justo después
}

export const library: Record<Playlist, MusicTrack[]> = {
  // Inicio y selector de idioma
  menu: [
    { title: "ANOTHER HIM", file: 'AUDIO_ANOTHERHIM', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807339/portfolio/music/menu/AUDIO_ANOTHERHIM.mp3' },
    { title: "Empty Town", file: 'castletown_empty', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807342/portfolio/music/menu/castletown_empty.mp3' },
    { title: "Quiet Autumn", file: 'quiet_autumn', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807345/portfolio/music/menu/quiet_autumn.mp3' },
    { title: "Thrash Machine", file: 'thrashmachine', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807349/portfolio/music/menu/thrashmachine.mp3' },
    { title: "Hip Shop", file: 'hip_shop', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807356/portfolio/music/menu/hip_shop.mp3' },
    { title: "A Town Called Hometown", file: 'town', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807362/portfolio/music/menu/town.mp3' },
    { title: "You Can Always Come Home", file: 'home', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807370/portfolio/music/menu/home.mp3' },
    { title: "Before the Story", file: 'AUDIO_STORY', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807375/portfolio/music/menu/AUDIO_STORY.mp3' },
    { title: "My Castle Town", file: 'castletown', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807381/portfolio/music/menu/castletown.mp3' },
    { title: "Elegant Entrance", file: 'mansion_entrance', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807387/portfolio/music/menu/mansion_entrance.mp3' },
    { title: "Another Day in Hometown", file: 'town_day', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807395/portfolio/music/menu/town_day.mp3' },
    { title: "Castle Funk", file: 'castle_funk_long', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807404/portfolio/music/menu/castle_funk_long.mp3' },
    { title: "Festival", file: 'festival', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807410/portfolio/music/menu/festival.mp3' }
  ],
  // Proyectos, Información y Contacto
  game: [
    { title: "Rude Buster", file: 'battle', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807413/portfolio/music/game/battle.mp3' },
    { title: "Field of Hopes and Dreams", file: 'field_of_hopes', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807421/portfolio/music/game/field_of_hopes.mp3' },
    { title: "Scarlet Forest", file: 'forest', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807429/portfolio/music/game/forest.mp3' },
    { title: "Card Castle", file: 'card_castle', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807434/portfolio/music/game/card_castle.mp3' },
    { title: "Chaos King", file: 'kingboss', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807441/portfolio/music/game/kingboss.mp3' },
    { title: "THE WORLD REVOLVING", file: 'joker', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807446/portfolio/music/game/joker.mp3' },
    { title: "A CYBER'S WORLD?", file: 'cyber', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807458/portfolio/music/game/cyber.mp3' },
    { title: "Smart Race", file: 'mus_race', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807462/portfolio/music/game/mus_race.mp3' },
    { title: "WELCOME TO THE CITY", file: 'cybercity', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807467/portfolio/music/game/cybercity.mp3' },
    { title: "NOW'S YOUR CHANCE TO BE A", file: 'spamton_battle', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807471/portfolio/music/game/spamton_battle.mp3' },
    { title: "Pandora Palace", file: 'mansion', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807476/portfolio/music/game/mansion.mp3' },
    { title: "Acid Tunnel of Love", file: 'acid_tunnel', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807480/portfolio/music/game/acid_tunnel.mp3' },
    { title: "BIG SHOT", file: 'spamton_neo_mix_ex_wip', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807486/portfolio/music/game/spamton_neo_mix_ex_wip.mp3' },
    { title: "Attack of the Killer Queen", file: 'queen_boss', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807492/portfolio/music/game/queen_boss.mp3' },
    { title: "Ruder Buster", file: 'rudebuster_boss', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807498/portfolio/music/game/rudebuster_boss.mp3' },
    { title: "TV WORLD", file: 'tv_world', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807505/portfolio/music/game/tv_world.mp3' },
    { title: "It's TV Time!", file: 'tenna_battle', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807514/portfolio/music/game/tenna_battle.mp3' },
    { title: "SWORD", file: 'board_sword_music', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807519/portfolio/music/game/board_sword_music.mp3' },
    { title: "Hammer of Justice", file: 'gerson_theme_intro', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807524/portfolio/music/game/gerson_theme_intro.mp3' },
    { title: "The Second Sanctuary", file: 'second_church', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807531/portfolio/music/game/second_church.mp3' },
    { title: "Flower Castle", file: 'flower_castle', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807543/portfolio/music/game/flower_castle.mp3' },
    { title: "Flower Man", file: 'Flowerman_Arrangement', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807551/portfolio/music/game/Flowerman_Arrangement.mp3' }
  ],
  // Sala secreta (60 / 17 / 17 / 6 %)
  room: [
    { title: "man", file: 'man', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807553/portfolio/music/room/man.mp3', weight: 60 },
    { title: "man (NES)", file: 'man_nes', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807554/portfolio/music/room/man_nes.mp3', weight: 17 },
    { title: "man 2", file: 'man_2', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807557/portfolio/music/room/man_2.mp3', weight: 17 },
    { title: "DELTARUNE Piano Collections (Trevor Alan Gomes)", file: 'deltarune_piano_collections_by_trevor_alan_gomes', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807560/portfolio/music/room/deltarune_piano_collections_by_trevor_alan_gomes.mp3', weight: 6 }
  ]
}

// Elige según el peso de cada canción (la sala secreta). rand se inyecta para poder probarlo
export function weightedPick(tracks: MusicTrack[], rand = Math.random): MusicTrack {
  const total = tracks.reduce((sum, t) => sum + (t.weight ?? 1), 0)
  let roll = rand() * total
  for (const track of tracks) {
    roll -= track.weight ?? 1
    if (roll < 0) return track
  }
  return tracks[tracks.length - 1]
}
