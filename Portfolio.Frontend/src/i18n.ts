import { createContext, useContext } from 'react'

export type Lang = 'es' | 'en'
export type Section = 'home' | 'projects' | 'about' | 'contact'

export const isLang = (value: string | undefined): value is Lang => value === 'es' || value === 'en'

// Cada idioma tiene sus propias rutas: /es/proyectos y /en/projects
const slugs: Record<Lang, Record<Exclude<Section, 'home'>, string>> = {
  es: { projects: 'proyectos', about: 'informacion', contact: 'contacto' },
  en: { projects: 'projects', about: 'about', contact: 'contact' }
}

export const pathFor = (lang: Lang, section: Section) =>
  section === 'home' ? `/${lang}` : `/${lang}/${slugs[lang][section]}`

export const sectionFromSlug = (lang: Lang, slug: string | undefined): Section | null => {
  if (!slug) return 'home'
  const entry = Object.entries(slugs[lang]).find(([, s]) => s === slug)
  return entry ? (entry[0] as Section) : null
}

const es = {
  languageName: 'Español',
  menuPrompt: 'Por favor, seleccione una categoría',
  projects: 'PROYECTOS',
  about: 'INFORMACIÓN',
  contact: 'CONTACTO',
  projectsHint: 'Lo que he construido',
  aboutHint: 'Habilidades, trayectoria y CV',
  contactHint: 'Correo, LinkedIn y mensajes',
  projectsCount: (n: number) => (n === 1 ? '1 proyecto' : `${n} proyectos`),
  featured: 'Proyecto destacado',
  seeProject: 'Ver proyecto',
  changeLanguage: 'English',
  sound: 'Sonido',
  music: 'Música',
  secretRoom: 'Habitación secreta',
  backToMainMenu: 'Volver al menú principal',
  on: 'Sí',
  off: 'No',
  back: 'Volver',
  backToMenu: 'Volver al menú',
  confirm: 'Confirmar',
  goBack: 'Volver',
  move: 'Moverse',
  credits: 'Diseñado y desarrollado por Nicholas De la Rosa. Inspirado en DELTARUNE: música, sonidos y fuentes © Toby Fox. Fuente de los títulos de canciones: Chujin.',
  loading: '* Cargando...',
  loadError: '* No se pudo conectar con el servidor. Recarga la página para intentarlo de nuevo.',
  skip: 'Saltar',

  // Proyectos
  filterAll: 'Todos',
  filterMine: 'Propios',
  filterAssociations: 'Asociaciones',
  filterContributions: 'Contribuciones',
  noProjects: '* Todavía no hay proyectos en esta categoría.',
  noDescription: 'Este proyecto aún no tiene descripción.',
  workedOn: 'Trabajé en este proyecto',
  ownerLabel: (owner: string) => `Repositorio de ${owner}`,
  madeFor: (name: string) => `Hecho con ${name}`,
  viewDemo: 'Ver demo',
  viewCode: 'Ver código',
  languages: 'Lenguajes',
  technologies: 'Tecnologías',
  created: 'Creado',
  lastActivity: 'Última actividad',
  archived: 'Archivado',
  screenshotOf: (title: string) => `Captura de ${title}`,
  selectProject: '* Elige una categoría y recorre la lista para ver cada proyecto.',
  openDemo: 'ver demo',
  openCode: 'ver código',
  enterList: 'entrar a la lista',
  noDemo: 'sin demo',
  featuredMark: 'Destacado',

  // Información
  level: 'LV',
  available: 'Disponible para trabajar',
  skills: 'Habilidades',
  githubLanguages: 'Lenguajes en mi GitHub',
  githubLanguagesHint: 'Calculado a partir del código de mis repositorios.',
  repos: (n: number) => (n === 1 ? '1 repo' : `${n} repos`),
  savePoints: 'Puntos de guardado',
  present: 'Actualidad',
  items: 'Inventario',
  cvItem: 'CV.pdf',
  cvDescription: '* Restaura toda la esperanza del reclutador.',
  cvOther: 'CV en inglés',
  spokenLanguages: 'Idiomas',
  categories: {
    Frontend: 'Frontend',
    Backend: 'Backend',
    Database: 'Bases de datos',
    DevOps: 'DevOps',
    Tools: 'Herramientas'
  },
  kinds: { Education: 'Formación', Work: 'Trabajo', Milestone: 'Logro' },

  // Contacto
  actMenu: 'ACT',
  actEmail: 'Correo',
  actLinkedIn: 'LinkedIn',
  actWhatsApp: 'WhatsApp',
  actGitHub: 'GitHub',
  actWrite: 'Escribir un mensaje',
  emailCopied: '* Copiaste el correo. Te llenas de determinación.',
  writeTitle: 'Enviar un mensaje',
  nameLabel: '* ¿Cómo te llamas?',
  emailLabel: '* ¿A qué correo te respondo?',
  messageLabel: '* ¿Qué me quieres contar?',
  send: 'Enviar mensaje',
  sending: '* Enviando...',
  sent: '* Tu mensaje llegó. Te responderé pronto.',
  sendAnother: 'Escribir otro mensaje',
  tooMany: '* Enviaste muchos mensajes seguidos. Espera unos minutos e inténtalo de nuevo.',
  sendError: '* El mensaje no se pudo enviar. Revisa tu conexión e inténtalo de nuevo.',
  required: 'Este campo es obligatorio.',
  invalidEmail: 'Escribe un correo válido, ej. nombre@correo.com.',

  // 404
  notFoundTitle: 'ERROR 404',
  notFoundMessage: '* Llegaste a un lugar que no existe. Mejor volvamos.',

  months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
}

