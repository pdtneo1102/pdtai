
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { 
    processApiError,
    parseDataUrl, 
    callGeminiWithRetry, 
    processGeminiResponse 
} from './baseService';

interface SunEffectOptions {
    effectType: string;
    intensity: string;
    position: string;
    notes?: string;
    removeWatermark?: boolean;
}

/**
 * Adds beautiful sun effects to fashion/portrait images using Gemini.
 * @param imageDataUrl Data URL of the source image.
 * @param options Sun effect parameters.
 * @returns A promise resolving to the image with sun effects.
 */
export async function addSunEffectToImage(imageDataUrl: string, options: SunEffectOptions): Promise<string> {
    const { mimeType, data: base64Data } = parseDataUrl(imageDataUrl);
    const imagePart = { inlineData: { mimeType, data: base64Data } };

    const promptParts = [
        'Bạn là một chuyên gia chỉnh sửa ảnh thời trang chuyên nghiệp.',
        'Nhiệm vụ của bạn là thêm một hiệu ứng ánh sáng mặt trời tuyệt đẹp vào bức ảnh này.',
        `1. **Loại hiệu ứng:** ${options.effectType}.`,
        `2. **Cường độ ánh sáng:** ${options.intensity}. Ánh sáng phải hòa hợp một cách tự nhiên với các vùng tối (shadows) và vùng sáng (highlights) hiện có trên chủ thể.`,
        `3. **Vị trí nguồn sáng:** ${options.position}. Ánh sáng phải đổ bóng một cách logic dựa trên vị trí này.`,
        '4. **Tính chất:** Hiệu ứng phải trông giống như được chụp trực tiếp từ ống kính máy ảnh (in-camera effect), tạo ra cảm giác ấm áp, sang trọng và đậm chất nghệ thuật cho bộ ảnh thời trang.',
        '5. **Tương tác:** Ánh sáng mặt trời phải tương tác với tóc, da, vải vóc và bối cảnh, tạo ra những vệt sáng lấp lánh (highlights) và lóa nhẹ (glow).'
    ];
    
    if (options.notes) {
        promptParts.push(`- **Ghi chú bổ sung từ người dùng:** "${options.notes}".`);
    }
    
    if (options.removeWatermark) {
        promptParts.push('- **Yêu cầu đặc biệt:** Loại bỏ watermark hoặc logo không mong muốn.');
    }
    
    promptParts.push('Chỉ trả về hình ảnh kết quả chất lượng cao nhất. Không kèm theo văn bản giải giải thích.');

    const prompt = promptParts.join('\n');
    const textPart = { text: prompt };

    try {
        console.log("Attempting to add sun effect with Gemini...");
        const response = await callGeminiWithRetry([imagePart, textPart]);
        return processGeminiResponse(response);
    } catch (error) {
        const processedError = processApiError(error);
        console.error("Error during sun effect creation:", processedError);
        throw processedError;
    }
}
