"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.warn('OPENAI_API_KEY is not set. OpenAI provider will not be available.');
}
const openai = apiKey ? new openai_1.default({ apiKey }) : null;
async function* complete(prompt, options) {
    var _a, _b;
    if (!openai) {
        throw new Error('OpenAI API key not configured. Cannot process request.');
    }
    const stream = await openai.chat.completions.create({
        model: options.model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
    });
    for await (const chunk of stream) {
        const content = (_b = (_a = chunk.choices[0]) === null || _a === void 0 ? void 0 : _a.delta) === null || _b === void 0 ? void 0 : _b.content;
        if (content) {
            yield content;
        }
    }
}
exports.OpenAIProvider = {
    name: 'openai',
    models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo-preview'],
    complete,
};
