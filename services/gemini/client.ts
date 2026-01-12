
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";

// Mặc định dùng Gemini. 
// Nếu bạn muốn chạy Offline, bạn sẽ thay đổi logic gọi hàm trong baseService 
// để fetch tới localhost (Ollama: 11434 hoặc Stable Diffusion: 7860)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Cấu hình cho AI Local (Ví dụ)
 */
export const LOCAL_AI_CONFIG = {
    useLocal: false, // Chuyển thành true nếu muốn dùng Offline
    ollamaEndpoint: "http://localhost:11434/api/generate",
    stableDiffusionEndpoint: "http://localhost:7860/sdapi/v1/txt2img"
};

export default ai;
