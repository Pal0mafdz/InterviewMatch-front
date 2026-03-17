import { useEffect } from 'react'

const SITE_NAME = 'ninicode.dev'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ${SITE_NAME}`
  }, [title])
}
