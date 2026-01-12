
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
        '5. **Tương tác:** Ánh sáng mặt trời phải tương tác với tóc, da, vải vóc và bối cảnh, tạo ra những vệt sáng lấp lánh (highlights) và lóa nhẹ (glow).',
        '**YÊU CẦU CỰC KỲ QUAN TRỌNG:** Phải giữ lại chính xác tuyệt đối 100% các đặc điểm trên khuôn mặt, đường nét, và biểu biểu cảm của người trong ảnh gốc. Không được thay đổi hay chỉnh sửa khuôn mặt.'
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
        const response = await callGeminiWithRetry([imagePart, textPart]);
        return processGeminiResponse(response);
    } catch (error) {
        throw processApiError(error);
    }
}

/**
 * Tạo hiệu ứng nắng dựa trên các style nghệ thuật cố định (Prompt chuyên sâu).
 */
export async function generateSunEffectWithStyle(imageDataUrl: string, styleIndex: number, removeWatermark?: boolean): Promise<string> {
    const { mimeType, data: base64Data } = parseDataUrl(imageDataUrl);
    const imagePart = { inlineData: { mimeType, data: base64Data } };
    
    const styles = [
        // Style 1: Strong Rim Light
        `Keep the original face 100% identical to the uploaded reference photo — no changes.
        8K ultra-realistic portrait, cinematic warm sunlight, strong rim light.
        A young Asian woman with a low loose Korean bun, soft strands falling across forehead and framing both cheeks.
        Outfit: Black sleeveless turtleneck.
        Accessories: A thin elegant white-gold necklace.
        Pose: Facing the camera, head slightly tilted, bright gentle smile.
        Lighting: Strong golden hour side-sunlight, glowing rim light on bun and loose strands, warm highlights on cheeks.
        Background: Deep vermillion traditional wall with green ivy, bright shimmering sunlight streaks on the wall.`,
        
        // Style 2: Dappled Sunlight
        `Keep the original face 100% identical to the uploaded reference photo — no changes.
        8K detailed portrait, strong scattered sunlight.
        The woman leans lightly toward the vermillion wall, face half-lit by broken sunlight patches.
        Low loose Korean bun with soft strands around her cheeks.
        Outfit: Black sleeveless turtleneck.
        Accessories: Minimalist white-gold thin necklace.
        Pose: Eyes gently closed, peaceful soft smile.
        Lighting: Sun filtered through leaves, creating artistic patterns on her face, neck and hair; intense warm highlights.
        Background: Vermillion wall with ivy shadows dancing across it.`,
        
        // Style 3: Halo Backlight
        `Keep the original face 100% identical to the uploaded reference photo — no changes.
        8K hyperrealism. Strong backlight.
        The woman turns slightly away, looking over her shoulder with a serene soft smile.
        Low Korean bun glowing with bright backlit edges, loose strands catching sunlight.
        Outfit: Black sleeveless turtleneck.
        Accessories: Thin elegant white-gold necklace.
        Pose: Both hands relaxed, shoulders angled gracefully.
        Lighting: Intense halo backlight, golden sun flares spilling across the vermillion wall and ivy.
        Background: Textured vermillion wall, cascading ivy, dramatic glowing atmosphere`
    ];

    const prompt = [
        'Bạn là một nghệ sĩ ánh sáng điện ảnh bậc thầy.',
        'Sử dụng phong cách mô tả dưới đây để biến đổi ánh sáng trong bức ảnh nhưng TUYỆT ĐỐI không thay đổi gương mặt.',
        styles[styleIndex],
        removeWatermark ? 'Loại bỏ hoàn toàn watermark/logo.' : '',
        'Chỉ trả về duy nhất ảnh kết quả sắc nét nhất.'
    ].filter(p => p).join('\n');

    try {
        const response = await callGeminiWithRetry([imagePart, { text: prompt }]);
        return processGeminiResponse(response);
    } catch (error) {
        throw processApiError(error);
    }
}
