/* eslint-disable import/prefer-default-export */
/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars */
declare module 'zod' {
  const z: any;
  namespace z {
    type infer<T> = any;
  }
  export { z };
}