type Strings = typeof es

const en: Strings = {
  languageName: 'English',
  menuPrompt: 'Please select a category',
  projects: 'PROJECTS',
  about: 'ABOUT',
  contact: 'CONTACT',
  projectsHint: "What I've built",
  aboutHint: 'Skills, journey and resume',
  contactHint: 'Email, LinkedIn and messages',
  projectsCount: (n: number) => (n === 1 ? '1 project' : `${n} projects`),
  featured: 'Featured project',
  seeProject: 'See project',
  changeLanguage: 'Español',
  sound: 'Sound',
  music: 'Music',
  secretRoom: 'Secret room',
  backToMainMenu: 'Back to main menu',
  on: 'On',
  off: 'Off',
  back: 'Back',
  backToMenu: 'Back to menu',
  confirm: 'Confirm',
  goBack: 'Back',
  move: 'Move',
  credits: 'Designed and built by Nicholas De la Rosa. Inspired by DELTARUNE: music, sounds and fonts © Toby Fox. Song title font by Chujin.',
  loading: '* Loading...',
  loadError: "* Couldn't reach the server. Reload the page to try again.",
  skip: 'Skip',

  filterAll: 'All',
  filterMine: 'Mine',
  filterAssociations: 'Associations',
  filterContributions: 'Contributions',
  noProjects: '* There are no projects in this category yet.',
  noDescription: "This project doesn't have a description yet.",
  workedOn: 'I worked on this project',
  ownerLabel: (owner: string) => `Repository by ${owner}`,
  madeFor: (name: string) => `Built with ${name}`,
  viewDemo: 'View demo',
  viewCode: 'View code',
  languages: 'Languages',
  technologies: 'Technologies',
  created: 'Created',
  lastActivity: 'Last activity',
  archived: 'Archived',
  screenshotOf: (title: string) => `Screenshot of ${title}`,
  selectProject: '* Pick a category and move through the list to see each project.',
  openDemo: 'view demo',
  openCode: 'view code',
  enterList: 'enter the list',
  noDemo: 'no demo',
  featuredMark: 'Featured',

  level: 'LV',
  available: 'Open to work',
  skills: 'Skills',
  githubLanguages: 'Languages on my GitHub',
  githubLanguagesHint: 'Calculated from the code in my repositories.',
  repos: (n: number) => (n === 1 ? '1 repo' : `${n} repos`),
  savePoints: 'Save points',
  present: 'Present',
  items: 'Items',
  cvItem: 'Resume.pdf',
  cvDescription: "* Restores all of the recruiter's hope.",
  cvOther: 'Resume in Spanish',
  spokenLanguages: 'Languages',
  categories: {
    Frontend: 'Frontend',
    Backend: 'Backend',
    Database: 'Databases',
    DevOps: 'DevOps',
    Tools: 'Tools'
  },
  kinds: { Education: 'Education', Work: 'Work', Milestone: 'Milestone' },

  actMenu: 'ACT',
  actEmail: 'Email',
  actLinkedIn: 'LinkedIn',
  actWhatsApp: 'WhatsApp',
  actGitHub: 'GitHub',
  actWrite: 'Write a message',
  emailCopied: '* You copied the email. You are filled with determination.',
  writeTitle: 'Send a message',
  nameLabel: "* What's your name?",
  emailLabel: '* Which email should I reply to?',
  messageLabel: '* What would you like to tell me?',
  send: 'Send message',
  sending: '* Sending...',
  sent: "* Your message arrived. I'll get back to you soon.",
  sendAnother: 'Write another message',
  tooMany: "* You've sent several messages in a row. Wait a few minutes and try again.",
  sendError: "* The message couldn't be sent. Check your connection and try again.",
  required: 'This field is required.',
  invalidEmail: 'Enter a valid email, e.g. name@email.com.',

  notFoundTitle: 'ERROR 404',
  notFoundMessage: "* You've reached a place that doesn't exist. Let's head back.",

  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
}

export const strings: Record<Lang, Strings> = { es, en }

export const LangContext = createContext<Lang>('es')

export const useLang = () => useContext(LangContext)
export const useT = () => strings[useLang()]

export const formatMonth = (lang: Lang, iso: string) => {
  const date = new Date(iso)
  return `${strings[lang].months[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

export const storedLang = (): Lang | null => {
  try {
    const value = localStorage.getItem('lang') ?? undefined
    return isLang(value) ? value : null
  } catch {
    return null
  }
}

export const rememberLang = (lang: Lang) => {
  try {
    localStorage.setItem('lang', lang)
  } catch {
    // Sin almacenamiento (modo privado): no pasa nada, solo no se recuerda
  }
}
