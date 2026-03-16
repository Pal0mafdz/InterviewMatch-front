import type { FeedbackDetailDto, PublicFeedbackCreateInput, PublicFeedbackCreateResponse } from '../types'

function mapPublicCreateResponse(response: { editKey: string; viewKey: string; feedback: FeedbackDetailDto }): PublicFeedbackCreateResponse {
  return {
    editKey: response.editKey,
    viewKey: response.viewKey,
    feedback: response.feedback,
  }
}

export async function createPublicFeedback(input: PublicFeedbackCreateInput): Promise<PublicFeedbackCreateResponse> {
  const response = await fetch('/api/feedback/public', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context: input.context,
      timer: {
        currentSeconds: 0,
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Unable to create public feedback')
  }

  return mapPublicCreateResponse((await response.json()) as { editKey: string; viewKey: string; feedback: FeedbackDetailDto })
}