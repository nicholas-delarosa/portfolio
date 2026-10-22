import { useEffect, useState } from 'react'
import type { SkillCategory } from '../api'
import { adminApi, type Skill } from './adminApi'
import { NoticeBox, useAction, useAdminData } from './ui'

const categories: { value: SkillCategory; label: string }[] = [
  { value: 'Frontend', label: 'Frontend' },
  { value: 'Backend', label: 'Backend' },
  { value: 'Database', label: 'Bases de datos' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Tools', label: 'Herramientas' }
]

// Mueve un elemento de la lista una posición (para ordenar sin arrastrar)
export function moveItem<T>(list: T[], index: number, step: -1 | 1) {
  const target = index + step
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export default function SkillsAdmin() {
  const { data: loaded, error } = useAdminData(adminApi.skills)
  const [skills, setSkills] = useState<Skill[]>()
  const { busy, notice, run } = useAction()

  useEffect(() => {
    if (loaded) setSkills(loaded)
  }, [loaded])

  if (error) return <p className="admin-notice admin-notice-error">* {error}</p>
  if (!skills) return <p>* Cargando habilidades...</p>

  const update = (index: number, changes: Partial<Skill>) =>
    setSkills((list) => list?.map((s, i) => (i === index ? { ...s, ...changes } : s)))

  return (
    <>
      <h1>Habilidades</h1>
      <p className="admin-intro">
        Se muestran por categoría, con los colores del grupo. El nivel dibuja la barra (0 = sin barra).
        El orden de esta lista es el orden dentro de cada categoría.
      </p>

      <section className="admin-section">
        <table className="admin-table">
          <thead>
            <tr><th>Nombre</th><th>Categoría</th><th>Nivel</th><th /></tr>
          </thead>
          <tbody>
            {skills.map((skill, i) => (
              <tr key={i}>
                <td><input value={skill.name} onChange={(e) => update(i, { name: e.target.value })} maxLength={40} aria-label="Nombre" /></td>
                <td>
                  <select value={skill.category} onChange={(e) => update(i, { category: e.target.value as SkillCategory })} aria-label="Categoría">
                    {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </td>
                <td>
                  <select value={skill.level} onChange={(e) => update(i, { level: Number(e.target.value) })} aria-label="Nivel">
                    {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 0 ? 'Sin barra' : '■'.repeat(n) + '□'.repeat(5 - n)}</option>)}
                  </select>
                </td>
                <td className="admin-table-actions">
                  <button type="button" className="admin-icon-button" disabled={i === 0} onClick={() => setSkills(moveItem(skills, i, -1))} aria-label="Subir">↑</button>{' '}
                  <button type="button" className="admin-icon-button" disabled={i === skills.length - 1} onClick={() => setSkills(moveItem(skills, i, 1))} aria-label="Bajar">↓</button>{' '}
                  <button type="button" className="admin-icon-button" onClick={() => setSkills(skills.filter((_, j) => j !== i))} aria-label="Quitar">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="admin-actions">
          <button type="button" className="admin-button" onClick={() => setSkills([...skills, { name: '', category: 'Frontend', level: 3, icon: null }])}>
            Agregar habilidad
          </button>
        </div>
      </section>

      <div className="admin-actions">
        <button type="button" className="admin-button admin-button-primary" disabled={busy}
          onClick={async () => {
            const saved = await run(() => adminApi.saveSkills(skills), 'Habilidades guardadas.')
            if (saved) setSkills(saved)
          }}>
          {busy ? 'Guardando...' : 'Guardar habilidades'}
        </button>
      </div>
      <NoticeBox notice={notice} />
    </>
  )
}
