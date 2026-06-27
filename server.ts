import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Check if default Gemini API Key is configured on the server
  app.get(["/api/gemini/status", "/api/status"], (req, res) => {
    const hasEnvKey = !!process.env.GEMINI_API_KEY && 
                      process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && 
                      process.env.GEMINI_API_KEY.trim() !== "";
    res.json({ success: true, hasEnvKey });
  });

  // API Route: Validate custom Gemini API Key
  app.post(["/api/gemini/validate", "/api/validate"], async (req, res) => {
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
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Say OK and nothing else",
      });

      if (response && response.text) {
        return res.json({ success: true, message: "API Key hợp lệ và kết nối với Gemini hoàn hảo thành công!" });
      } else {
        return res.status(400).json({ success: false, message: "Không nhận được phản hồi hợp lệ từ Gemini." });
      }
    } catch (error: any) {
      console.error("Validation error in backend:", error);
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
  });

  // API Route: Generate questions directly on backend
  app.post(["/api/gemini/generate-questions", "/api/generate-questions"], async (req, res) => {
    const { apiKey, subject, gradeLevel, topic, questionsCount } = req.body;
    
    let activeKey = apiKey;
    if (!activeKey && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY.trim() !== "") {
      activeKey = process.env.GEMINI_API_KEY;
    }
    
    if (!activeKey) {
      return res.status(400).json({ success: false, message: "Chưa cấu hình API Key hợp lệ. Vui lòng bật tab Cấu hình API Key phía trên để nhập mã API Key của Gemini." });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const count = parseInt(questionsCount, 10) || 5;

      const systemInstruction = `Bạn là một chuyên gia thiết kế câu hỏi trắc nghiệm giáo dục đỉnh cao dành cho học sinh Việt Nam.
Nhiệm vụ của bạn là tạo ra chính xác danh sách gồm ${count} câu hỏi trắc nghiệm bám sát môn học, khối lớp và chủ đề bài học được yêu cầu.

Yêu cầu định dạng cực kỳ khắt khe:
PHẢI trả về danh sách các câu hỏi theo đúng định dạng văn bản thô (Mẫu khối tự nhiên mẫu 1) phân tách giữa các câu hỏi bằng đúng một dòng trống. Không bao gồm các văn bản rườm rà, giải thích mào đầu hay kết bài, cũng không định dạng thẻ Markdown (như \`\`\` hay \`\`\`txt... \`\`\`), chỉ xuất ra định dạng thô như sau:

Câu hỏi 1: [Nội dung câu hỏi rực rỡ, dễ thương phù hợp lứa tuổi học sinh]
A. [Lựa chọn đáp án A]
B. [Lựa chọn đáp án B]
C. [Lựa chọn đáp án C]
D. [Lựa chọn đáp án D]
Đáp án đúng: [Chữ cái đáp án đúng A, B, C hoặc D nhãn viết hoa]

Câu hỏi 2: [Nội dung câu hỏi tinh nghịch tiếp theo]
A. ...
B. ...
C. ...
D. ...
Đáp án đúng: ...

Chú ý:
- Nội dung câu hỏi và các đáp án phải cực kỳ sinh động sắc sảo và chính xác 105% về mặt kiến thức khoa học phổ thông sư phạm.
- Đáp án đúng phải hoàn toàn tương ứng với một trong bốn đáp án A, B, C, D được liệt kê ở trên.
- Chắc chắn không bọc trong khối code markdown \`\`\` hay bất kỳ ký tự đặc biệt nào ở ngoài.`;

      const userPrompt = `Hãy tạo ra bộ ${count} câu hỏi trắc nghiệm giáo dục chất lượng cho:
- Môn học: ${subject || "Tất cả các môn học"}
- Khối lớp: ${gradeLevel || "Tất cả các khối lớp"}
- Chủ đề: ${topic || "Kiến thức giáo dục tổng hợp"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7
        }
      });

      if (response && response.text) {
        let cleanedText = response.text.trim();
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
        }
        return res.json({ success: true, questions: cleanedText.trim() });
      } else {
        return res.status(400).json({ success: false, message: "Không nhận được câu hỏi từ Gemini." });
      }
    } catch (error: any) {
      console.error("Question Generation error in backend:", error);
      let userFriendlyMessage = "Lỗi trong quá trình sinh câu hỏi tự động. Vui lòng kiểm tra lại API Key hoặc đổi chủ đề.";
      
      const errorContent = [
        String(error),
        error?.message,
        error?.status,
        typeof error === "object" ? JSON.stringify(error) : ""
      ].join(" ").toLowerCase();

      if (errorContent.includes("api key not valid") || errorContent.includes("api_key_invalid") || errorContent.includes("invalid api key") || errorContent.includes("invalid_argument")) {
        userFriendlyMessage = "Mã API Key hiện tại KHÔNG hợp lệ. Bạn hãy lên ô cấu hình phía trên cùng để nạp lại mã API Key chính chủ từ Google nhé!";
      } else if (errorContent.includes("quota") || errorContent.includes("limit") || errorContent.includes("429")) {
        userFriendlyMessage = "Tài khoản API Key của bạn đã hết hạn ngạch gọi miễn phí ngày hôm nay hoặc bị quá tải lượng truy cập tạm thời. Hãy thử lại sau ít phút.";
      } else if (error?.message) {
        userFriendlyMessage = `Lỗi từ hệ thống Gemini: ${error.message}`;
      }
      return res.status(500).json({ success: false, message: userFriendlyMessage });
    }
  });

  // Serve Vite or static build depending on production environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
