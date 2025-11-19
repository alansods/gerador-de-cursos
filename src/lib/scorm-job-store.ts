/**
 * Sistema de armazenamento de jobs SCORM em memória
 * 
 * Em produção, considere usar Redis ou outro sistema de cache persistente.
 * Para Vercel, podemos usar Vercel KV (Redis) se necessário.
 */

export interface SCORMJob {
  id: string;
  cursoId: string;
  cursoTitulo: string;
  status: 'pending' | 'building' | 'completed' | 'failed';
  progress?: string;
  error?: string;
  zipBuffer?: Buffer;
  createdAt: Date;
  completedAt?: Date;
}

// Armazenamento em memória (será perdido em restart do servidor)
// Em produção, considere usar Vercel KV ou outro cache persistente
const jobs = new Map<string, SCORMJob>();

/**
 * Cria um novo job
 */
export function createJob(cursoId: string, cursoTitulo: string): string {
  const jobId = `scorm-${cursoId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const job: SCORMJob = {
    id: jobId,
    cursoId,
    cursoTitulo,
    status: 'pending',
    createdAt: new Date(),
  };
  
  jobs.set(jobId, job);
  
  // Limpar jobs antigos (mais de 1 hora)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt.getTime() < oneHourAgo) {
      jobs.delete(id);
    }
  }
  
  return jobId;
}

/**
 * Obtém um job pelo ID
 */
export function getJob(jobId: string): SCORMJob | undefined {
  return jobs.get(jobId);
}

/**
 * Atualiza o status de um job
 */
export function updateJobStatus(
  jobId: string,
  status: SCORMJob['status'],
  progress?: string,
  error?: string
): void {
  const job = jobs.get(jobId);
  if (!job) return;
  
  job.status = status;
  if (progress !== undefined) {
    job.progress = progress;
  }
  if (error !== undefined) {
    job.error = error;
  }
  if (status === 'completed' || status === 'failed') {
    job.completedAt = new Date();
  }
  
  jobs.set(jobId, job);
}

/**
 * Armazena o ZIP buffer de um job completado
 */
export function setJobZipBuffer(jobId: string, zipBuffer: Buffer): void {
  const job = jobs.get(jobId);
  if (!job) return;
  
  job.zipBuffer = zipBuffer;
  jobs.set(jobId, job);
}

/**
 * Remove um job (após download)
 */
export function deleteJob(jobId: string): void {
  jobs.delete(jobId);
}

