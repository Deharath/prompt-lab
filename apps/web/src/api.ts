export interface JobRequest {
  prompt: string;
  provider: string;
  model: string;
}

export interface JobSummary {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export async function createJob(body: JobRequest): Promise<JobSummary> {
  console.log('🚀 Making API call to /jobs with:', body);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📡 API response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ API error:', errorText);
      throw new Error(errorText);
    }

    const result = await res.json();
    console.log('✅ API success:', result);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('💥 API call failed:', error);
    throw error;
  }
}

export function streamJob(
  id: string,
  onMessage: (line: string) => void,
  onDone: () => void,
): EventSource {
  console.log('🌊 Starting EventSource for job:', id);
  const es = new EventSource(`/jobs/${id}/stream`);

  es.onopen = () => {
    console.log('🔗 EventSource connection opened');
  };

  es.onmessage = (e) => {
    console.log('📡 EventSource message:', e.data);
    if (e.data === '[DONE]') {
      console.log('✅ Received [DONE], closing stream');
      onDone();
      es.close();
    } else {
      onMessage(e.data);
    }
  };

  es.onerror = (e) => {
    console.error('❌ EventSource error:', e);
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
