import { streamText } from 'ai';
import { arkModel } from '@/lib/ai';

export async function POST(req: Request) {
    const { content } = await req.json();

    // Take first 2000 chars as summary to avoid token limit
    const contentSummary = content.slice(0, 2000);

    const result = streamText({
        model: arkModel,
        system: `你是一位标题创作专家。根据文章内容生成 10 个候选标题。

你必须严格按照以下 JSON 格式输出，不要输出任何其他内容：
[
  {"title": "标题文本", "category": "分类", "score": 评分}
]

category 必须是以下之一：numeric（数字型）、emotion（情感型）、suspense（悬念型）、contrast（对比型）、breaking（爆料型）
score 是 1-10 的浮点数，表示标题质量评分

只输出 JSON 数组，不要输出任何解释文字。`,
        prompt: `文章内容摘要：

${contentSummary}

请生成 10 个候选标题（JSON 格式）：`,
    });

    return result.toTextStreamResponse();
}
