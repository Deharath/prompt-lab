export function createJob(input: unknown) {
  return { id: 'stub', input };
}

export async function streamJob(id: string) {
  return { id };
}
