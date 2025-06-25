/* eslint-disable import/prefer-default-export, @typescript-eslint/naming-convention */
declare module '@dqbd/tiktoken' {
  export function get_encoding(name: string): {
    encode(text: string): number[];
  };
}
