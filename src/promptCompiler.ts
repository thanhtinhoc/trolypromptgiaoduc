import { GameConfig } from "./types";

export function compilePrompt(config: GameConfig): string {
  // Parse game types list
  const selectedTypes = [...config.gameTypes];
  if (config.customGameType.trim()) {
    selectedTypes.push(config.customGameType.trim());
  }
  const gameTypesStr = selectedTypes.join(", ") || "Tự do sáng tạo phù hợp chủ đề";

  // Compile custom dynamic gameplay details based on selected game types or custom input
  let gameplayFocusDetailed = "";
  
  if (selectedTypes.length > 0) {
    selectedTypes.forEach((type) => {
      const typeLower = type.trim().toLowerCase();
      
      // 1. HÁI TÁO
      if (typeLower.includes("hái táo") || typeLower.includes("hai tao") || typeLower.includes("táo")) {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI HÁI TÁO TRỰC QUAN**:
  * **Thiết lập Mỹ thuật**: Thiết kế một cây táo sum suê, trĩu nặng quả chín, mỗi quả táo xấp xỉ nằm trên các nhánh mang nhãn các chữ cái đáp án tương ứng (hoặc chú bé/con thỏ nông dân dễ thương đứng dưới gốc). Khung cảnh trang trại tươi vui, bóng mát rực rỡ, cỏ xanh mọng. Có chiếc giỏ mộc mạc đặt dưới chân cây để đón táo rơi.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Quả táo đáp án được chọn tự động rực sáng lấp lánh nổ bụi kim tuyến, bứt khỏi cành và rơi tự do một cách mượt mà thẳng vào chiếc giỏ đựng táo ở gốc cây. Đi kèm hiệu ứng chữ điểm số bay lên "+10 điểm" (hoặc mức điểm chuẩn cộng điểm) bay vút lên và phát tiếng kêu "Ting ting" cực kỳ hân hoan.
    + \`Khi trả lời SAI\`: Quả táo chuyển sang héo rũ, rữa đen hoặc bị một con sâu ngộ nghĩnh đục rỗng gặm nhấm, rơi rụng lệch hẳn ra ngoài giỏ dập nát u sầu, rung lắc màn hình nhẹ và phát âm thanh buồn tẻ tiếc nuối.`;
      }
      
      // 2. BẮN BÓNG BAY
      else if (typeLower.includes("bắn bóng bay") || typeLower.includes("ban bong bay") || typeLower.includes("bóng bay") || typeLower.includes("balloon")) {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI BẮN BÓNG BAY (WORD POPPER)**:
  * **Thiết lập Mỹ thuật**: Trình bày một phông nền bầu trời bao la xanh ngọc bích điểm những đám mây trắng phồng bồng bềnh chuyển động chậm. Các quả bong bóng/khinh khí cầu sặc sỡ màu sắc mang các chữ cái đáp án thi nhau trôi chậm từ dưới đáy màn hình vượt dần lên trời cao. Phía dưới có biểu trưng một cây cung, súng thần công hoặc ống ngắm laser.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Mũi tên hoặc tia laser bắn vụt trúng quả bóng bay chính xác. Quả bóng nổ tung "BÙM!" giòn giã kèm khói kim tuyến nhiều sắc màu rải thảm bụi sáng lấp lánh cực kỳ nịnh mắt. Điểm số nảy tưng bừng cộng điểm.
    + \`Khi trả lời SAI\`: Quả bóng bay xỉu dần, xì hơi quay mòng mòng lộn xộn rồi bay vụt biến mất kèm tiếng xì hơi u huột, âm thanh nghe ngộ nghĩnh đáng yêu.`;
      }
      
      // 3. ĐUA XE TRI THỨC
      else if (typeLower.includes("đua xe") || typeLower.includes("dua xe") || typeLower.includes("racing") || typeLower.includes("xe đua")) {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI ĐUA XE TRI THỨC (TRÍ TUỆ TỐC ĐỘ)**:
  * **Thiết lập Mỹ thuật**: Mô phỏng một chặng đua xa lộ uốn lượn kịch tính rực rỡ, có vạch đích cắm cờ đỏ cổ vũ. Người chơi điều khiển một chiếc xe đua mini F1 cực ngầu lướt bánh trên đường đua, né tránh hoặc húc đổ các khối hộp chướng ngại vật mang chữ đáp án hoặc các vệt km vinh quang.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Động cơ xe gầm rú dũng mãnh, bốc đầu tăng tốc rít ga xả khói ngũ sắc bắn vọt về phía trước Km tiếp theo một cách ngoạn mục để tiến sát vạch đích, vang tiếng cổ vũ sướng tai hò reo.
    + \`Khi trả lời SAI\`: Xe đâm trúng ổ gà dội đá nảy lửa, khói đen xịt ra từ nắp capo u buồn kèm màn hình rung lắc chao đảo rầm rập rùng rợn, thể hiện sự hao hụt sinh mạng hoặc giảm tốc đáng tiếc.`;
      }
      
      // 4. TRẮC NGHIỆM VƯỢT CHƯỚNG NGẠI VẬT / PHIÊU LƯU QUA CÁC MÀN CHƠI
      else if (typeLower.includes("chướng ngại vật") || typeLower.includes("chuong ngai vat") || typeLower.includes("phiêu lưu") || typeLower.includes("phieu luu") || typeLower.includes("adventure") || typeLower.includes("vượt chướng ngại vật")) {
        gameplayFocusDetailed += `
- **BỐ CỤC VƯỢT CHƯỚNG NGẠI VẬT / PHIÊU LƯU THÁM HIỂM KỲ THÚ**:
  * **Thiết lập Mỹ thuật**: Bản đồ thám hiểm vùng đất cổ tích hoặc dải ngân hà huyền ảo. Nhân vật dũng sĩ anh hùng/phi thuyền chuyển động từ trái sang phải qua các trạm gác checkpoint, đối mặt trực tiếp các chướng ngại vật khổng lồ hoặc quái vật/thiên thạch giữ cổng mang câu hỏi.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Nhân vật dũng cảm thi triển kỹ năng vung kiếm ánh sáng cực đỉnh/bắn laser quét sạch chướng ngại vật bốc cháy lấp lánh mở đường, dũng cảm thu hoạch kho tiền rương báu bừng sáng lung linh, nhạc hiệu oai hùng rộn rã cất vang.
    + \`Khi trả lời SAI\`: Chướng ngại vật đâm sầm làm nhân vật loạng choạng giật lùi, tim sinh mạng nhấp nháy chuyển xám tắt lịm, âm thanh u ám nuối tiếc báo hiệu thử thách chưa vượt qua.`;
      }
      
      // 5. MÊ CUNG HỌC TẬP
      else if (typeLower.includes("mê cung") || typeLower.includes("me cung") || typeLower.includes("maze")) {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI MÊ CUNG HỌC TẬP (MAZE RUNNER)**:
  * **Thiết lập Mỹ thuật**: Mặt bằng mê cung 2D thiết kế bằng các khối bờ tường bo góc hiện đại sành điệu. Nhân vật con vật thông thái dạo bước tìm hạt dẻ, phô mai hoặc sách vở ở trung tâm. Các lối rẽ có cánh cửa ma pháp khóa kín mang nhãn câu hỏi trắc nghiệm.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Cánh cửa thần rực sáng ánh xanh ngọc mở rộng mượt mà, nhân vật hớn hở chạy lướt qua ăn trọn phần thưởng phát sáng béo ngậy, hạt bụi kim tuyến phát ra nhảy nhót.
    + \`Khi trả lời SAI\`: Cánh cửa rung lắc màu đỏ báo động khóa chặt, nhân vật giật mình lùi lại sợ hãi trước những luồng điện xám hoặc chướng ngại vật nhô lên, phát âm thanh lộc cộc thất bại sầm sập.`;
      }
      
      // 6. RUNG CHUÔNG VÀNG
      else if (typeLower.includes("rung chuông vàng") || typeLower.includes("rung chuong vang")) {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI RUNG CHUÔNG VÀNG (ĐẤU TRƯỜNG VINH QUANG)**:
  * **Thiết lập Mỹ thuật**: Sân khấu lung linh rực sáng dải đèn pha, chiếc chuông vàng vĩ đại treo trang nghiêm bừng sáng trên đài cao trung tâm. Bảng vinh danh và các lớp thí sinh ngồi thi đấu kịch tính.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Chiếc chuông vàng đung đưa mạnh mẽ, ngân lên "KENG! KENG!" chuông giòn giã chói tai, pháo sáng bắn rực từ hai bên bục nâng người chơi tiến lên bục cao, tiếng hoan hô huyên náo rộn rã.
    + \`Khi trả lời SAI\`: Tia sét nhân tạo giáng xuống nhẹ nhàng hoặc đèn đỏ chớp nháy cảnh báo dồn dập báo hiệu rời cuộc chơi, nhân vật cúi đầu ngậm ngùi, nhạc âm buồn bã vang lên trầm lắng.`;
      }
      
      // 7. AI LÀ TRIỆU PHÚ
      else if (typeLower.includes("triệu phú") || typeLower.includes("trieu phu") || typeLower.includes("millionaire")) {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI AI LÀ TRIỆU PHÚ (TRÍ TUỆ ĐỈNH CAO CHINH PHỤC CÁT VÀNG)**:
  * **Thiết lập Mỹ thuật**: Vòng tròn trung tâm bảng câu hỏi sẫm tối bí ẩn sang trọng. Bảng tháp tiền thưởng/nấc vinh danh màu vàng óng lấp lánh rực lên từng mốc thưởng bên lề phải. Các nút chọn đáp án vát lục giác cổ điển sành điệu.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Nút đáp án chuyển màu xanh lục neon phát sáng nhấp nháy rực rỡ, mốc tháp giải thưởng tăng cấp bừng sáng lung linh, phát ra chuỗi âm thanh kịch tính dồn dập vang lên tự tin hoành tráng.
    + \`Khi trả lời SAI\`: Nút đã chọn đổi sắc đỏ rực báo lỗi, lộ diện đáp án đúng viền nhấp nháy phát sáng, âm hụt trầm buồn bã vang lên kết thúc chặng chơi hào hùng.`;
      }
      
      // 8. LẬT MẢNH GHÉP
      else if (typeLower.includes("mảnh ghép") || typeLower.includes("manh ghep") || typeLower.includes("lật hình") || typeLower.includes("lat hinh")) {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI LẬT MẢNH GHÉP BÍ ẨN (PUZZLE COLLAGE)**:
  * **Thiết lập Mỹ thuật**: Bức tranh vinh quang hoặc tranh vẽ phong cảnh chủ đề vô cùng lộng lẫy bị giấu kín sau tấm màn rèm gồm khoảng 4-9 mảnh ghép mang các câu đối số đầy sắc màu.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Mảnh ghép được chọn lấp lánh bốc hơi rã đông rách mở lung linh để lộ ra một phần bức tranh tuyệt đẹp nguyên bản rực rỡ phía sau, nhạc hiệu hoan ca ngân tiếng vỗ tay rộn vang.
    + \`Khi trả lời SAI\`: Mảnh ghép rung lắc dữ dôi chớp đỏ báo động, từ chối hé mở và phát âm thanh cửa bị xích khóa khô khốc đầy bất lực.`;
      }

      // 10. DYNAMIC BASKETBALL (BÓNG RỔ)
      else if (typeLower.includes("bóng rổ") || typeLower.includes("basketball") || typeLower.includes("ném rổ")) {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI NÉM BÓNG RỔ SIÊU ĐẲNG (BASKETBALL SLAM DUNK)**:
  * **Thiết lập Mỹ thuật**: Sân đấu bóng rổ trong nhà bóng loáng tinh tươm chất lừ, rổ sắt treo lưới dệt bám chắc chắn vào tấm bảng đỡ trong suốt. Quả bóng rổ cam đặt trên tay chuẩn bị ném. Các mảnh chọn đáp án nằm trên vành rổ rực rực rỡ.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Cầu thủ bật cao tung cú ném bóng rổ hình cầu vồng parabol hoàn mỹ, bóng sút sạt trơn lọt giỏ úp rổ rầm "Slam Dunk" siêu đẳng làm tấm lưới co giãn rung bần bật bừng sáng bụi ngân hà lung linh, tiếng cười hô vàng của đám đông vang vang phấn khích lớn.
    + \`Khi trả lời SAI\`: Bóng ném bay lệch dội trúng vành đai sắt nảy lên khô khốc kêu to "KENG!" rồi văng ra xa vô phương cứu chữa, khán giả ôm đầu thất thanh thở dài nuối tiếc trầm tiếng trầm.`;
      }

      // 11. DYNAMIC FISHING (CÂU CÁ)
      else if (typeLower.includes("câu cá") || typeLower.includes("fishing") || typeLower.includes("bắt cá")) {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI CÂU CÁ TRÍ THỨC (FISHING EXPEDITION)**:
  * **Thiết lập Mỹ thuật**: Lòng đại dương sâu thẳm lung linh tia nước chiếu xuyên ngập dải san hô rực đầy đàn cá sắc màu bơi lượn mang theo nhãn đáp án. Trên mặt biển có chiếc thuyền mộc của bác ngư dân cần mẫn đang chờ đợi buông cần câu nước.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Phao câu nhấp nhô rồi giật bọt nổi sủi tăm mạnh mẽ, cần thủ vung tay nhấc bổng chú cá vàng óng vẫy đuôi nhảy tanh tách lọt chuẩn sọt chứa nước lấp lánh phát sáng bừng mỡ màng, tiếng hò reo ca vui nhộn đón nhận hào quang rạng ngời.
    + \`Khi trả lời SAI\`: Cá rỉa sạch mồi câu rồi vẫy đuôi trốn kỹ lẩn khuất bơi lơ đãng đi mất hút, cần thủ nhấc dây câu rỗng tếch héo hon thất sủng dưới tiếng nước sủi buồn bã réo rắc.`;
      }

      // 12. DYNAMIC WITCHCRAFT / CHEMISTRY (CHẾ THUỐC MA THUẬT PHÙ THỦY)
      else if (typeLower.includes("chế thuốc") || typeLower.includes("phù thủy") || typeLower.includes("alchemy") || typeLower.includes("chemistry") || typeLower.includes("hóa học")) {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI CHẾ THUỐC MA PHÁP PHÙ THỦY (ALCHEMY LAB)**:
  * **Thiết lập Mỹ thuật**: Bàn thí nghiệm phù thủy tối tăm huyền bí lấp lánh dải nến ma mị, ống đựng hóa chất sủi bọt thủy tinh đổi màu. Ở giữa là chiếc vạc đồng/vạc luyện đan khổng lồ chứa nước thuốc phép đang sôi nóng sần sật bốc khói dập dờn phồng gợn sóng tuyệt đẹp.
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Chai ma dược của đáp án đúng tự động đổ vơi chất lỏng sủi bọt óng ánh vào vạc đồng, kích hoạt làn phản ứng bùng hào quang sáng chói rực cầu vồng đổi dải sắc màu nước vạc linh thiêng lung linh tuyệt sướng mắt, bay lên bình ngọc linh đan lộng lẫy và nhạc reo "Xè xè" hân hoan rực cháy.
    + \`Khi trả lời SAI\`: Pha chế hỗn hợp xung đột phản ứng phụ, khói đen mù mịt bốc tung nổ đét lấm lem lò luyện, làm chiếc vạc bốc xị khói xám rũ u sầu thất vọng trong tiếng còi trầm dồn dập.`;
      }
      
      // General match
      else {
        gameplayFocusDetailed += `
- **BỐ CỤC CHƠI SÁNG TẠO THEO PHONG CÁCH CHỦ ĐỀ VÀ TRẢI NGHIỆM "${type.trim()}"**:
  * **Thiết lập Mỹ thuật**: Hãy lập trình và sáng tạo toàn diện giao diện, bối cảnh tương tác cực kỳ thông minh sát cánh với phong cách "${type.trim()}".
  * **Tính Tương Tác & Hoạt Họa Phản Hồi**:
    + \`Khi trả lời ĐÚNG\`: Tạo một hoạt cảnh hoàn hảo trực quan tôn vinh sự thăng tiến hoặc chiến tích liên quan trực tiếp đến tinh thần của trò chơi "${type.trim()}" (Ví dụ: ghi bàn thắng hiểm, thu thập chiến phẩm, nâng cấp sức mạnh, mở rộng ranh giới bờ cõi) kèm theo khói kim tuyến rực rỡ lấp lánh lân tinh, điểm số nảy tưng bừng bứt phá và âm điệu Ting Ting vang dội.
    + \`Khi trả lời SAI\`: Thể hiện hoạt cảnh hỏng việc, va vấp, sập bẫy thảm thương phù hợp tinh thần "${type.trim()}" kèm theo màn hình rung lắc chớp đỏ báo hiệu mất sinh mạng, âm buồn hụt tếch để điều chỉnh hành vi.`;
      }
    });
  } else {
    // General default adaptive fallback
    gameplayFocusDetailed += `
- **YÊU CẦU TRẢI EM GAMEPLAY TỔNG THỂ**:
  - Hãy lập trình và biến tấu toàn bộ cơ chế, giao diện trò chơi bám sát cực kỳ thông minh theo phong cách chủ đề "${gameTypesStr}".
  - Thiết kế hoạt họa CSS chuyển cảnh trực quan để học sinh nhìn thấy sự thăng tiến nhiệm vụ rõ rệt qua từng sự kiện:
    + Khi trả lời ĐÚNG: Hãy tạo một hoạt cảnh tương tác chiến thắng hoặc thăng tiến liên quan trực tiếp đến trải nghiệm này với hiệu ứng rộn ràng, rải bụi kim tuyến sáng rỡ đầy kích thích tâm lý, phát tiếng nhạc vui tai sảng khoái và điểm số nảy tưng bừng.
    + Khi trả lời SAI: Tạo hoạt cảnh thất bại tương thích cao với tinh thần của trò chơi (Ví dụ: va vấp, lùi bước, dính khói, rung chuyển dữ dội màn hình nhẹ) kèm âm thanh tiếc nuối khéo léo để điều chỉnh hành vi.`;
  }

  // Parse questions
  let questionsPromptBlock = "";
  if (config.aiGenerateQuestions || !config.rawQuestions.trim()) {
    questionsPromptBlock = `
- **YÊU CẦU TỰ ĐỘNG SINH CÂU HỎI**: Tôi chưa có danh sách câu hỏi cụ thể hoặc muốn bạn tự động thiết kế câu hỏi. Hãy tự động tạo khoảng ${config.questionsCount} câu hỏi trắc nghiệm chất lượng cao, từ dễ đến khó phù hợp trực tiếp với môn học "${config.subject}", khối lớp "${config.gradeLevel}" và chủ đề bài học "${config.topic}". Mỗi câu hỏi cần có 4 đáp án (A, B, C, D) rõ ràng, chỉ một đáp án đúng kèm giải thích ngắn gọn, súc tích.
`;
  } else {
    const textBuffer = config.rawQuestions.trim();
    let questionObjects: any[] = [];

    const pipeCount = (textBuffer.match(/\|/g) || []).length;
    const linesCount = textBuffer.split("\n").length;

    if (pipeCount >= linesCount * 0.4 || pipeCount > 3) {
      // Classic Pipe Form: Column-separated
      const lines = textBuffer
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      questionObjects = lines.map((line, idx) => {
        const parts = line.split("|").map((p) => p.trim());
        if (parts.length >= 6) {
          return {
            id: idx + 1,
            question: parts[0],
            answers: {
              A: parts[1],
              B: parts[2],
              C: parts[3],
              D: parts[4],
            },
            correctAnswer: parts[5].toUpperCase(),
            explanation: parts[6] || "Không có giải thích nâng cao.",
          };
        }
        return null;
      }).filter(Boolean);
    } else {
      // Extremely Robust Multiline Human-Friendly Parser (Handles optional prefixes, carriage returns, and spaces)
      const lines = textBuffer.split(/\r?\n/).map((l) => l.trim());
      let currentQuestion: any = null;
      let pendingQuestionTitle = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // 1. Check if it's answer option A, B, C, or D
        const optionMatch = line.match(/^([A-D])\s*[\.\:\-\)\/]?\s*(.*)$/i);

        // 2. Check if it's correct answer indicator
        const correctMatch = line.match(/^(?:đáp án đúng là|đáp án đúng|đáp án|dap an dung la|dap an dung|dap an|correct answer|correct|đúng|dung|key|ans)\s*[\.\:\-\/]?\s*([A-D])(?:\s|$|\.)/i);

        // 3. Check if it's explanation
        const expMatch = line.match(/^(?:giải thích|giai thich|lời giải|loi giai|giải thích lý do|explanation)\s*[\.\:\-]\s*(.*)$/i);

        // 4. Check if it's an explicit question title starting with "Câu" or a number
        const qMatch = line.match(/^(?:(?:câu hỏi|cau hoi|câu|cau)\s*\d*|\d+)\s*[\.\:\-\/]\s*(.*)$/i);

        if (qMatch) {
          // Push previous question before starting new one
          if (currentQuestion && currentQuestion.question && Object.keys(currentQuestion.answers).length >= 2) {
            questionObjects.push(currentQuestion);
          }
          currentQuestion = {
            id: questionObjects.length + 1,
            question: qMatch[1].trim() || line,
            answers: {},
            correctAnswer: "",
            explanation: "",
          };
          pendingQuestionTitle = "";
          continue;
        }

        if (optionMatch) {
          if (!currentQuestion) {
            currentQuestion = {
              id: questionObjects.length + 1,
              question: pendingQuestionTitle.trim() || "Câu hỏi không rõ tiêu đề",
              answers: {},
              correctAnswer: "",
              explanation: "",
            };
            pendingQuestionTitle = "";
          }
          const optionLetter = optionMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
          currentQuestion.answers[optionLetter] = optionMatch[2].trim();
          continue;
        }

        if (correctMatch) {
          if (currentQuestion) {
            currentQuestion.correctAnswer = correctMatch[1].toUpperCase();
          }
          continue;
        }

        if (expMatch) {
          if (currentQuestion) {
            currentQuestion.explanation = expMatch[1].trim();
          }
          continue;
        }

        // Standard text lines:
        // If we are currently inside a question and already have options and correct answer, this line is part of explanation
        if (currentQuestion && Object.keys(currentQuestion.answers).length >= 2) {
          if (currentQuestion.correctAnswer) {
            currentQuestion.explanation = (currentQuestion.explanation ? currentQuestion.explanation + " " : "") + line;
          }
        } else {
          // Otherwise, it's part of the upcoming question title
          pendingQuestionTitle = (pendingQuestionTitle ? pendingQuestionTitle + " " : "") + line;
        }
      }

      // Add the last question if valid
      if (currentQuestion && currentQuestion.question && Object.keys(currentQuestion.answers).length >= 2) {
        questionObjects.push(currentQuestion);
      }

      // Clean up final questions formats
      questionObjects = questionObjects.map((q, idx) => {
        q.id = idx + 1;
        q.answers.A = q.answers.A || "";
        q.answers.B = q.answers.B || "";
        q.answers.C = q.answers.C || "";
        q.answers.D = q.answers.D || "";
        if (!q.correctAnswer) q.correctAnswer = "A";
        if (!q.explanation) q.explanation = "Không có giải thích nâng cao.";
        return q;
      });
    }

    if (questionObjects.length > 0) {
      questionsPromptBlock = `
- **DANH SÁCH CÂU HỎI CỦA TÔI** (Hãy chèn chính xác danh sách này vào mảng JSON dữ liệu câu hỏi trong mã code JavaScript):
  \`\`\`json
  ${JSON.stringify(questionObjects, null, 2)}
  \`\`\`
`;
    } else {
      questionsPromptBlock = `
- **YÊU CẦU TỰ ĐỘNG SINH CÂU HỎI**: (Dữ liệu dòng nhập câu hỏi bị lỗi hoặc trống) Vui lòng tự tạo ra ${config.questionsCount} câu hỏi trắc nghiệm sáng tạo, đúng chuẩn kiến thức môn "${config.subject}", dành cho "${config.gradeLevel}" về chủ đề "${config.topic}".
`;
    }
  }

  // Parse Lives and Rules
  const penaltyStr = config.hasWrongPenalty
    ? `Trừ đi ${config.penaltyPoints} điểm`
    : "Không bị trừ điểm";
  const timerStr = config.hasTimeLimit
    ? `Có giới hạn ${config.timeLimitSeconds} giây cho mỗi câu hỏi (có thanh đếm số thời gian chạy lùi sinh động)`
    : "Không giới hạn thời gian trả lời";

  // Parse Player Info request
  const playerFields = [];
  if (config.requirePlayerName) playerFields.push("Họ và Tên học sinh");
  if (config.requirePlayerClass) playerFields.push("Lớp học");
  if (config.requirePlayerSchool) playerFields.push("Trường học");
  if (config.requirePlayerId) playerFields.push("Mã số học sinh (MSHS)");
  const playerFieldsStr = playerFields.join(", ") || "Họ và tên";

  // Sounds conversion to bullet list
  const soundsList = config.enabledSounds.map((s) => `  + ${s}`).join("\n");
  // Effects conversion to bullet list
  const effectsList = config.enabledEffects.map((e) => `  + ${e}`).join("\n");
  // UI Elements conversion to bullet list
  const uiElementsList = config.uiElements.map((u) => `  + ${u}`).join("\n");
  // Result elements
  const resultList = config.resultElements.map((r) => `  + ${r}`).join("\n");

  // Constructing prompt
  const compiled = `BẠN LÀ CHUYÊN GIA LẬP TRÌNH GAME GIÁO DỤC đẳng cấp thế giới, tinh thông phát triển Web tương tác độc lập (HTML, CSS và JavaScript thuần ES6+). Hãy tạo cho tôi một trò chơi học tập hoàn chỉnh, cuốn hút, mượt mà và chạy được ngay.

Tất cả mã nguồn phải được gói gọn trong MỘT FILE HTML DUY NHẤT (Single-File HTML) chứa đầy đủ cấu trúc: Giao diện thẻ HTML, kiểu dáng CSS cao cấp hiện đại nằm trong khay \`<style>\` và logic JavaScript trong khay \`<script>\`. 

Dưới đây là đặc tả chi tiết của dự án trò chơi giáo dục yêu cầu bạn thiết kế:

---

### I. THÔNG TIN CHUNG VỀ TRÒ CHƠI
- **Tên trò chơi**: "${config.gameName}"
- **Môn học**: "${config.subject}"
- **Khối lớp học**: "${config.gradeLevel}"
- **Chủ đề kiến thức**: "${config.topic}"
- **Đối tượng người chơi mục tiêu**: "${config.targetPlayers}"
- **Thời lượng ước tính**: "${config.duration}"
- **Mục tiêu học tập**: "${config.learningGoals}"

### II. KIỂU GAMEPLAY VÀ TRẢI NGHIỆM
- **Kiểu cơ chế chơi chính**: ${gameTypesStr}
- **Yêu cầu chi tiết**: Thiết kế bố cục và cơ cấu tương tác đặc trưng bám sát vào loại trò chơi được kích hoạt dưới đây:${gameplayFocusDetailed}

### III. THIẾT LẬP LUẬT CHƠI (GAMEPLAY CONFIG)
- **Số mạng (Sinh lực)**: ${typeof config.livesCount === "number" ? `${config.livesCount} mạng (biểu diễn bằng các biểu tượng trái tim màu đỏ tươi tắt dần khi mất mạng)` : "Không giới hạn mạng"}
- **Số lượng câu hỏi trong mỗi hiệp chơi**: ${config.questionsCount} câu hỏi.
- **Cách phân bổ điểm số**:
  * Cộng **+${config.correctPoints} điểm** cho mỗi câu trả lời chính xác.
  * Khi trả lời sai: **${penaltyStr}**.
- **Chế độ thời gian**: ${timerStr}.
- **Cấu trúc trải nghiệm gồm các màn hình chính**:
  ${config.hasIntroScreen ? "+ Màn hình chính mở đầu (với tên game bay nhảy rực rỡ, nút nhập thông tin học sinh và nút 'Bắt đầu ngay')" : ""}
  ${config.hasTutorialScreen ? "+ Bảng popup hướng dẫn chơi cách thức điều khiển, tính điểm dễ hiểu" : ""}
  ${config.hasSummaryScreen ? "+ Bàn cân tổng kết thành tích (bảng điểm, xếp loại, nhận xét thông thái)" : ""}
  ${config.hasLeaderboard ? "+ Bảng lưu giữ kỷ lục tạm thời (Leaderboard cục bộ) của người chơi đạt điểm cao nhất trong phiên này" : ""}

### IV. THÔNG TIN NGƯỜI CHƠI (PLAYER INFO REQUIREMENT)
- Bắt buộc học sinh phải điền đầy đủ các thông tin sau tại Màn hình mở đầu trước khi kích hoạt trò chơi:
  **${playerFieldsStr}**
- Lưu trữ các thông tin này tạm vào bộ nhớ đối tượng JavaScript để phục vụ chấm điểm đầu ra và in bảng danh dự.

### V. HỆ THỐNG CÂU HỎI (QUESTION ENGINE)
${questionsPromptBlock}

### VI. GIAO DIỆN VÀ MỸ THUẬT SÁNG TẠO (UI/UX DESIGN)
- **Phong cách visual chủ đạo**: "${config.uiTheme}"
- **Tông màu sắc & Mỹ thuật**: "${config.uiColorStyle}"
- Giao diện phải tuyệt đẹp, có chiều sâu, áp dụng phối màu rực rỡ, sử dụng dải màu Gradient thời trang. Thiết kế card bo góc mềm mại, đổ bóng lướt nhẹ nhàng, chữ to rõ ràng, nút nhấn to dễ chạm trên máy tính bảng và điện thoại.
- Thiết kế **hoàn toàn Responsive (Tương thích thiết bị di động, tablet, PC)**.
- **Thành phần giao diện hiển thị**:
${uiElementsList}

### VII. ÂM THANH SỬ DỤNG WEB AUDIO API (KHÔNG SỬ DỤNG FILE NGOÀI)
- **RẤT QUAN TRỌNG**: Để game chạy ngoại tuyến mượt mà không bị lỗi tải tệp âm thanh (vốn hay bị chết link hoặc tải chậm), bạn **BẮT BUỘC** phải xử lý âm thanh tự chế bằng **Web Audio API** của HTML5 (sử dụng \`AudioContext\` kết hợp tạo \`OscillatorNode\`, \`GainNode\` tự sinh các dải tần số tiếng nhạc ảo khác nhau bằng mã code JavaScript).
- Vui lòng tích hợp các âm thanh độc quyền sau:
${soundsList}

### VIII. HIỆU ỨNG THỰC TẾ TRỰC QUAN (VISUAL EFFECTS)
- Các sự kiện game phải đi kèm hiệu ứng hoạt họa hoạt hình vui nhộn bằng CSS Animations:
${effectsList}

### IX. HIỂN THỊ KẾT QUẢ ĐẦU RA (RESULTS SCREEN)
- Khi hoàn tất hoặc hết mạng chơi, trò chơi hiển thị màn tổng kết chuyên nghiệp:
${resultList}

---

### X. YÊU CẦU ĐỐI VỚI BẢN XUẤX CODE (CODE ARCHITECTURE RULES)
1. **Không viết code giả, không dùng ghi chú trống**: Không được viết code dang dở dạng \`// chèn logic tại đây\` hoặc \`/* tự viết thêm câu hỏi ở đây */\`. Tất cả hàm, giao diện, vòng lặp game, mảng dữ liệu, âm thanh Web Audio API phải được viết ĐẦY ĐỦ, HOÀN CHỈNH 100%.
2. **Không dùng thư viện Framework cồng kềnh ngoài**: Chỉ sử dụng HTML5, CSS3 hiện đại, và JavaScript thuần túy (Vanilla JS). Bạn có thể tích hợp thư viện FontAwesome hoặc Tailwind CSS thông qua CDN ở thẻ \`<head>\` để vẽ biểu tượng sắc nét, nhưng JavaScript điều khiển game phải viết tay nguyên bản.
3. Code cần tổ chức khoa học: Có các biến cấu hình dễ điều chỉnh ở đầu khay \`<script>\`, phân tách rõ các hàm khởi tạo giao diện, cập nhật điểm, phát nhạc, chuyển màn hình, chấm điểm và cài đặt lại cuộc chơi.

Hãy xuất mã nguồn hoàn chỉnh ở định dạng Markdown block chứa code \`\`\`html để tôi dễ dàng bấm sao chép và đặt tên tệp là \`index.html\`.`;

  return compiled.trim();
}
