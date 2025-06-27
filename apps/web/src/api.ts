export interface JobRequest {
  prompt: string;
  provider: string;
  model: string;
  testSetId: string;
}

export interface JobSummary {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export async function createJob(body: JobRequest): Promise<JobSummary> {
  const res = await fetch('/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function streamJob(
  id: string,
  onMessage: (line: string) => void,
  onDone: () => void,
): EventSource {
  const es = new EventSource(`/jobs/${id}/stream`);
  es.onmessage = (e) => {
    if (e.data === '[DONE]') {
      onDone();
      es.close();
    } else {
      onMessage(e.data);
    }
  };
  es.onerror = () => {
    es.close();
    onDone();
  };
  return es;
}

export async function fetchJob(id: string) {
  const res = await fetch(`/jobs/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // contains final metrics, cost, etc.
}
