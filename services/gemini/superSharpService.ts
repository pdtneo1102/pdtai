
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
import { LOCAL_AI_CONFIG } from './client';

// --- DATA CẤU HÌNH TỪ NGƯỜI DÙNG ---
export const SUPER_SHARP_PRESETS: Record<string, any> = {
    "mặc định": {
        "lambda_pix": 1.0, "lambda_sem": 1.0, "process_size": 512, "upscale": 4.0, "resize_threshold": 1024, "result_size_limit": 1024,
        "align_method": "wavelet", "precision": "fp16", "latent_tiled_size": 96, "latent_tiled_overlap": 32, "vae_encoder_tiled_size": 1024,
        "vae_decoder_tiled_size": 224, "face_processing": true, "face_only_sr": false, "process_size_face": 512, "face_width_min": 4,
        "face_parsing": true, "feather_percent": 10, "face_margin_ratio": 0.25, "resize_threshold_face": 128, "upscale_face": 4.0,
        "lambda_face_pix": 1.0, "lambda_face_sem": 1.0, "use_xformers": true
    },
    "Ảnh Gương Mặt Nhỏ Xíu (Phục hồi lại đường nét).": {
        "lambda_pix": 1.0, "lambda_sem": 1.0, "process_size": 512, "upscale": 2.0, "resize_threshold": 512, "result_size_limit": 1024,
        "align_method": "wavelet", "precision": "fp16", "latent_tiled_size": 96, "latent_tiled_overlap": 32, "vae_encoder_tiled_size": 1024,
        "vae_decoder_tiled_size": 224, "face_processing": true, "face_only_sr": false, "process_size_face": 512, "face_width_min": 4,
        "face_parsing": true, "feather_percent": 10, "face_margin_ratio": 0.25, "resize_threshold_face": 128, "upscale_face": 4.0,
        "lambda_face_pix": 1.0, "lambda_face_sem": 1.01, "use_xformers": true
    },
    "Ảnh Thẻ (Tăng chi tiết cho ảnh đã có đường nét).": {
        "lambda_pix": 1.0, "lambda_sem": 1.0, "process_size": 512, "upscale": 4.0, "resize_threshold": 512, "result_size_limit": 1024,
        "precision": "fp16", "latent_tiled_size": 96, "latent_tiled_overlap": 32, "vae_encoder_tiled_size": 1024, "vae_decoder_tiled_size": 224,
        "face_processing": true, "face_only_sr": false, "process_size_face": 512, "face_width_min": 4, "face_parsing": true,
        "feather_percent": 10, "face_margin_ratio": 0.25, "resize_threshold_face": 256, "upscale_face": 4, "lambda_face_pix": 1.0,
        "lambda_face_sem": 1.0, "use_xformers": true
    },
    "Ảnh Đông Người Size To - Nét Toàn Ảnh - Máy Cực Mạnh (Card VGA 24gb)": {
        "lambda_pix": 1.0, "lambda_sem": 1.0, "process_size": 1280, "upscale": 4.0, "resize_threshold": 4096, "result_size_limit": 7168,
        "precision": "fp16", "latent_tiled_size": 96, "latent_tiled_overlap": 32, "vae_encoder_tiled_size": 1024, "vae_decoder_tiled_size": 224,
        "face_processing": true, "face_only_sr": false, "process_size_face": 512, "face_width_min": 4, "face_parsing": true,
        "feather_percent": 10, "face_margin_ratio": 0.25, "resize_threshold_face": 192, "upscale_face": 4, "lambda_face_pix": 1.0,
        "lambda_face_sem": 1.0, "use_xformers": true
    },
    "Ảnh Toàn Thân hoặc Ảnh Đông Người Size Lớn- Chỉ Cần Nét Mặt.": {
        "lambda_pix": 1.0, "lambda_sem": 1.0, "process_size": 512, "upscale": 1.0, "resize_threshold": 7168, "result_size_limit": 8192,
        "align_method": "wavelet", "precision": "fp16", "latent_tiled_size": 96, "latent_tiled_overlap": 32, "vae_encoder_tiled_size": 1024,
        "vae_decoder_tiled_size": 224, "face_processing": true, "face_only_sr": true, "process_size_face": 512, "face_width_min": 4,
        "face_parsing": true, "feather_percent": 10, "face_margin_ratio": 2.0, "resize_threshold_face": 192, "upscale_face": 4.0,
        "lambda_face_pix": 1.0, "lambda_face_sem": 1.0, "use_xformers": true
    },
    "VIDEO - Nét Toàn Bộ Khung Cảnh - Size Nhỏ.": {
        "lambda_pix": 1.0, "lambda_sem": 1.0, "process_size": 512, "upscale": 4.0, "resize_threshold": 384, "result_size_limit": 1024,
        "align_method": "wavelet", "precision": "fp16", "latent_tiled_size": 96, "latent_tiled_overlap": 32, "vae_encoder_tiled_size": 1024,
        "vae_decoder_tiled_size": 224, "face_processing": true, "face_only_sr": false, "process_size_face": 512, "face_width_min": 4,
        "face_parsing": true, "feather_percent": 10, "face_margin_ratio": 0.25, "resize_threshold_face": 128, "upscale_face": 4.0,
        "lambda_face_pix": 1.0, "lambda_face_sem": 1.0, "use_xformers": true
    },
    "Ảnh Toàn Thân hoặc Đông Người - Ảnh Còn Tốt - Nét Toàn Ảnh - Size Nhỏ.": {
        "lambda_pix": 1.0, "lambda_sem": 1.0, "process_size": 512, "upscale": 4.0, "resize_threshold": 1280, "result_size_limit": 1536,
        "align_method": "wavelet", "precision": "fp16", "latent_tiled_size": 96, "latent_tiled_overlap": 32, "vae_encoder_tiled_size": 1024,
        "vae_decoder_tiled_size": 224, "face_processing": true, "face_only_sr": false, "process_size_face": 512, "face_width_min": 4,
        "face_parsing": true, "feather_percent": 10, "face_margin_ratio": 0.25, "resize_threshold_face": 192, "upscale_face": 4.0,
        "lambda_face_pix": 1.0, "lambda_face_sem": 1.0, "use_xformers": false
    },
    "Ảnh Toàn Thân hoặc Đông Người - Hư Hỏng Nhiều - Nét Toàn Ảnh - Size Nhỏ.": {
        "lambda_pix": 1.0, "lambda_sem": 1.0, "process_size": 192, "upscale": 4.0, "resize_threshold": 256, "result_size_limit": 1536,
        "align_method": "wavelet", "precision": "fp16", "latent_tiled_size": 96, "latent_tiled_overlap": 32, "vae_encoder_tiled_size": 1024,
        "vae_decoder_tiled_size": 224, "face_processing": true, "face_only_sr": false, "process_size_face": 512, "face_width_min": 4,
        "face_parsing": true, "feather_percent": 10, "face_margin_ratio": 0.25, "resize_threshold_face": 128, "upscale_face": 4.0,
        "lambda_face_pix": 1.0, "lambda_face_sem": 1.0, "use_xformers": true
    },
    "Ảnh Toàn Thân hoặc Đông Người - Ảnh Còn Tốt - Nét Toàn Ảnh - Size To - Máy Mạnh": {
        "lambda_pix": 1.0, "lambda_sem": 1.0, "process_size": 512, "upscale": 4.0, "resize_threshold": 2560, "result_size_limit": 4096,
        "precision": "fp16", "latent_tiled_size": 96, "latent_tiled_overlap": 32, "vae_encoder_tiled_size": 1024, "vae_decoder_tiled_size": 224,
        "face_processing": true, "face_only_sr": false, "process_size_face": 512, "face_width_min": 4, "face_parsing": true,
        "feather_percent": 10, "face_margin_ratio": 0.25, "resize_threshold_face": 192, "upscale_face": 4, "lambda_face_pix": 1.0,
        "lambda_face_sem": 1.0, "use_xformers": true
    },
    "Ảnh Toàn Thân hoặc Đông Người - Ảnh Còn Tốt - Nét Toàn Ảnh - Size Vừa.": {
        "lambda_pix": 1.0, "lambda_sem": 1.0, "process_size": 512, "upscale": 4.0, "resize_threshold": 1920, "result_size_limit": 2560,
        "precision": "fp16", "latent_tiled_size": 96, "latent_tiled_overlap": 32, "vae_encoder_tiled_size": 1024, "vae_decoder_tiled_size": 224,
        "face_processing": true, "face_only_sr": false, "process_size_face": 512, "face_width_min": 4, "face_parsing": true,
        "feather_percent": 10, "face_margin_ratio": 0.25, "resize_threshold_face": 192, "upscale_face": 4, "lambda_face_pix": 1.0,
        "lambda_face_sem": 1.0, "use_xformers": true
    }
};

