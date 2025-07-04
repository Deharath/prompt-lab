declare module 'text-readability' {
  export default class Readability {
    fleschReadingEase(text: string): number;
    fleschKincaidGrade(text: string): number;
    smogIndex(text: string): number;
  }
}
