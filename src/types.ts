export interface GameConfig {
  // 1. Thông tin chung
  gameName: string;
  subject: string;
  gradeLevel: string;
  topic: string;
  targetPlayers: string;
  duration: string;
  learningGoals: string;

  // 2. Kiểu trò chơi
  gameTypes: string[];
  customGameType: string;

  // 3. Cấu hình gameplay
  livesCount: number | "Không giới hạn";
  questionsCount: number;
  correctPoints: number;
  hasWrongPenalty: boolean;
  penaltyPoints: number;
  hasTimeLimit: boolean;
  timeLimitSeconds: number;
  hasIntroScreen: boolean;
  hasTutorialScreen: boolean;
  hasSummaryScreen: boolean;
  hasLeaderboard: boolean;

  // 4. Danh sách câu hỏi
  rawQuestions: string;
  aiGenerateQuestions: boolean;

  // 5. Thông tin người chơi
  requirePlayerName: boolean;
  requirePlayerClass: boolean;
  requirePlayerSchool: boolean;
  requirePlayerId: boolean;

  // 6. Giao diện trò chơi
  uiTheme: string;
  uiColorStyle: string; // Tươi sáng, hiện đại, tối đơn giản...
  uiElements: string[]; // các thành phần giao diện bắt buộc

  // 7. Âm thanh và hiệu ứng
  enabledSounds: string[];
  enabledEffects: string[];

  // 8. Kết quả sau khi chơi
  resultElements: string[];
}

export const GAME_TYPES_PRESETS = [
  "Trắc nghiệm vượt chướng ngại vật",
  "Hái táo trả lời câu hỏi",
  "Bắn bóng bay",
  "Đua xe tri thức",
  "Mê cung học tập",
  "Rung chuông vàng",
  "Ai là triệu phú",
  "Lật mảnh ghép",
  "Phiêu lưu qua các màn chơi",
];

