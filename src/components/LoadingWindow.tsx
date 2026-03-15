export function LoadingWindow() {
  return (
    <div className="window" style={{ width: 400, margin: '40px auto' }}>
      <div className="title-bar">
        <div className="title-bar-text">Cargando...</div>
      </div>
      <div className="window-body">
        <progress style={{ width: '100%' }}></progress>
      </div>
    </div>
  )
}
