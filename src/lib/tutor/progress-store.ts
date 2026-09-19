export interface ProgressSnapshot {
  units: number[]
  score: number | null
}

let snapshot: ProgressSnapshot | null = null

export function publishProgress(next: ProgressSnapshot | null): void {
  snapshot = next
}

export function currentProgress(): ProgressSnapshot | null {
  return snapshot
}
