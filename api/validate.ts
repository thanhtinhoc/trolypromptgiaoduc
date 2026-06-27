import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Method not allowed. Use POST." });
  }

  const { apiKey } = req.body;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(400).json({ 
      success: false, 
      message: "Vui lòng nhập API Key hợp lệ. (Tránh nhập các mã giữ chỗ như 'MY_GEMINI_API_KEY' hoặc khoảng trắng)." 
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Say OK and nothing else",
    });

    if (response && response.text) {
      return res.status(200).json({ success: true, message: "API Key hợp lệ và kết nối với Gemini hoàn hảo thành công!" });
    } else {
      return res.status(400).json({ success: false, message: "Không nhận được phản hồi hợp lệ từ Gemini." });
    }
  } catch (error: any) {
    console.error("Validation error in Vercel backend:", error);
    let userFriendlyMessage = "Kiểm tra API Key không thành công. Hãy chắc chắn rằng API Key của bạn chính xác và hoạt động bình thường.";
    
    const errorContent = [
      String(error),
      error?.message,
      error?.status,
      typeof error === "object" ? JSON.stringify(error) : ""
    ].join(" ").toLowerCase();

    if (errorContent.includes("api key not valid") || errorContent.includes("api_key_invalid") || errorContent.includes("invalid api key") || errorContent.includes("invalid_argument")) {
      userFriendlyMessage = "Mã API Key đã nhập KHÔNG hợp lệ. Bạn vui lòng kiểm tra lại xem có copy thiếu ký tự, hoặc thừa khoảng trắng nào ở đầu/cuối hay không. Bạn cũng có thể bấm vào liên kết phía bên trên để lấy lại Key mới miễn phí!";
    } else if (errorContent.includes("quota") || errorContent.includes("limit") || errorContent.includes("429")) {
      userFriendlyMessage = "API Key của bạn đã hết hạn ngạch (quota) hoặc bị giới hạn lượt gọi tạm thời. Vui lòng thử lại sau ít phút hoặc đổi sang Key khác.";
    } else if (error?.message) {
      userFriendlyMessage = `Lỗi từ hệ thống Gemini: ${error.message}`;
    }
    
    return res.status(500).json({ success: false, message: userFriendlyMessage });
  }
}
