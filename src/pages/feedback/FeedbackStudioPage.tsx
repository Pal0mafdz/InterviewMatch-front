import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, MantineProvider, Stack, Text, createTheme } from '@mantine/core'
import { AlertCircle } from 'lucide-react'
import '@mantine/core/styles.css'
import '../../features/feedback/index.css'
import { FeedbackStudio } from '../../features/feedback/FeedbackStudio'

type FeedbackErrorBoundaryProps = {
  children: ReactNode
}

type FeedbackErrorBoundaryState = {
  error: Error | null
}

class FeedbackErrorBoundary extends Component<FeedbackErrorBoundaryProps, FeedbackErrorBoundaryState> {
  state: FeedbackErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): FeedbackErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Feedback page crashed', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <Stack justify="center" align="center" mih="100vh" px="md">
          <Alert color="red" radius="xl" variant="light" icon={<AlertCircle size={16} />} maw={760}>
            <Text fw={700}>The feedback page crashed while rendering.</Text>
            <Text size="sm">{this.state.error.message}</Text>
          </Alert>
        </Stack>
      )
    }

    return this.props.children
  }
}

const feedbackTheme = createTheme({
  primaryColor: 'amber',
  defaultRadius: 'lg',
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  headings: {
    fontFamily: '"Space Grotesk", sans-serif',
  },
  colors: {
    amber: [
      '#fff6e1',
      '#ffe8b3',
      '#ffd27a',
      '#ffbc4d',
      '#ffaa28',
      '#f79a11',
      '#d88200',
      '#ad6600',
      '#7d4a00',
      '#4e2e00',
    ],
  },
})

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: [
    'radial-gradient(circle at top, rgba(255, 190, 92, 0.2), transparent 32%)',
    'radial-gradient(circle at 90% 15%, rgba(81, 186, 255, 0.16), transparent 20%)',
    'linear-gradient(180deg, #10141c 0%, #0a0d12 100%)',
  ].join(', '),
}

export function FeedbackStudioPage() {
  return (
    <MantineProvider theme={feedbackTheme} defaultColorScheme="dark">
      <div style={pageStyle}>
        <FeedbackErrorBoundary>
          <FeedbackStudio />
        </FeedbackErrorBoundary>
      </div>
    </MantineProvider>
  )
}