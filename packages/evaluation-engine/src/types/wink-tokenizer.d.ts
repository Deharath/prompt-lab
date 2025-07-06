declare module 'wink-tokenizer' {
  interface Token {
    value: string;
    tag: string;
    normal?: string;
  }

  interface Tokenizer {
    tokenize(text: string): Token[];
  }

  function winkTokenizer(): Tokenizer;
  export default winkTokenizer;
}
