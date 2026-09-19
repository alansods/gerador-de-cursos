/**
 * @jest-environment node
 */
import { createGeminiProvider, EMBEDDING_DIMENSIONS } from '@/lib/tutor/provider'

const fetchMock = jest.fn()

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

function sentBody(call: number) {
  return JSON.parse(fetchMock.mock.calls[call][1].body)
}

describe('createGeminiProvider', () => {
  it('embeds documents in batches of 100 with the document task type', async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const { requests } = JSON.parse(init.body)
      return jsonResponse({ embeddings: requests.map(() => ({ values: [0.1, 0.2] })) })
    })

    const texts = Array.from({ length: 150 }, (_, i) => `text ${i}`)
    const vectors = await createGeminiProvider('key').embedDocuments(texts)

    expect(vectors).toHaveLength(150)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(sentBody(0).requests).toHaveLength(100)
    expect(sentBody(1).requests).toHaveLength(50)
    expect(sentBody(0).requests[0]).toMatchObject({
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: EMBEDDING_DIMENSIONS,
    })
    expect(fetchMock.mock.calls[0][1].headers['x-goog-api-key']).toBe('key')
  })

  it('embeds the question with the query task type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ embeddings: [{ values: [1, 2, 3] }] }))

    const vector = await createGeminiProvider('key').embedQuery('o que é EPI?')

    expect(vector).toEqual([1, 2, 3])
    expect(sentBody(0).requests[0].taskType).toBe('RETRIEVAL_QUERY')
  })

  it('answers with the system instruction and only the passages and question', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ candidates: [{ content: { parts: [{ text: ' Resposta. ' }] } }] })
    )

    const answer = await createGeminiProvider('key').answer('o que é EPI?', [
      { label: 'Unidade 1 — Segurança', text: 'EPI é equipamento de proteção individual.' },
    ])

    expect(answer).toBe('Resposta.')
    const body = sentBody(0)
    expect(body.systemInstruction.parts[0].text).toContain('SOMENTE')
    expect(body.contents[0].parts[0].text).toContain('Rótulo: Unidade 1 — Segurança')
    expect(body.contents[0].parts[0].text).toContain('o que é EPI?')
  })

  it('throws with the status when Gemini fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'quota' }, 429))

    await expect(createGeminiProvider('key').embedQuery('x')).rejects.toThrow('429')
  })

  it('throws when the answer comes back empty', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ candidates: [] }))

    await expect(createGeminiProvider('key').answer('x', [])).rejects.toThrow('empty answer')
  })
})
