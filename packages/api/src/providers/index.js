"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvider = void 0;
const openai_1 = require("./openai");
const gemini_1 = require("./gemini");
const providers = {
    openai: openai_1.OpenAIProvider,
    gemini: gemini_1.GeminiProvider,
};
function getProvider(name) {
    return providers[name];
}
exports.getProvider = getProvider;
