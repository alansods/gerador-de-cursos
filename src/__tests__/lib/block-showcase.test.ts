import fs from 'fs'
import path from 'path'
import { BLOCK_CATALOG, BLOCK_MODAL_ENTRIES } from '@/lib/blocks'
import { BLOCK_GUIDE, BLOCK_SAMPLES, type ShowcaseEntryId } from '@/lib/block-showcase'

const entries = BLOCK_MODAL_ENTRIES.map((entry) => ({
  ...entry,
  id: entry.id as ShowcaseEntryId,
}))

describe('block showcase', () => {
  it('covers exactly the entries of the add content modal', () => {
    const ids = entries.map((entry) => entry.id).sort()
    expect(Object.keys(BLOCK_SAMPLES).sort()).toEqual(ids)
    expect(Object.keys(BLOCK_GUIDE).sort()).toEqual(ids)
  })

  it.each(entries)('$id sample matches its modal entry', (entry) => {
    const sample = BLOCK_SAMPLES[entry.id]
    expect(sample.type).toBe(entry.type)
    expect(sample).toMatchObject(entry.preset ?? {})
  })

  it.each(entries)('$id sample passes the editor form validation', (entry) => {
    const sample = BLOCK_SAMPLES[entry.id]
    expect(BLOCK_CATALOG[sample.type].validateForm(sample)).toBeNull()
  })

  it.each(entries)('$id guide tells what the author fills in', (entry) => {
    expect(BLOCK_GUIDE[entry.id].authorFills.trim()).not.toBe('')
  })

  it.each(entries)('$id sample media is served from public/', (entry) => {
    const sample = BLOCK_SAMPLES[entry.id]
    const media = (BLOCK_CATALOG[sample.type].extractMedia?.(sample) ?? []).filter(Boolean)

    for (const url of media as string[]) {
      expect(url.startsWith('/')).toBe(true)
      expect(fs.existsSync(path.join(process.cwd(), 'public', url))).toBe(true)
    }
  })
})
