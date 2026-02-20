import { streamText } from 'ai';
import { arkModel } from '@/lib/ai';

export async function POST(req: Request) {
    const { materials, style, requirements } = await req.json();

    const materialsText = materials
        .map((m: { name: string; content: string; importance: number }) =>
            `【${m.name}】(重要度 ${m.importance}/5)\n${m.content}`
        )
        .join('\n\n---\n\n');

    const result = streamText({
        model: arkModel,
        system: `你是一位专业的写作大纲规划师。根据用户提供的素材和风格要求，生成一份结构清晰的 Markdown 格式文章大纲。

要求：
- 用 ## 标记章节标题
- 每个章节下用 - 列出 2-4 个要点
- 大纲应该逻辑清晰、层次分明
- 重要度高的素材应给予更多篇幅
- 直接输出大纲内容，不要解释`,
        prompt: `## 素材内容

${materialsText || '（用户未提供素材，请生成一个通用的文章框架）'}

## 风格要求

${style}

## 写作要求

${requirements || '（无额外要求）'}

请生成文章大纲：`,
    });

    return result.toTextStreamResponse();
}
