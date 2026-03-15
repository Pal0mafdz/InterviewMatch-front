import { useEffect, useState } from 'react'
import { Win98Window } from '../../components/Win98Window'
import { useAuth } from '../../context/useAuth'
import { getProfile, uploadCV } from '../../api/users'
import type { UserProfile } from '../../api/users'
import { STATIC_BASE_URL } from '../../api/constants'

export function Profile() {
  const { logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setUploadError('Solo se aceptan archivos PDF')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo no puede superar 5MB')
      return
    }
    setUploading(true)
    setUploadError(null)
    setUploadMsg(null)
    try {
      const res = await uploadCV(file)
      setUploadMsg('CV subido correctamente')
      setProfile(prev => prev ? { ...prev, cv: res.cv } : prev)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir CV')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <Win98Window title="Mi Perfil"><progress style={{ width: '100%' }}></progress></Win98Window>
  if (error) return <Win98Window title="Mi Perfil"><p style={{ color: 'red' }}>⚠ {error}</p></Win98Window>
  if (!profile) return null

  return (
    <Win98Window title="Mi Perfil">
      <div className="sunken-panel" style={{ padding: 12, marginBottom: 16 }}>
        <div className="field-row-stacked" style={{ marginBottom: 8 }}>
          <strong>Nombre:</strong> {profile.nombre}
        </div>
        <div className="field-row-stacked" style={{ marginBottom: 8 }}>
          <strong>Email:</strong> {profile.email}
        </div>
        <div className="field-row-stacked">
          <strong>Rol:</strong> {profile.rol}
        </div>
      </div>

      <fieldset>
        <legend>Curriculum Vitae</legend>
        {profile.cv ? (
          <p>
            CV cargado:{' '}
            <a
              href={`${STATIC_BASE_URL}${profile.cv}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver CV actual
            </a>
          </p>
        ) : (
          <p>No tienes CV cargado aún.</p>
        )}
        <div className="field-row-stacked" style={{ marginTop: 8 }}>
          <label htmlFor="cv-upload">Subir nuevo CV (PDF, máx 5MB):</label>
          <input
            id="cv-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleCVUpload}
            disabled={uploading}
          />
        </div>
        {uploading && <progress style={{ width: '100%', marginTop: 8 }}></progress>}
        {uploadError && <p style={{ color: 'red', marginTop: 8 }}>⚠ {uploadError}</p>}
        {uploadMsg && <p style={{ color: 'green', marginTop: 8 }}>✓ {uploadMsg}</p>}
      </fieldset>

      <div style={{ marginTop: 16 }}>
        <button onClick={logout}>Cerrar sesión</button>
      </div>
    </Win98Window>
  )
}
