/* eslint-disable import/prefer-default-export */
declare module 'deepeval' {
  export function metric(
    name: string,
    options: Record<string, unknown>,
  ): Promise<unknown>;
}