interface SuperSharpOptions {
    upscaleLevel: string; // Tên của preset trong SUPER_SHARP_PRESETS
    denoiseStrength: string;
    notes?: string;
    removeWatermark?: boolean;
}

/**
 * Nâng cao chất lượng ảnh dựa trên bộ cấu hình chuyên sâu.
 */
export async function enhanceImageQuality(imageDataUrl: string, options: SuperSharpOptions): Promise<string> {
    const { mimeType, data: base64Data } = parseDataUrl(imageDataUrl);
    const preset = SUPER_SHARP_PRESETS[options.upscaleLevel] || SUPER_SHARP_PRESETS["mặc định"];

    // NẾU ĐANG Ở CHẾ ĐỘ OFFLINE (Gửi JSON trực tiếp cho Backend Local)
    if (LOCAL_AI_CONFIG.useLocal) {
        console.log("Offline Mode: Gửi cấu hình chuyên sâu tới Local AI...");
        const payload = {
            image: base64Data,
            settings: preset,
            user_notes: options.notes,
            remove_watermark: options.removeWatermark
        };

        const response = await fetch(LOCAL_AI_CONFIG.stableDiffusionEndpoint.replace('txt2img', 'enhance'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Local AI Processor không phản hồi.");
        const result = await response.json();
        return `data:image/png;base64,${result.image || result.images[0]}`;
    }

    // NẾU DÙNG CLOUD (Gemini - Dịch preset thành Prompt)
    const imagePart = { inlineData: { mimeType, data: base64Data } };
    const promptParts = [
        'Bạn là chuyên gia phục chế và nâng cấp ảnh chuyên nghiệp.',
        `Mục tiêu: Nâng cấp ảnh với cấu hình mục tiêu là "${options.upscaleLevel}".`,
        'YÊU CẦU CHI TIẾT:',
        `- Upscale: ${preset.upscale}x`,
        `- Xử lý gương mặt: ${preset.face_processing ? 'Bật (Ưu tiên làm nét mặt)' : 'Tắt'}`,
        `- Mức độ khử nhiễu: ${options.denoiseStrength}`,
        preset.face_only_sr ? '- Chú ý: Chỉ tập trung siêu phân giải cho vùng mặt.' : '- Yêu cầu: Làm nét toàn bộ khung hình.',
        options.notes ? `- Ghi chú thêm: "${options.notes}"` : '',
        options.removeWatermark ? '- Loại bỏ hoàn toàn watermark/logo.' : '',
        'Kết quả phải là ảnh thực tế, sắc nét, không thay đổi nhân dạng. Chỉ trả về ảnh.'
    ];

    const textPart = { text: promptParts.filter(p => p).join('\n') };

    try {
        const response = await callGeminiWithRetry([imagePart, textPart]);
        return processGeminiResponse(response);
    } catch (error) {
        throw processApiError(error);
    }
}
