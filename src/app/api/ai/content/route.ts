import { streamText } from 'ai';
import { arkModel } from '@/lib/ai';

export async function POST(req: Request) {
    const { materials, style, requirements, outline } = await req.json();

    const materialsText = materials
        .map((m: { name: string; content: string; importance: number }) =>
            `【${m.name}】(重要度 ${m.importance}/5)\n${m.content}`
        )
        .join('\n\n---\n\n');

    const result = streamText({
        model: arkModel,
        system: `你是一位专业的文章撰写者。根据提供的素材、风格要求和大纲，撰写一篇完整的文章。

要求：
- 严格按照大纲结构展开
- 充分利用素材中的信息和数据
- 保持风格一致
- 文章要有可读性，段落间衔接自然
- 直接输出正文内容，不要包含标题，不要加任何说明或解释`,
        prompt: `## 素材内容

${materialsText || '（无素材）'}

## 风格要求

${style}

## 写作要求

${requirements || '（无额外要求）'}

## 文章大纲

${outline || '（无大纲，请自由发挥）'}

请撰写完整正文：`,
    });

    return result.toTextStreamResponse();
}
