import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

const CATEGORIES = [
    "기술 & 혁신", "라이프스타일 & 건강", "음식 & 레시피", "여행 & 모험",
    "비즈니스 & 금융", "예술 & 창의성", "교육 & 학습", "건강 & 피트니스", "자연 & 환경"
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log(`--- [/api/generate] Vercel 함수 실행 시작 ---`);

    if (req.method !== 'POST') {
        console.warn(`[API Check] 잘못된 요청 메소드: ${req.method}`);
        return res.status(405).json({ message: 'POST 요청만 허용됩니다.' });
    }

    console.log('[API Key Check] Vercel 환경 변수에서 API_KEY를 로드합니다...');
    const apiKey = process.env.API_KEY;

    if (!apiKey || apiKey.trim() === '') {
        console.error('[CRITICAL] API_KEY 환경 변수가 설정되지 않았거나 비어 있습니다.');
        console.log('Vercel 대시보드 > Settings > Environment Variables 에서 API_KEY가 올바르게 설정되었는지, 그리고 Production 환경에 적용되었는지 확인하세요.');
        // This specific error message is caught by the frontend to provide detailed instructions.
        return res.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다. Vercel 프로젝트 설정을 확인해주세요.' });
    }
    console.log(`[API Key Check] API 키가 성공적으로 로드되었습니다. (Key's length: ${apiKey.length})`);

    const { blogTitle, blogDescription } = req.body;
    if (!blogTitle || !blogDescription) {
        console.warn('[Request Body Check] 필수 정보 누락: 블로그 제목 또는 설명이 없습니다.');
        return res.status(400).json({ error: '블로그 제목과 설명은 필수입니다.' });
    }
    
    try {
        console.log('[Gemini Request] Gemini API 요청을 초기화합니다...');
        const ai = new GoogleGenAI({ apiKey: apiKey });
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
        
        console.log('[Gemini Response] Gemini API로부터 성공적으로 응답을 받았습니다.');
        const rawText = response.text;
        
        if (!rawText) {
            console.error('[CRITICAL] Gemini 응답이 비어있습니다. 안전 필터에 의해 차단되었을 수 있습니다.');
            console.error('Full Gemini Response:', JSON.stringify(response, null, 2));
            throw new Error('AI로부터 유효한 응답을 받지 못했습니다. 콘텐츠가 안전 필터에 의해 차단되었을 수 있습니다.');
        }

        console.log('[Gemini Raw Text]:', rawText);

        let result;
        try {
            const cleanedText = rawText.replace(/^```json\s*|```\s*$/g, '').trim();
            result = JSON.parse(cleanedText);
        } catch(parseError) {
             console.error('[JSON Parse Error] Gemini 응답 파싱 실패.', parseError);
             console.error('원본 응답 텍스트:', rawText);
             throw new Error('AI가 반환한 데이터 형식이 올바르지 않습니다 (JSON 파싱 실패).');
        }
        
        console.log('[Success] 최종 결과 객체:', result);
        return res.status(200).json(result);

    } catch (error) {
        console.error('--- [FATAL ERROR] AI 생성 프로세스 중 오류 발생 ---');
        console.error('Error object:', JSON.stringify(error, null, 2));
        
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        return res.status(500).json({ error: `AI 썸네일 생성에 실패했습니다: ${errorMessage}` });
    }
}