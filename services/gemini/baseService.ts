
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import ai, { LOCAL_AI_CONFIG } from './client';

// --- Global Configuration Store ---
interface GlobalConfig {
    modelVersion: 'v2' | 'v3';
    imageResolution: '1K' | '2K' | '4K';
}

let globalConfig: GlobalConfig = {
    modelVersion: 'v2',
    imageResolution: '1K'
};

export const setGlobalModelConfig = (version: 'v2' | 'v3', resolution: '1K' | '2K' | '4K') => {
    globalConfig = { modelVersion: version, imageResolution: resolution };
};

export const getModelConfig = () => globalConfig;

export const getTextModel = () => globalConfig.modelVersion === 'v3' ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
export const getImageModel = () => globalConfig.modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

/**
 * Hàm hỗ trợ gọi Stable Diffusion Local (Offline)
 */
async function callLocalSD(prompt: string, initImage?: string): Promise<string> {
    const payload = {
        prompt: prompt,
        negative_prompt: "lowres, bad anatomy, text, error, extra digit, fewer digits, cropped, worst quality, low quality",
        steps: 20,
        init_images: initImage ? [initImage.split(',')[1]] : undefined,
        // Các thông số khác cho SD API...
    };

    const response = await fetch(LOCAL_AI_CONFIG.stableDiffusionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    return `data:image/png;base64,${data.images[0]}`;
}

// --- Centralized Error Processor ---
export function processApiError(error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    if (errorMessage.includes('429')) return new Error("Hết hạn mức sử dụng Cloud, hãy thử chuyển sang chế độ Offline.");
    return new Error("Lỗi AI: " + errorMessage);
}

export function parseDataUrl(imageDataUrl: string): { mimeType: string; data: string } {
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) throw new Error("Định dạng ảnh không hợp lệ.");
    return { mimeType: match[1], data: match[2] };
}

export function processGeminiResponse(response: GenerateContentResponse): string {
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (imagePart?.inlineData) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error("AI không trả về ảnh.");
}

export async function callGeminiWithRetry(parts: any[], config: any = {}): Promise<any> {
    // NẾU ĐANG Ở CHẾ ĐỘ OFFLINE
    if (LOCAL_AI_CONFIG.useLocal) {
        console.log("Sử dụng AI Local...");
        const textPart = parts.find(p => p.text)?.text || "";
        const imagePart = parts.find(p => p.inlineData)?.inlineData?.data;
        const result = await callLocalSD(textPart, imagePart ? `data:image/png;base64,${imagePart}` : undefined);
        // Giả lập format response của Gemini để không phải sửa các service khác
        return { 
            candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: result.split(',')[1] } }] } }],
            text: "" 
        };
    }

    // NẾU DÙNG CLOUD (GEMINI)
    const model = getImageModel();
    const finalConfig = { responseModalities: [Modality.IMAGE, Modality.TEXT], ...config };
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: finalConfig,
    });
    return response;
}

export async function enhancePrompt(userPrompt: string): Promise<string> {
    if (LOCAL_AI_CONFIG.useLocal) return userPrompt; // Local tạm bỏ qua bước này hoặc dùng Ollama
    
    const response = await ai.models.generateContent({
        model: getTextModel(),
        contents: `Mở rộng prompt này để tạo ảnh đẹp hơn: ${userPrompt}`,
    });
    return response.text || userPrompt;
}
