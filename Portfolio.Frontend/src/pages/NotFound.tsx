import { storedLang, strings } from '../i18n'
import { Menu, MenuLink } from '../components/Menu'
import './NotFound.css'

export default function NotFound() {
  const lang = storedLang() ?? 'es'
  const t = strings[lang]

  return (
    <main className="not-found">
      <h1 className="not-found-title">{t.notFoundTitle}</h1>
      <p className="not-found-message">{t.notFoundMessage}</p>
      <Menu label={t.backToMenu}>
        <MenuLink to={`/${lang}`} className="not-found-link">
          {t.backToMenu}
        </MenuLink>
      </Menu>
    </main>
  )
}
