// Canciones de DELTARUNE (Toby Fox), en Cloudinary: portfolio/music/<lista>/<archivo>
// Generado a partir de lo subido (scratchpad/audio/gen_library.py)

export type Playlist = 'menu' | 'game' | 'room'

export interface MusicTrack {
  title: string
  file: string
  url: string
  intro?: string // se toca antes y `url` sigue justo después, sin corte (ej. Garden of Hopes and Dreams)
  next?: string // file de la canción que suena justo después (Field -> Garden)
  weight?: number // solo en la habitación secreta: probabilidad relativa
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
    { title: "Faint Glow", file: 'menu', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814077/portfolio/music/menu/menu.mp3' },
    { title: "My Castle Town", file: 'castletown', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807381/portfolio/music/menu/castletown.mp3' },
    { title: "Holiday Studio", file: 'cybershop_christmas', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814083/portfolio/music/menu/cybershop_christmas.mp3' },
    { title: "Elegant Entrance", file: 'mansion_entrance', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807387/portfolio/music/menu/mansion_entrance.mp3' },
    { title: "Welcome to the Green Room", file: 'greenroom_detune', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814088/portfolio/music/menu/greenroom_detune.mp3' },
    { title: "Glowing Snow", file: 'tv_results_screen', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814098/portfolio/music/menu/tv_results_screen.mp3' },
    { title: "Another Day in Hometown", file: 'town_day', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807395/portfolio/music/menu/town_day.mp3' },
    { title: "Castle Funk", file: 'castle_funk_long', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807404/portfolio/music/menu/castle_funk_long.mp3' },
    { title: "ATRIUM", file: 'darkchurch_intro', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814103/portfolio/music/menu/darkchurch_intro.mp3' },
    { title: "Fireplace", file: 'church_dark_study', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814117/portfolio/music/menu/church_dark_study.mp3' },
    { title: "Neverending Night", file: 'ch4_credits', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814127/portfolio/music/menu/ch4_credits.mp3' },
    { title: "With Hope Crossed On Our Hearts", file: 'quiet_church', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814136/portfolio/music/menu/quiet_church.mp3' },
    { title: "Festival", file: 'festival', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807410/portfolio/music/menu/festival.mp3' },
    { title: "Quiet Glade", file: 'piano_ambience', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814155/portfolio/music/menu/piano_ambience.mp3' },
    { title: "Dreamwatchers", file: 'flowery_iog_extended', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814163/portfolio/music/menu/flowery_iog_extended.mp3' }
  ],
  // Proyectos, Información y Contacto
  game: [
    { title: "Rude Buster", file: 'battle', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807413/portfolio/music/game/battle.mp3' },
    { title: "Field of Hopes and Dreams", file: 'field_of_hopes', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807421/portfolio/music/game/field_of_hopes.mp3', next: 'field_of_hopes_insaneintherain_loop' },
    { title: "Scarlet Forest", file: 'forest', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807429/portfolio/music/game/forest.mp3' },
    { title: "Card Castle", file: 'card_castle', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807434/portfolio/music/game/card_castle.mp3' },
    { title: "Chaos King", file: 'kingboss', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807441/portfolio/music/game/kingboss.mp3' },
    { title: "THE WORLD REVOLVING", file: 'joker', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807446/portfolio/music/game/joker.mp3' },
    { title: "A CYBER'S WORLD?", file: 'cyber', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807458/portfolio/music/game/cyber.mp3' },
    { title: "Smart Race", file: 'berdly_chase', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814171/portfolio/music/game/berdly_chase.mp3' },
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
    { title: "Hammer of Justice", file: 'ch4_extra_boss', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792815107/portfolio/music/game/ch4_extra_boss.mp3' },
    { title: "Dark Sanctuary", file: 'church_wip', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814180/portfolio/music/game/church_wip.mp3' },
    { title: "The Second Sanctuary", file: 'second_church', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807531/portfolio/music/game/second_church.mp3' },
    { title: "The Third Sanctuary", file: 'church_zone3', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814232/portfolio/music/game/church_zone3.mp3' },
    { title: "GUARDIAN", file: 'titan_battle', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814256/portfolio/music/game/titan_battle.mp3' },
    { title: "AIRWAVES", file: 'spamton_dance', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814284/portfolio/music/game/spamton_dance.mp3' },
    { title: "Garden of Hopes and Dreams", file: 'field_of_hopes_insaneintherain_loop', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814330/portfolio/music/game/field_of_hopes_insaneintherain_loop.ogg', intro: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814325/portfolio/music/game/field_of_hopes_insaneintherain_intro.ogg' },
    { title: "Sunset of Seven Suns", file: 'cliff', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814293/portfolio/music/game/cliff.mp3' },
    { title: "Flower Castle", file: 'flower_castle', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807543/portfolio/music/game/flower_castle.mp3' },
    { title: "Cutie Mew Mew Magic", file: 'pink', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814311/portfolio/music/game/pink.mp3' },
    { title: "Running Sky", file: 'castle_top', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792814324/portfolio/music/game/castle_top.mp3' },
    { title: "Flower Man", file: 'Flowerman_Arrangement', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807551/portfolio/music/game/Flowerman_Arrangement.mp3' }
  ],
  // Habitación secreta (60 / 17 / 17 / 6 %)
  room: [
    { title: "man", file: 'man', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807553/portfolio/music/room/man.mp3', weight: 60 },
    { title: "man (NES)", file: 'man_nes', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807554/portfolio/music/room/man_nes.mp3', weight: 17 },
    { title: "man 2", file: 'man_2', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807557/portfolio/music/room/man_2.mp3', weight: 17 },
    { title: "DELTARUNE Piano Collections (Trevor Alan Gomes)", file: 'deltarune_piano_collections_by_trevor_alan_gomes', url: 'https://res.cloudinary.com/dw2auacau/video/upload/v1792807560/portfolio/music/room/deltarune_piano_collections_by_trevor_alan_gomes.mp3', weight: 6 }
  ]
}

// Elige según el peso de cada canción (la habitación secreta). rand se inyecta para poder probarlo
export function weightedPick(tracks: MusicTrack[], rand = Math.random): MusicTrack {
  const total = tracks.reduce((sum, t) => sum + (t.weight ?? 1), 0)
  let roll = rand() * total
  for (const track of tracks) {
    roll -= track.weight ?? 1
    if (roll < 0) return track
  }
  return tracks[tracks.length - 1]
}
