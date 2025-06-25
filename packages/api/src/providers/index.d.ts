export interface ProviderOptions {
    model: string;
}
export interface LLMProvider {
    name: string;
    models: string[];
    complete(prompt: string, options: ProviderOptions): AsyncGenerator<string>;
}
export declare function getProvider(name: string): LLMProvider | undefined;
