import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

const CATEGORIES = [
    "기술 & 혁신", "라이프스타일 & 건강", "음식 & 레시피", "여행 & 모험",
    "비즈니스 & 금융", "예술 & 창의성", "교육 & 학습", "건강 & 피트니스", "자연 & 환경"
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ error: 'API key not configured on the server.' });
    }

    const { blogTitle, blogDescription } = req.body;
    if (!blogTitle || !blogDescription) {
        return res.status(400).json({ error: 'Blog title and description are required.' });
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            다음 블로그 포스트 내용을 기반으로, 사람들의 시선을 사로잡을 만한 매력적인 썸네일 제목과 부제목을 만들어줘. 그리고 주어진 카테고리 목록 중에서 가장 적합한 카테고리 하나를 추천해줘.

            - 블로그 제목: "${blogTitle}"
            - 블로그 내용: "${blogDescription}"

            카테고리 목록: [${CATEGORIES.join(', ')}]

            결과는 반드시 JSON 형식으로만 응답해야 해. 제목은 짧고 간결하게, 부제목은 제목을 보충하는 내용으로 만들어줘.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                thumbnailTitle: {
                    type: Type.STRING,
                    description: '썸네일을 위한 짧고 시선을 끄는 제목'
                },
                thumbnailSubtitle: {
                    type: Type.STRING,
                    description: '제목을 보충 설명하는 더 짧은 부제목'
                },
                category: {
                    type: Type.STRING,
                    description: `제공된 카테고리 목록 중 하나: ${CATEGORIES.join(', ')}`
                }
            },
            required: ['thumbnailTitle', 'thumbnailSubtitle', 'category']
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const cleanedText = response.text.replace(/```json\n?/, '').replace(/```$/, '');
        const result = JSON.parse(cleanedText);
        
        return res.status(200).json(result);

    } catch (error) {
        console.error('AI thumbnail generation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: `AI thumbnail generation failed: ${errorMessage}` });
    }
}