export const TEMPLATE_SAMPLES: { id: string; title: string; subtitle: string; icon: string; config: GameConfig }[] = [
  {
    id: "math-apple",
    title: "Toán học Tiểu Học",
    subtitle: "Trò chơi hái táo bổ ích",
    icon: "Apple",
    config: {
      gameName: "Chú bé hái táo thông thái",
      subject: "Toán học",
      gradeLevel: "Lớp 3",
      topic: "Bảng nhân 6, 7, 8 và phép chia tương đương",
      targetPlayers: "Học sinh tiểu học (8-9 tuổi)",
      duration: "5 - 7 phút",
      learningGoals: "Giúp học sinh ghi nhớ nhanh bảng nhân chia, phản xạ tính toán nhanh và tự tin yêu thích học Toán.",
      gameTypes: ["Hái táo trả lời câu hỏi"],
      customGameType: "",
      livesCount: 3,
      questionsCount: 5,
      correctPoints: 10,
      hasWrongPenalty: true,
      penaltyPoints: 2,
      hasTimeLimit: true,
      timeLimitSeconds: 15,
      hasIntroScreen: true,
      hasTutorialScreen: true,
      hasSummaryScreen: true,
      hasLeaderboard: true,
      rawQuestions: `6 x 7 bằng bao nhiêu? | 42 | 36 | 48 | 45 | A | Vì 6 x 7 = 42
48 : 6 bằng bao nhiêu? | 6 | 7 | 8 | 9 | C | Vì 6 x 8 = 48
7 x 8 bằng bao nhiêu? | 54 | 56 | 58 | 60 | B | Vì 7 x 8 = 56
63 : 7 bằng bao nhiêu? | 8 | 9 | 10 | 7 | B | Vì 7 x 9 = 63
8 x 9 bằng bao nhiêu? | 68 | 70 | 72 | 74 | C | Vì 8 x 9 = 72`,
      aiGenerateQuestions: false,
      requirePlayerName: true,
      requirePlayerClass: true,
      requirePlayerSchool: true,
      requirePlayerId: false,
      uiTheme: "Rừng táo xanh hoạt họa thân thiện, rực rỡ sắc màu sinh động",
      uiColorStyle: "Tươi sáng, năng động, đậm chất hoạt hình giáo dục hỗ trợ mắt trẻ em",
      uiElements: ["Thanh điểm số (Score bar)", "Thanh biểu thị 3 trái tim sinh mạng", "Đồng hồ cát đếm ngược", "Nút Sound bật/tắt"],
      enabledSounds: [
        "Âm thanh chim hót vui tươi lúc bắt đầu",
        "Âm thanh sột soạt khi giỏ hứng táo rơi tự do",
        "Âm thanh tiếng 'Ting ting' vui nhộn khi trả lời đúng",
        "Âm thanh tiếng bíp nhẹ khi chọn sai và quả táo héo rơi rụng",
        "Nhạc nền chiến thắng vui tươi hào hùng khi hoàn thành chặng chơi"
      ],
      enabledEffects: [
        "Hiệu ứng táo chín vàng rơi từ trên cây rụng xuống giỏ khi trả lời đúng",
        "Hiệu ứng pháo hoa giấy rực rỡ bắn ra từ hai bên màn hình khi hoàn thành game",
        "Hiệu ứng cộng điểm bay lên kèm chữ '+10'"
      ],
      resultElements: [
        "Bảng thống kê kết quả: Có Tên, Lớp, Trường học",
        "Tổng số câu đúng (ví dụ: 4/5 câu), số điểm đạt được (ví dụ: 40 điểm)",
        "Đánh giá xếp loại: Xuất sắc (5/5 câu), Khá (3-4/5 câu), Cần cố gắng (dưới 3 câu có lời động viên)",
        "Nút 'Chơi lại' và nút 'Tải kết quả PDF/Ảnh chụp thành tích'"
      ]
    }
  },
  {
    id: "english-balloon",
    title: "Tiếng Anh Sôi Động",
    subtitle: "Bắn bóng bay học từ vựng",
    icon: "Wind",
    config: {
      gameName: "World Explorer: Word Popper",
      subject: "Tiếng Anh",
      gradeLevel: "Lớp 5 / Trung tâm ngoại ngữ",
      topic: "Từ vựng về Chủ đề Thiên nhiên & Động vật hoang dã",
      targetPlayers: "Học sinh trung học cơ sở và tiểu học (10-11 tuổi)",
      duration: "8 phút",
      learningGoals: "Tăng vốn từ vựng tiếng Anh chủ đề Nature & Animals, rèn luyện tốc độ đọc hiểu và khớp nghĩa tiếng Việt nhanh.",
      gameTypes: ["Bắn bóng bay"],
      customGameType: "",
      livesCount: 5,
      questionsCount: 5,
      correctPoints: 20,
      hasWrongPenalty: true,
      penaltyPoints: 5,
      hasTimeLimit: true,
      timeLimitSeconds: 20,
      hasIntroScreen: true,
      hasTutorialScreen: true,
      hasSummaryScreen: true,
      hasLeaderboard: true,
      rawQuestions: `Con vật nào là 'Elephant'? | Con khỉ | Con voi | Con hổ | Con gà | B | Elephant nghĩa là con voi
'Forest' có nghĩa tiếng Việt là gì? | Bầu trời | Đại dương | Cánh rừng | Sa mạc | C | Forest nghĩa là cánh rừng
Đâu là từ tiếng Anh của 'Sông'? | River | Lake | Mountain | Stream | A | River nghĩa là sông
Con vật nào sau đây bay được? | Lion | Monkey | Eagle | Bear | C | Eagle nghĩa là chim đại bàng có thể bay
Từ nào chỉ 'Trái Đất'? | Moon | Earth | Sun | Star | B | Earth có nghĩa là Trái Đất`,
      aiGenerateQuestions: false,
      requirePlayerName: true,
      requirePlayerClass: true,
      requirePlayerSchool: false,
      requirePlayerId: true,
      uiTheme: "Bầu trời xanh ngập tràn mây trắng bồng bềnh, các loại khinh khí cầu bay lơ lửng",
      uiColorStyle: "Hiện đại, sặc sỡ, phong cách bầu trời tươi đẹp thư thái",
      uiElements: ["Bóng bay mang chữ đáp án bay từ dưới lên", "Cung tên hoặc súng bắn bóng nhấp nháy chuyển động", "Bảng điểm góc phải", "Số lượng bong bóng còn lại"],
      enabledSounds: [
        "Âm thanh vút bay của khinh khí cầu khi bắt đầu",
        "Âm thanh tiếng nổ 'Bùm' vui tai sắc nét khi bắn trúng quả bóng đúng",
        "Âm thanh xì hơi buồn cười khi bắn nhầm bong bóng sai",
        "Nhạc nền hoạt náo, hồi hộp tăng dần nhịp độ"
      ],
      enabledEffects: [
        "Bóng bay nổ vỡ tung thành các hạt kim tuyến lấp lánh",
        "Nút bấm rung lắc nảy nhẹ khi di chuột qua",
        "Hiệu ứng pháo hoa bông hoa nở bung rạng ngời khi hoàn tất toàn bộ câu hỏi"
      ],
      resultElements: [
        "Thông số học tập của học viên: Tên, Lớp, Mã số học sinh",
        "Báo cáo chi tiết số câu đúng, câu sai, tổng điểm",
        "Huy hiệu khen thưởng tượng trưng (Vàng/Bạc/Đồng) tùy theo điểm số",
        "Nút chơi lại ngay lập tức và Form nhập thông tin lưu bảng vàng thành tích"
      ]
    }
  },
  {
    id: "science-obstacle",
    title: "Khoa học Khám Phá",
    subtitle: "Vượt chướng ngại vật vũ trụ",
    icon: "Rocket",
    config: {
      gameName: "Nhà thiên văn học nhí vượt chướng ngại vật vũ trụ",
      subject: "Khoa học tự nhiên",
      gradeLevel: "Lớp 6",
      topic: "Các hành tinh trong Hệ Mặt Trời",
      targetPlayers: "Học sinh trung học cơ sở (11-12 tuổi)",
      duration: "10 phút",
      learningGoals: "Hiểu được vị trí, đặc tính của các hành tinh trong Hệ Mặt Trời, kích thích trí tò mò khoa học vũ trụ học đường.",
      gameTypes: ["Trắc nghiệm vượt chướng ngại vật", "Phiêu lưu qua các màn chơi"],
      customGameType: "",
      livesCount: 3,
      questionsCount: 5,
      correctPoints: 50,
      hasWrongPenalty: false,
      penaltyPoints: 0,
      hasTimeLimit: false,
      timeLimitSeconds: 30,
      hasIntroScreen: true,
      hasTutorialScreen: true,
      hasSummaryScreen: true,
      hasLeaderboard: true,
      rawQuestions: `Hành tinh nào gần Mặt Trời nhất? | Sao Kim | Sao Thủy | Sao Hỏa | Trái Đất | B | Sao Thủy (Mercury) nằm ở vị trí gần Mặt Trời nhất
Hành tinh nào được gọi là 'Hành tinh đỏ'? | Sao Hỏa | Sao Mộc | Sao Thổ | Sao Kim | A | Sao Hỏa (Mars) có bề mặt giàu oxit sắt nên có màu đỏ đặc trưng
Trái Đất là hành tinh thứ mấy tính từ Mặt Trời? | Thứ 2 | Thứ 3 | Thứ 4 | Thứ 5 | B | Trái Đất nằm ở vị trí thứ ba tính từ Mặt Trời
Hành tinh nào có kích thước lớn nhất trong Hệ Mặt Trời? | Sao Thổ | Sao Thiên Vương | Sao Mộc | Sao Hải Vương | C | Sao Mộc (Jupiter) là hành tinh lớn nhất trong Hệ Mặt Trời
Hành tinh duy nhất có sự sống phát triển mạnh mẽ được ghi nhận? | Sao Kim | Sao Hỏa | Trái Đất | Sao Hải Vương | C | Trái Đất là hành tinh duy nhất hiện tại có sự sống phong phú`,
      aiGenerateQuestions: false,
      requirePlayerName: true,
      requirePlayerClass: true,
      requirePlayerSchool: true,
      requirePlayerId: true,
      uiTheme: "Không gian vũ trụ sâu thẳm huyền bí với phi thuyền cứu thế bay lượn tránh né thiên thạch",
      uiColorStyle: "Huyền bí, viễn tưởng hiện đại với tông xanh neon tím sành điệu",
      uiElements: ["Phi thuyền vũ trụ đại diện cho người chơi", "Thiên thạch hoặc hố đen chắn đường chứa câu hỏi", "Thanh năng lượng đại diện mạng hồi phục", "Hiển thị quỹ đạo hành tinh nền"],
      enabledSounds: [
        "Tiếng động cơ phi thuyền gầm rú kịch tính",
        "Tiếng sấm va chạm nổ cực mạnh khi phi thuyền dính chướng ngại vật do trả lời sai",
        "Tiếng sóng điện tử laser 'Zew zew' khi trả lời đúng hạ gục thiên thạch",
        "Nhạc nền không gian ngân vang bay bổng kịch tính"
      ],
      enabledEffects: [
        "Màn hình rung động mạnh khi va chạm sai",
        "Tia điện laser quét ngang màn hình phá hủy trở ngại thiên thạch khi trả lời đúng",
        "Hạt bụi sao rơi chậm lãng mạn phía sau nền trời đen tối"
      ],
      resultElements: [
        "Chứng nhận 'Phi Hành Gia Huyền Thoại' ghi tên lớp trường của học sinh",
        "Tổng điểm, số câu chuẩn xác, thời gian hoàn thành",
        "Lời nhận xét tinh nghịch thúc đẩy động lực khám phá khoa học",
        "Nút quay lại trạm chính chơi lại hoặc sao chép báo cáo nhiệm vụ"
      ]
    }
  }
];
