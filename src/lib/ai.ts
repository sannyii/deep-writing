import { createOpenAI } from '@ai-sdk/openai';

export const ark = createOpenAI({
    apiKey: process.env.ARK_API_KEY!,
    baseURL: process.env.ARK_BASE_URL!,
});

export const arkModel = ark(process.env.ARK_MODEL!);
