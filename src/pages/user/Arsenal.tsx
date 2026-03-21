import { Button, Card } from 'pixel-retroui'
import { useAuth } from '../../context/useAuth'

type LinkCard = {
  title: string
  tag: string
  body: string
  actionLabel: string
  href?: string
  to?: string
}

const quickActions: LinkCard[] = [
  {
    title: 'LiveCode',
    tag: 'TOOL',
    body: 'Editor de código colaborativo en tiempo real. Crea una sala o entra a una existente para hacer pair programming.',
    actionLabel: 'ABRIR LIVECODE',
    to: '/livecode',
  },
  {
    title: 'Feedback Studio',
    tag: 'TOOL',
    body: 'Entrada directa al editor de feedback. Los links privados que recibas también aterrizan aquí.',
    actionLabel: 'ABRIR STUDIO',
    to: '/feedback',
  },
]

const fieldResources: LinkCard[] = [
  {
    title: 'NeetCode Roadmap',
    tag: 'MAPA',
    body: 'Ruta visual de práctica para entrevistas técnicas, con progresión clara y ejercicios asociados.',
    actionLabel: 'ABRIR NEETCODE',
    href: 'https://neetcode.io/roadmap',
  },
  {
    title: 'Taro 75',
    tag: 'MAPA',
    body: 'Selección enfocada de preguntas top de estructuras de datos y algoritmos para entrevistas tipo FAANG.',
    actionLabel: 'ABRIR TARO 75',
    href: 'https://www.jointaro.com/interviews/',
  },
  {
    title: 'NeetCode System Design',
    tag: 'SYS',
    body: 'Práctica guiada de system design con problemas y recorrido específico dentro de NeetCode.',
    actionLabel: 'ABRIR SYSTEM DESIGN',
    href: 'https://neetcode.io/practice/practice/systemDesign',
  },
  {
    title: 'Roadmap de Frontend',
    tag: 'WEB',
    body: 'Mapa visual para repasar fundamentos, herramientas y temas avanzados de frontend.',
    actionLabel: 'ABRIR ROADMAP',
    href: 'https://roadmap.sh/frontend',
  },
  {
    title: 'Roadmap de Backend',
    tag: 'WEB',
    body: 'Guía de backend para repasar APIs, bases de datos, seguridad y arquitectura.',
    actionLabel: 'VER BACKEND',
    href: 'https://roadmap.sh/backend',
  },
  {
    title: 'Tech Interview Handbook',
    tag: 'GUIA',
    body: 'Resumen práctico de entrevistas, preparación, behavioral y sistemas.',
    actionLabel: 'LEER GUIA',
    href: 'https://www.techinterviewhandbook.org/',
  },
  {
    title: 'Behavioural Bank',
    tag: 'SOFT',
    body: 'Banco rápido de prompts para responder con método STAR y preparar historias con impacto.',
    actionLabel: 'ABRIR BEHAVIORAL',
    href: 'https://igotanoffer.com/blogs/tech/behavioral-interview-questions#most-asked',
  },
  {
    title: 'System Design Primer',
    tag: 'SYS',
    body: 'Referencia para repasar conceptos de diseño de sistemas, escalado y patrones.',
    actionLabel: 'ESTUDIAR',
    href: 'https://github.com/donnemartin/system-design-primer',
  },
]

const cardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 320px))',
  gap: 16,
  alignItems: 'stretch',
}

function RetroLinkCard({ title, tag, body, actionLabel, href, to }: LinkCard) {
  const handleOpen = () => {
    if (to) {
      window.open(to, '_blank', 'noopener,noreferrer')
      return
    }

    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
      <div className="retro-section-header" style={{ justifyContent: 'space-between', alignItems: 'flex-start', minHeight: 68 }}>
        <h2 style={{ lineHeight: 1.4, minHeight: 38, display: 'flex', alignItems: 'center' }}>{title}</h2>
        <span className="retro-chip retro-chip-amber">{tag}</span>
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.76rem', color: '#7A4F2D', lineHeight: 1.65, flex: 1, marginBottom: 14 }}>
          {body}
        </p>
        <div style={{ marginTop: 'auto' }}>
          <Button
            bg="#C9521A"
            textColor="#FFFDF7"
            shadow="#1A0F08"
            borderColor="#1A0F08"
            onClick={handleOpen}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function Arsenal() {
  const { user } = useAuth()

  return (
    <div>
      <div className="retro-alert retro-alert-info" style={{ marginBottom: 24 }}>
        <strong>ARSENAL RETRO</strong><br />
        Tu estante de utilidades para preparar mocks, entrar rápido a módulos clave y tener recursos de estudio a mano.
      </div>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.72rem', color: '#1A0F08', marginBottom: 12 }}>
          HERRAMIENTAS
        </h2>
        <div style={cardGridStyle}>
          {quickActions.map((card) => (
            <RetroLinkCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.72rem', color: '#1A0F08', marginBottom: 12 }}>
          MAPAS Y RECURSOS
        </h2>
        <div style={cardGridStyle}>
          {fieldResources.map((card) => (
            <RetroLinkCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="retro-section-header"><h2>ESTADO DEL OPERADOR</h2></div>
        <div style={{ padding: 18 }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.76rem', color: '#7A4F2D', lineHeight: 1.65 }}>
            Operador: <strong>{user?.nombre}</strong><br />
            Rol: <strong>{user?.rol?.toUpperCase()}</strong><br />
            Recomendación: antes de cada mock revisa tu perfil, prepara historias STAR y deja una pestaña con recursos de práctica abierta.
          </p>
        </div>
      </Card>
    </div>
  )
}