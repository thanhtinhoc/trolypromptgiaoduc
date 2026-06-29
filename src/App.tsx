import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Sparkles,
  Copy,
  Trash2,
  Check,
  Heart,
  Clock,
  Music,
  Settings,
  Layers,
  Volume2,
  Zap,
  Award,
  Info,
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Tv,
  Apple,
  Wind,
  Rocket,
  Plus,
  X,
  Shuffle,
  Download,
  Upload,
  ExternalLink,
  LogIn,
  LogOut,
  Database,
  Save,
  FolderOpen,
  Share2,
  Link,
  Lock,
  Globe
} from "lucide-react";
import { GameConfig, GAME_TYPES_PRESETS, TEMPLATE_SAMPLES } from "./types";
import { compilePrompt } from "./promptCompiler";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";
import { auth, db } from "./firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const POPULAR_SUBJECTS = [
  "Toán học",
  "Tiếng Việt / Ngữ văn",
  "Tiếng Anh",
  "Khoa học tự nhiên",
  "Lịch sử & Địa lí",
  "Vật lí",
  "Hóa học",
  "Sinh học",
  "Tin học",
  "Công nghệ",
  "Đạo đức / GDCD",
  "Kỹ năng sống"
];

const DEFAULT_CONFIG: GameConfig = {
  gameName: "",
  subject: "",
  gradeLevel: "",
  topic: "",
  targetPlayers: "",
  duration: "5-10 phút",
  learningGoals: "",
  gameTypes: [],
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
  rawQuestions: "",
  aiGenerateQuestions: true,
  requirePlayerName: true,
  requirePlayerClass: true,
  requirePlayerSchool: false,
  requirePlayerId: false,
  uiTheme: "Thân thiện học đường, rực rỡ sắc màu, hình minh họa ngộ nghĩnh",
  uiColorStyle: "Tươi sáng, năng động, mang tính giáo dục",
  uiElements: [
    "Thanh điểm số (Score bar)",
    "Thanh biểu thị trái tim mạng chơi (Lives count)",
    "Hiển thị cấp độ / câu hỏi hiện tại (ví dụ: 1/5)"
  ],
  enabledSounds: [
    "Âm thanh nhạc nền mở màn lúc nhập thông tin",
    "Âm thanh click chọn các phương án đáp án",
    "Âm thanh chuông báo 'Ting ting' ngân vang khi trả lời Đúng",
    "Âm thanh tiếng bíp buồn bã hoặc tiếng còi xì khi trả lời Sai",
    "Hiệu ứng âm thanh pháo hoa hoặc nhạc hân hoan lúc thắng cuộc về đích"
  ],
  enabledEffects: [
    "Hiệu ứng pháo hoa giấy nổ bung lấp lánh khi hoàn thành trò chơi",
    "Hiệu ứng rung lắc nhẹ hoặc nhấp nháy đỏ khi chọn sai đáp án",
    "Chữ điểm số '+10' hoặc '+20' nổi lên và bay dần lên cao rồi biến mất khi trả lời đúng"
  ],
  resultElements: [
    "Hiển thị tổng hợp thành quả của học sinh: Họ và Tên, Lớp, Trường học",
    "Thống kê trực quan số câu đúng/sai hoàn thành (ví dụ: 4/5 câu đúng)",
    "Hệ thống tự động xếp loại học lực dựa theo số câu trả lời chính xác kèm lời nhận xét dễ thương truyền động lực",
    "Nút 'Chơi lại từ đầu' và nút 'Chụp ảnh lưu kết quả/Chứng chỉ học tập học trò'"
  ]
};

export default function App() {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "warning"; message: string } | null>(null);
  const [newQuestionInput, setNewQuestionInput] = useState<string>("");
  const [customSoundInput, setCustomSoundInput] = useState<string>("");
  const [customEffectInput, setCustomEffectInput] = useState<string>("");
  const [customUIElementInput, setCustomUIElementInput] = useState<string>("");
  const [customResultInput, setCustomResultInput] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | "gameplay" | "questions" | "visuals">("general");

  // Custom Gemini API Key configuration states
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null);
  const [isValidatingKey, setIsValidatingKey] = useState<boolean>(false);
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [hasServerApiKey, setHasServerApiKey] = useState<boolean>(false);

  // Firebase configurations states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [cloudGames, setCloudGames] = useState<any[]>([]);
  const [isLoadingCloudGames, setIsLoadingCloudGames] = useState<boolean>(false);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [loadedConfigId, setLoadedConfigId] = useState<string | null>(null);
  const [isSharingConfigId, setIsSharingConfigId] = useState<string | null>(null);

  const selectedSubjects = config.subject
    ? config.subject.split(", ").map(s => s.trim()).filter(Boolean)
    : [];

  const handleToggleSubject = (subName: string) => {
    let newList: string[];
    if (selectedSubjects.includes(subName)) {
      newList = selectedSubjects.filter((s) => s !== subName);
    } else {
      newList = [...selectedSubjects, subName];
    }
    updateField("subject", newList.join(", "));
  };

  // Firestore error handler conforming to strict standard criteria
  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
    }
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  // Load current user's games from Cloud
  const fetchCloudGames = async (uid: string) => {
    setIsLoadingCloudGames(true);
    const path = "game_configs";
    try {
      const q = query(collection(db, path), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      // Sort client-side by updatedAt descending to prevent index requirement errors
      items.sort((a, b) => {
        const t1 = a.updatedAt?.seconds || 0;
        const t2 = b.updatedAt?.seconds || 0;
        return t2 - t1;
      });
      setCloudGames(items);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      triggerNotification("Không thể tải danh sách trò chơi từ đám mây.", "warning");
    } finally {
      setIsLoadingCloudGames(false);
    }
  };

  // Login with Google
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        triggerNotification(`Chào mừng ${result.user.displayName || 'bạn'} đã đăng nhập thành công!`, "success");
      }
    } catch (error: any) {
      console.error("Lỗi đăng nhập Google:", error);
      if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
        triggerNotification("Hủy bỏ đăng nhập: Bạn đã đóng cửa sổ đăng nhập Google.", "warning");
      } else {
        triggerNotification("Đăng nhập thất bại. Vui lòng thử lại.", "warning");
      }
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCloudGames([]);
      setLoadedConfigId(null);
      triggerNotification("Đã đăng xuất tài khoản.", "success");
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  // Save current config to cloud
  const handleSaveToCloud = async (saveAsNew = false) => {
    if (!user) {
      triggerNotification("Vui lòng đăng nhập tài khoản Google để lưu trữ đám mây!", "warning");
      return;
    }

    if (!config.gameName.trim()) {
      triggerNotification("Vui lòng điền 'Tên trò chơi' trước khi lưu lên đám mây!", "warning");
      setActiveTab("general");
      const el = document.getElementById("gameName-input");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setIsSavingCloud(true);
    const path = "game_configs";
    const targetId = (saveAsNew || !loadedConfigId) ? "cfg_" + Math.random().toString(36).substring(2, 11) : loadedConfigId;

    try {
      const docRef = doc(db, path, targetId);

      let existingCreatedAt = (saveAsNew || !loadedConfigId) ? null : (cloudGames.find(g => g.id === loadedConfigId)?.createdAt || null);
      if (!existingCreatedAt && !saveAsNew && loadedConfigId) {
        try {
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            existingCreatedAt = snap.data()?.createdAt;
          }
        } catch (e) {
          console.error("Lỗi lấy thông tin thời gian khởi tạo:", e);
        }
      }

      const payload = {
        userId: user.uid,
        userEmail: user.email || "",
        gameName: (config.gameName || "").slice(0, 250),
        subject: (config.subject || "").slice(0, 250),
        topic: (config.topic || "").slice(0, 1000),
        config: config,
        createdAt: existingCreatedAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, payload);
      setLoadedConfigId(targetId);
      triggerNotification(`Đã lưu thành công trò chơi "${config.gameName}" lên đám mây!`, "success");
      fetchCloudGames(user.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${targetId}`);
      triggerNotification("Lỗi khi lưu trữ cấu hình lên đám mây.", "warning");
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Delete config from cloud
  const handleDeleteFromCloud = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn cấu hình game "${name}" khỏi đám mây?`)) {
      return;
    }

    const path = "game_configs";
    try {
      await deleteDoc(doc(db, path, id));
      triggerNotification(`Đã xóa vĩnh viễn game "${name}".`, "success");
      if (loadedConfigId === id) {
        setLoadedConfigId(null);
      }
      if (user) {
        fetchCloudGames(user.uid);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
      triggerNotification("Không thể xóa cấu hình trên đám mây.", "warning");
    }
  };

  // Load selected cloud game
  const handleLoadCloudGame = (item: any) => {
    setConfig(item.config);
    setLoadedConfigId(item.id);
    triggerNotification(`Đã nạp thành công trò chơi "${item.config.gameName}" từ bộ lưu trữ đám mây!`, "success");
  };

  // Share game configuration link
  const handleShareGameLink = (id: string, name: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?configId=${id}`;
    setIsSharingConfigId(id);
    
    try {
      navigator.clipboard.writeText(shareUrl);
      triggerNotification(`Đã sao chép liên kết chia sẻ trò chơi "${name}" vào bộ nhớ tạm!`, "success");
    } catch (e) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      triggerNotification(`Đã sao chép liên kết chia sẻ (dự phòng)!`);
    }

    setTimeout(() => {
      setIsSharingConfigId(null);
    }, 3000);
  };

  // Load from localStorage on mount & subscribe to Firebase auth & check share link
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gemini_educational_game_config");
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu từ localStorage", e);
    }

    try {
      const savedKey = localStorage.getItem("gemini_api_key_custom") || "";
      setCustomApiKey(savedKey);
      const savedValid = localStorage.getItem("gemini_api_key_custom_valid");
      if (savedValid === "true") {
        setIsApiKeyValid(true);
      } else if (savedValid === "false") {
        setIsApiKeyValid(false);
      }
    } catch (e) {
      console.error("Lỗi tải API key từ localStorage", e);
    }

    // Check if the backend has a default API Key configured
    const checkServerKeyStatus = async () => {
      try {
        const res = await fetch("/api/status");
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.success && data.hasEnvKey) {
            setHasServerApiKey(true);
          }
        }
      } catch (e) {
        console.error("Lỗi khi kết nối đến máy chủ để lấy thông tin API Key", e);
      }
    };
    checkServerKeyStatus();

    // Helper to fetch sharing link config
    const fetchAndLoadConfig = async (configId: string) => {
      try {
        const docRef = doc(db, "game_configs", configId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.config) {
            setConfig(data.config);
            setLoadedConfigId(configId);
            triggerNotification(`Đã tải thành công cấu hình game "${data.config.gameName || 'Chưa đặt tên'}" chia sẻ từ đám mây!`, "success");
          }
        } else {
          triggerNotification("Không tìm thấy cấu hình trò chơi này trên hệ thống đám mây.", "warning");
        }
      } catch (error) {
        console.error("Lỗi khi tải cấu hình chia sẻ:", error);
        triggerNotification("Không thể tải cấu hình trò chơi. Vui lòng kiểm tra kết nối.", "warning");
      }
    };

    // Check for query parameter structure
    const params = new URLSearchParams(window.location.search);
    const configIdParam = params.get("configId") || params.get("id");
    if (configIdParam) {
      fetchAndLoadConfig(configIdParam);
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchCloudGames(firebaseUser.uid);
      } else {
        setCloudGames([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("gemini_educational_game_config", JSON.stringify(config));
  }, [config]);

  // Show notification utility
  const triggerNotification = (message: string, type: "success" | "warning" = "success") => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const downloadTxtTemplate = () => {
    const content = `Câu hỏi 1: Thiết bị nào sau đây dùng để nhập dữ liệu vào máy tính?
A. Màn hình
B. Máy in
C. Bàn phím
D. Loa
Đáp án đúng: C

Câu hỏi 2: Thủ đô của nước Việt Nam là thành phố nào?
A. Thành phố Hồ Chí Minh
B. Hà Nội
C. Đà Nẵng
D. Cần Thơ
Đáp án đúng: B

Câu hỏi 3: Ai là tác giả của tác phẩm "Truyện Kiều"?
A. Nguyễn Du
B. Nguyễn Trãi
C. Trần Hưng Đạo
D. Hồ Xuân Hương
Đáp án đúng: A

Câu hỏi 4: Nước sôi ở nhiệt độ bao nhiêu độ C ở áp suất tiêu chuẩn?
A. 90 độ C
B. 100 độ C
C. 120 độ C
D. 80 độ C
Đáp án đúng: B

Câu hỏi 5: Tên hành tinh màu đỏ trong Hệ Mặt Trời là gì?
A. Sao Kim
B. Sao Hỏa
C. Sao Mộc
D. Trái Đất
Đáp án đúng: B`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau_cau_hoi_game_giao_duc.txt";
    link.click();
    URL.revokeObjectURL(url);
    triggerNotification("Đã tải xuống file mẫu .txt!");
  };

  const downloadDocTemplate = () => {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "MẪU ĐỊNH DẠNG CÂU HỎI TRÒ CHƠI GIÁO DỤC",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "(Hãy copy toàn bộ nội dung mẫu dưới đây dán thẳng vào ứng dụng)",
                    italics: true,
                    color: "555555",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "" }), // Spacing

              // Q1
              new Paragraph({
                children: [
                  new TextRun({ text: "Câu hỏi 1: Thiết bị nào sau đây dùng để nhập dữ liệu vào máy tính?", bold: true }),
                ],
              }),
              new Paragraph({ text: "A. Màn hình" }),
              new Paragraph({ text: "B. Máy in" }),
              new Paragraph({ text: "C. Bàn phím" }),
              new Paragraph({ text: "D. Loa" }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Đáp án đúng: C", bold: true, color: "15803D" }),
                ],
              }),
              new Paragraph({ text: "" }), // Spacing

              // Q2
              new Paragraph({
                children: [
                  new TextRun({ text: "Câu hỏi 2: Thủ đô của nước Việt Nam là thành phố nào?", bold: true }),
                ],
              }),
              new Paragraph({ text: "A. Thành phố Hồ Chí Minh" }),
              new Paragraph({ text: "B. Hà Nội" }),
              new Paragraph({ text: "C. Đà Nẵng" }),
              new Paragraph({ text: "D. Cần Thơ" }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Đáp án đúng: B", bold: true, color: "15803D" }),
                ],
              }),
              new Paragraph({ text: "" }), // Spacing

              // Q3
              new Paragraph({
                children: [
                  new TextRun({ text: "Câu hỏi 3: Ai là tác giả của tác phẩm \"Truyện Kiều\"?", bold: true }),
                ],
              }),
              new Paragraph({ text: "A. Nguyễn Du" }),
              new Paragraph({ text: "B. Nguyễn Trãi" }),
              new Paragraph({ text: "C. Trần Hưng Đạo" }),
              new Paragraph({ text: "D. Hồ Xuân Hương" }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Đáp án đúng: A", bold: true, color: "15803D" }),
                ],
              }),
              new Paragraph({ text: "" }), // Spacing

              // Q4
              new Paragraph({
                children: [
                  new TextRun({ text: "Câu hỏi 4: Nước sôi ở nhiệt độ bao nhiêu độ C ở áp suất tiêu chuẩn?", bold: true }),
                ],
              }),
              new Paragraph({ text: "A. 90 độ C" }),
              new Paragraph({ text: "B. 100 độ C" }),
              new Paragraph({ text: "C. 120 độ C" }),
              new Paragraph({ text: "D. 80 độ C" }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Đáp án đúng: B", bold: true, color: "15803D" }),
                ],
              }),
              new Paragraph({ text: "" }), // Spacing

              // Q5
              new Paragraph({
                children: [
                  new TextRun({ text: "Câu hỏi 5: Tên hành tinh màu đỏ trong Hệ Mặt Trời là gì?", bold: true }),
                ],
              }),
              new Paragraph({ text: "A. Sao Kim" }),
              new Paragraph({ text: "B. Sao Hỏa" }),
              new Paragraph({ text: "C. Sao Mộc" }),
              new Paragraph({ text: "D. Trái Đất" }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Đáp án đúng: B", bold: true, color: "15803D" }),
                ],
              }),
            ],
          },
        ],
      });

      Packer.toBlob(doc).then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "mau_cau_hoi_game_giao_duc.docx";
        link.click();
        URL.revokeObjectURL(url);
        triggerNotification("Đã tải xuống file mẫu Word chuẩn .docx!");
      });
    } catch (error) {
      console.error(error);
      triggerNotification("Có lỗi xảy ra khi tạo file Word .docx!", "warning");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const reader = new FileReader();

    if (fileExtension === "txt" || fileExtension === "csv") {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setConfig(prev => ({
            ...prev,
            rawQuestions: text,
            aiGenerateQuestions: false
          }));
          // Extract general question count for nicer feedback
          const textBuffer = text.trim();
          let count = 0;
          if (textBuffer.includes("|")) {
            count = textBuffer.split("\n").filter(l => l.includes("|")).length;
          } else {
            count = (textBuffer.match(/(?:câu hỏi|cau hoi|câu|cau)\s*\d*\s*[\.\:\-]/gi) || []).length;
            if (count === 0) {
              count = textBuffer.split("\n").filter(l => l.trim()).length;
            }
          }
          triggerNotification(`Đã tải lên ${file.name} thành công với khoảng ${count} câu hỏi!`, "success");
        }
      };
      reader.readAsText(file, "UTF-8");
    } else if (fileExtension === "docx") {
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        try {
          // Trích xuất văn bản thô từ file Word (.docx) bằng mammoth
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          if (text && text.trim()) {
            setConfig(prev => ({
              ...prev,
              rawQuestions: text,
              aiGenerateQuestions: false
            }));
            const textBuffer = text.trim();
            let count = 0;
            if (textBuffer.includes("|")) {
              count = textBuffer.split("\n").filter(l => l.includes("|")).length;
            } else {
              count = (textBuffer.match(/(?:câu hỏi|cau hoi|câu|cau)\s*\d*\s*[\.\:\-]/gi) || []).length;
              if (count === 0) {
                count = textBuffer.split("\n").filter(l => l.trim()).length;
              }
            }
            triggerNotification(`Đã tải lên tệp Word ${file.name} thành công với khoảng ${count} câu hỏi!`, "success");
          } else {
            triggerNotification("Không thể đọc được dữ liệu chữ từ tệp Word này. Hãy chắc chắn tệp không rỗng.", "warning");
          }
        } catch (err) {
          console.error("Lỗi phân tích file Word:", err);
          triggerNotification("Có lỗi xảy ra khi đọc tệp Word (.docx). Vui lòng lưu dưới dạng .txt hoặc sao chép thủ công.", "warning");
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileExtension === "doc") {
      triggerNotification("Tệp định dạng .doc (Word cũ) không được hỗ trợ trực tiếp. Bạn vui lòng lưu lại dưới dạng .docx (Word mới) hoặc sao chép và dán trực tiếp nhé!", "warning");
    } else {
      triggerNotification("Vui lòng tải lên file văn bản có định dạng .txt, .csv hoặc .docx (Word)!", "warning");
    }
  };

  // Pre-fill fields using selected preset
  const handleLoadTemplate = (presetConfig: GameConfig, titleName: string) => {
    setConfig({ ...presetConfig });
    triggerNotification(`Đã áp dụng mẫu game "${titleName}" thành công!`);
  };

  // Reset inputs
  const handleReset = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hết cấu hình đang nhập để làm lại từ đầu không?")) {
      setConfig({ ...DEFAULT_CONFIG });
      localStorage.removeItem("gemini_educational_game_config");
      triggerNotification("Đã đặt lại dữ liệu biểu mẫu về mặc định chống trơn.");
    }
  };

  // Quick Random Maker
  const handleQuickQuizTemplate = () => {
    const subjects = ["Lịch sử", "Địa lí", "Sinh học", "Hóa học", "Công nghệ"];
    const grades = ["Lớp 4", "Lớp 5", "Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"];
    const topics = [
      "Chiến thắng Điện Biên Phủ hào hùng năm 1954",
      "Bản đồ địa hình Việt Nam, sông ngòi và khí hậu nhiệt đới",
      "Quá trình quang hợp của cây xanh và cấu tạo tế bào thực vật",
      "Bảng tuần hoàn các nguyên tố hóa học phi kim phổ biến",
      "Tìm hiểu các hành tinh rực rỡ xa xôi ngoài khoảng không Trái Đất"
    ];
    const gameNames = [
      "Hành trình lịch sử vinh quang Việt Nam",
      "Du hành địa lý khám phá non sông đất nước",
      "Kỳ tài khoa học nhí du hành rừng xanh",
      "Đấu trường hóa thạch học giả tương lai",
      "Nhà sinh học trẻ tìm kiếm báu vật đại dương"
    ];

    const randomIdx = Math.floor(Math.random() * topics.length);
    const selectedSubject = subjects[Math.min(randomIdx, subjects.length - 1)];
    const selectedGrade = grades[Math.min(randomIdx, grades.length - 1)];
    const selectedTopic = topics[randomIdx];
    const selectedGameName = gameNames[randomIdx];

    setConfig({
      ...DEFAULT_CONFIG,
      gameName: selectedGameName,
      subject: selectedSubject,
      gradeLevel: selectedGrade,
      topic: selectedTopic,
      targetPlayers: `Học sinh tiểu học và trung học ${selectedGrade.toLowerCase()}`,
      duration: "5 đến 8 phút chơi",
      learningGoals: `Giúp nắm vững kiến thức trọng tâm về ${selectedTopic.toLowerCase()} một cách trực quan, hứng thú thông qua các màn đấu trí kịch tính sinh động.`,
      gameTypes: [GAME_TYPES_PRESETS[Math.floor(Math.random() * GAME_TYPES_PRESETS.length)]],
      aiGenerateQuestions: true,
      rawQuestions: `Câu hỏi mẫu số 1? | Đáp án đúng | Đáp án sai số 2 | Đáp án sai số 3 | Đáp án sai số 4 | A | Giải thích chi tiết cho câu hỏi 1.`
    });
    triggerNotification("Đã tự động tạo ngẫu nhiên một cấu hình game mẫu mới siêu tốc!", "success");
  };

  // Form value change helper
  const updateField = (key: keyof GameConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Multi select game type controller
  const handleToggleGameType = (type: string) => {
    const current = [...config.gameTypes];
    if (current.includes(type)) {
      updateField("gameTypes", current.filter((t) => t !== type));
    } else {
      updateField("gameTypes", [...current, type]);
    }
  };

  // Add customized array items
  const handleAddSound = () => {
    if (customSoundInput.trim()) {
      updateField("enabledSounds", [...config.enabledSounds, customSoundInput.trim()]);
      setCustomSoundInput("");
    }
  };

  const handleRemoveSound = (index: number) => {
    updateField("enabledSounds", config.enabledSounds.filter((_, i) => i !== index));
  };

  const handleAddEffect = () => {
    if (customEffectInput.trim()) {
      updateField("enabledEffects", [...config.enabledEffects, customEffectInput.trim()]);
      setCustomEffectInput("");
    }
  };

  const handleRemoveEffect = (index: number) => {
    updateField("enabledEffects", config.enabledEffects.filter((_, i) => i !== index));
  };

  const handleAddUIElement = () => {
    if (customUIElementInput.trim()) {
      updateField("uiElements", [...config.uiElements, customUIElementInput.trim()]);
      setCustomUIElementInput("");
    }
  };

  const handleRemoveUIElement = (index: number) => {
    updateField("uiElements", config.uiElements.filter((_, i) => i !== index));
  };

  const handleAddResultElement = () => {
    if (customResultInput.trim()) {
      updateField("resultElements", [...config.resultElements, customResultInput.trim()]);
      setCustomResultInput("");
    }
  };

  const handleRemoveResultElement = (index: number) => {
    updateField("resultElements", config.resultElements.filter((_, i) => i !== index));
  };

  const [apiKeyErrorMessage, setApiKeyErrorMessage] = useState<string>("");

  // Validate API key
  const validateCustomApiKey = async (keyToValidate?: string) => {
    const key = (keyToValidate !== undefined ? keyToValidate : customApiKey).trim();
    if (!key) {
      triggerNotification("Vui lòng nhập API Key trước khi kiểm tra!", "warning");
      setIsApiKeyValid(false);
      setApiKeyErrorMessage("Bạn chưa điền thông tin API Key. API Key của Gemini thương có định dạng AIzaSy...");
      return;
    }

    setIsValidatingKey(true);
    setIsApiKeyValid(null);
    setApiKeyErrorMessage("");

    try {
      // Gọi đúng route /api/validate theo chuẩn Vercel
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });

      // Kiểm tra Content-Type và HTTP Status trước khi gọi response.json()
      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      // Nếu route không tồn tại hoặc trả về HTML (ví dụ: 404 HTML page)
      if (response.status === 404 || !isJson) {
        setIsApiKeyValid(false);
        const errMsg = "Thiếu API route validate trên Vercel";
        setApiKeyErrorMessage(errMsg);
        localStorage.setItem("gemini_api_key_custom_valid", "false");
        triggerNotification(errMsg, "warning");
        return;
      }

      // Khi chắc chắn là JSON mới parse
      const data = await response.json();

      if (response.ok && data.success) {
        setIsApiKeyValid(true);
        setApiKeyErrorMessage("");
        localStorage.setItem("gemini_api_key_custom", key);
        localStorage.setItem("gemini_api_key_custom_valid", "true");
        triggerNotification("Đã kích hoạt API Key thành công!", "success");
      } else {
        setIsApiKeyValid(false);
        const errMsg = "API key không hợp lệ";
        setApiKeyErrorMessage(errMsg);
        localStorage.setItem("gemini_api_key_custom_valid", "false");
        triggerNotification(errMsg, "warning");
      }
    } catch (error: any) {
      setIsApiKeyValid(false);
      const errMsg = error?.message || "Lỗi kết nối nghiêm trọng đến máy chủ kiểm định API Key.";
      setApiKeyErrorMessage(errMsg);
      localStorage.setItem("gemini_api_key_custom_valid", "false");
      triggerNotification("Lỗi kết nối đến máy chủ kiểm tra API Key.", "warning");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleClearApiKey = () => {
    setCustomApiKey("");
    setIsApiKeyValid(null);
    setApiKeyErrorMessage("");
    localStorage.removeItem("gemini_api_key_custom");
    localStorage.removeItem("gemini_api_key_custom_valid");
    triggerNotification("Đã gỡ bỏ API Key thành công.", "success");
  };

  const generateQuestionsWithGemini = async () => {
    if (!config.topic.trim()) {
      triggerNotification("Vui lòng nhập chủ đề bài học trước khi sinh câu hỏi tự động!", "warning");
      setActiveTab("general");
      return;
    }

    if (customApiKey && isApiKeyValid === false) {
      triggerNotification("API Key hiện tại không hợp lệ! Vui lòng sửa lại khóa hoặc nhấn 'Nạp API Key ngay' để kích hoạt đúng khóa.", "warning");
      return;
    }

    setIsGeneratingQuestions(true);
    triggerNotification("Gemini đang thiết kế câu hỏi trắc nghiệm riêng cho bạn, vui lòng đợi trong giây lát...", "success");

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: customApiKey,
          subject: config.subject,
          gradeLevel: config.gradeLevel,
          topic: config.topic,
          questionsCount: config.questionsCount,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (response.status === 404 || !isJson) {
        triggerNotification("Thiếu API route generate-questions trên Vercel hoặc máy chủ không phản hồi JSON.", "warning");
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        updateField("rawQuestions", data.questions);
        updateField("aiGenerateQuestions", false); // Tắt chế độ tự viết để cho phép xem/sửa câu hỏi trực tiếp
        triggerNotification(`Đã sinh trực tiếp thành công ${config.questionsCount} câu hỏi từ Gemini AI!`, "success");
      } else {
        triggerNotification(data.message || "Sinh câu hỏi thất bại. Vui lòng thử lại.", "warning");
      }
    } catch (err) {
      triggerNotification("Lỗi kết nối máy chủ sinh câu hỏi tự động.", "warning");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Compile output prompt
  const compiledPrompt = compilePrompt(config);

  // Validate fields before copy
  const validateForm = () => {
    const errors: string[] = [];
    if (!config.gameName.trim()) {
      errors.push("Vui lòng nhập Tên trò chơi.");
    }
    if (!config.topic.trim()) {
      errors.push("Vui lòng điền Chủ đề bài học.");
    }
    if (config.gameTypes.length === 0 && !config.customGameType.trim()) {
      errors.push("Vui lòng chọn hoặc tự nhập ít nhất một kiểu trò chơi.");
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Copy with fallback
  const handleCopyPrompt = async () => {
    const isValid = validateForm();
    if (!isValid) {
      triggerNotification("Có một vài mục quan trọng đang bị thiếu!", "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(compiledPrompt);
      setCopied(true);
      triggerNotification("Đã sao chép prompt giáo dục vào bộ nhớ tạm thành công! Giờ hãy dán sang cửa sổ chat Gemini.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers or sandboxed iframe environment
      const textArea = document.createElement("textarea");
      textArea.value = compiledPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        triggerNotification("Đã sao chép prompt giáo dục thành công (phương thức dự phòng).");
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        triggerNotification("Không thể sao chép tự động. Hãy bôi đen chọn toàn bộ kết quả ở khung bên phải !", "warning");
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-950 selection:text-amber-200 pb-12">
      {/* HEADER SECTION WITH SLEEK INDIGO & SLATE ACCENTS */}
      <header className="bg-slate-900/90 backdrop-blur-md text-white shadow-xl sticky top-0 z-40 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-slate-955 text-slate-950 shadow-lg shadow-amber-500/10 animate-float">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight font-display flex items-center flex-wrap gap-2 text-white">
                TRỢ LÝ TẠO PROMPT GAME GIÁO DỤC <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.4)]">For Gemini</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>Thiết lập thông số sư phạm ➜ Tự động tạo siêu Prompt ➜ Copy sang Gemini nhận mã nguồn game HTML chạy ngay</span>
                <span className="text-slate-700 hidden md:inline">|</span>
                <span className="text-amber-400 font-semibold whitespace-nowrap bg-amber-400/10 px-2 py-0.5 rounded border border-amber-500/20">Tác giả: Thầy Võ Châu Thanh (Zalo: 0974754446)</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleQuickQuizTemplate}
              id="btn-quick-random"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-amber-400 focus-glow-amber active:scale-95 text-xs text-amber-100 border border-slate-700/65 rounded-lg transition-all font-semibold font-display shadow-sm cursor-pointer"
              title="Tự động tạo thông tin một chủ đề ngẫu nhiên để trải nghiệm nhanh ứng dụng"
            >
              <Shuffle className="h-3.5 w-3.5 text-amber-500" />
              Tạo mẫu ngẫu nhiên
            </button>
            <button
              onClick={handleReset}
              id="btn-reset-form"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-rose-900/40 hover:text-rose-200 hover:border-rose-800 rounded-lg text-xs font-semibold text-slate-300 border border-slate-800 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa dữ liệu
            </button>

            {/* Google Authentication menu */}
            {!user ? (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-450 hover:to-amber-450 text-slate-950 font-bold rounded-lg transition-all shadow-md active:scale-95 cursor-pointer text-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                Đăng nhập
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-slate-850 pl-2 pr-3 py-1 rounded-xl border border-slate-850 text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-5 h-5 rounded-full border border-amber-500/40" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                    {user.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <span className="text-slate-300 font-medium max-w-[100px] truncate hidden md:inline">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* FLOAT NOTIFICATION BANNER */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-xl shadow-xl border max-w-md animate-bounce ${
            notification.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          {notification.type === "warning" ? (
            <XCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          )}
          <p className="text-xs font-medium leading-relaxed">{notification.message}</p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 mt-6">
        {/* CẤU HÌNH GEMINI API KEY */}
        <div className="mb-6 bg-slate-900 border border-slate-800 focus-glow-amber rounded-2xl overflow-hidden shadow-xl transition-all duration-300">
          <div 
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800/80 cursor-pointer hover:bg-slate-900/80 transition-all select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Settings className={`h-4.5 w-4.5 ${isValidatingKey ? "animate-spin" : ""}`} />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-display flex items-center gap-2">
                  Cấu Hình API Key Trực Tiếp
                  <span className="text-[10px] bg-slate-800 text-amber-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider normal-case font-mono">
                    Để dùng lâu dài
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-medium font-sans">
                  Nhập API Key cá nhân để kiểm tra và trực tiếp sinh bộ câu hỏi bằng AI thay vì copy thủ công
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              {/* Trạng thái xác thực */}
              {isApiKeyValid === true ? (
                <span className="flex items-center gap-1 text-[11px] bg-emerald-950/40 text-emerald-400 font-bold border border-emerald-900/50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Đã kích hoạt
                </span>
              ) : isApiKeyValid === false ? (
                <span className="flex items-center gap-1 text-[11px] bg-red-950/40 text-red-400 font-bold border border-red-900/50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  Khóa không hợp lệ
                </span>
              ) : customApiKey ? (
                <span className="flex items-center gap-1 text-[11px] bg-amber-950/40 text-amber-400 font-bold border border-amber-900/50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Nhấp kiểm tra để lưu lâu dài
                </span>
              ) : hasServerApiKey ? (
                <span className="flex items-center gap-1 text-[11px] bg-teal-950/40 text-teal-400 font-bold border border-teal-900/50 px-2.5 py-1 rounded-full" title="Hệ thống đã nhận diện được API Key mặc định của Google AI Studio!">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  Đã nhận Key hệ thống
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] bg-slate-950 text-slate-400 font-medium border border-slate-800 px-2.5 py-1 rounded-full">
                  Chưa cấu hình API Key
                </span>
              )}
              
              <button 
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition-all cursor-pointer"
              >
                {showKeyInput ? "Thu gọn" : "Cấu hình"}
              </button>
            </div>
          </div>

          {(showKeyInput || isApiKeyValid === null || !customApiKey) && (
            <div className="p-6 bg-slate-900/40 border-t border-slate-950/40 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-8 space-y-1.5 font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                      Nhập Gemini API Key của bạn (Lưu trong LocalStorage):
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-1 text-[11px] font-bold transition-all"
                    >
                      <span>Lấy API Key miễn phí tại Google AI Studio</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeyInput ? "text" : "password"}
                      placeholder="AIzaSy..."
                      value={customApiKey}
                      onChange={(e) => {
                        setCustomApiKey(e.target.value);
                        setIsApiKeyValid(null);
                      }}
                      className={`w-full pl-3.5 pr-20 py-2.5 text-xs rounded-xl border bg-slate-950 focus:outline-none focus:ring-4 text-slate-100 font-mono transition-all ${
                        isApiKeyValid === true
                          ? "border-emerald-500/50 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                          : isApiKeyValid === false
                          ? "border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500 hover:border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)] animate-pulse"
                          : "border-slate-800 focus:ring-amber-500/20 focus:border-amber-500 hover:border-slate-700"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(!showKeyInput)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-all cursor-pointer text-xs font-semibold bg-slate-900 px-2 py-1 rounded"
                      title={showKeyInput ? "Ẩn API Key" : "Hiển thị API Key"}
                    >
                      {showKeyInput ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                  
                  {isApiKeyValid === false && apiKeyErrorMessage && (
                    <div className="p-3 bg-rose-955/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start gap-2.5 shadow-md">
                      <XCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0 animate-bounce" />
                      <div className="space-y-1">
                        <span className="font-extrabold text-rose-400 uppercase tracking-wide text-[10px] block">⚠️ Lỗi / API Key Không Hợp Lệ!</span>
                        <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                          {apiKeyErrorMessage}
                        </p>
                        <ul className="list-disc pl-4 text-[10px] text-slate-400 space-y-0.5">
                          <li>Bạn có vô tình copy thiếu/thừa ký tự hoặc dính dấu cách dư thừa?</li>
                          <li>Chấm xanh lá cây chỉ xuất hiện và lưu trữ lâu dài khi API Key được Google chứng thực thành công.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isValidatingKey}
                    onClick={() => validateCustomApiKey()}
                    className="flex-1 min-w-[125px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950 hover:shadow-lg hover:shadow-amber-500/10 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isValidatingKey ? "animate-spin" : ""}`} />
                    {isValidatingKey ? "Đang xác thực..." : "Kích hoạt & Lưu trữ"}
                  </button>
                  
                  {customApiKey && (
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      className="py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all text-center bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-700/60 hover:border-rose-900 cursor-pointer active:scale-95 text-slate-300"
                      title="Gỡ bỏ hoàn toàn API Key khỏi bộ nhớ cục bộ"
                    >
                      Xóa Key
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed space-y-2">
                <p className="flex items-center gap-1 text-slate-300 font-semibold mb-0.5">
                  <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" /> Hướng dẫn nhanh cách lấy và sử dụng API Key:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">Cách lấy khóa miễn phí:</span>
                    <ol className="list-decimal pl-4 space-y-0.5 text-slate-400">
                      <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300 inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="h-2.5 w-2.5 inline" /></a>.</li>
                      <li>Đăng nhập tài khoản Gmail của bạn, sau đó nhấn nút <strong className="text-slate-300 font-semibold">"Create API key"</strong>.</li>
                      <li>Chọn dự án thích hợp, nhấn tạo và sao chép (copy) chuỗi ký tự API Key nhận được.</li>
                    </ol>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">Lợi ích và Quyền riêng tư:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                      <li><strong className="text-amber-400 font-semibold">Tự động hóa hoàn toàn:</strong> Kích hoạt tính năng "Sinh trực tiếp bộ câu hỏi chuẩn sư phạm" ngay tại tab Bộ Câu Hỏi mà không cần sao chép trung gian.</li>
                      <li><strong className="text-slate-300 font-semibold">Bảo mật tuyệt đối:</strong> API key được lưu trực tiếp tại bộ nhớ cục bộ <strong className="text-amber-300 font-semibold">(LocalStorage)</strong> trên trình duyệt của riêng bạn.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CLOUD SYNC & LIVE STORAGE HUB */}
        <div id="cloud-storage-hub" className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800/80 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-display flex items-center gap-2">
                  Thư Viện Đám Mây & Đồng Bộ Trực Tiếp
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                    Cloud Storage
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-medium font-sans">
                  Lưu trữ lâu dài các bộ game sư phạm của bạn và tạo liên kết chia sẻ trực tuyến nhanh chóng
                </p>
              </div>
            </div>

            {!user ? (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 text-xs font-bold text-white rounded-xl shadow-lg shadow-cyan-500/10 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Đồng bộ ngay qua Google</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-semibold">
                  Tài khoản: <strong className="text-cyan-400">{user.email}</strong>
                </span>
              </div>
            )}
          </div>

          {!user ? (
            <div className="p-6 bg-slate-900/30 text-center space-y-3">
              <div className="max-w-md mx-auto text-slate-400 text-xs leading-relaxed space-y-1">
                <p>💡 Đăng nhập giúp bạn lưu trữ an toàn các bộ câu hỏi không giới hạn số lượng và đồng bộ đồng thời trên nhiều trình duyệt điện thoại, máy tính.</p>
                <p>Nạp lại nhanh cấu hình yêu thích hoặc lấy link ngắn chia sẻ thuận lợi sang các thiết bị khác.</p>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-900/25 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Save Block */}
                <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4.5 space-y-4">
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider block w-fit">
                    Lưu trữ hiện hành
                  </span>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">Trò chơi hiện tại:</label>
                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1.5">
                      <span className="block text-xs font-bold text-slate-200 truncate">
                        {config.gameName || "⚠️ Chưa đặt tên trò chơi"}
                      </span>
                      {config.topic && (
                        <span className="block text-[10px] text-slate-400 font-medium truncate">
                          Chủ đề: {config.topic}
                        </span>
                      )}
                    </div>
                  </div>

                  {loadedConfigId ? (
                    <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-slate-300 leading-relaxed font-sans flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-extrabold">
                        <Lock className="h-3 w-3" />
                        <span>ĐÃ KẾT NỐI KHÓA MÂY</span>
                      </div>
                      <p className="text-slate-400">
                        Cấu hình này có mã lưu trữ đám mây là: <code className="text-amber-400 bg-slate-950 px-1 rounded font-mono">{loadedConfigId}</code>
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveToCloud(false)}
                          disabled={isSavingCloud}
                          className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-950 text-[11px] font-extrabold rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" />
                          <span>Cập nhật</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveToCloud(true)}
                          disabled={isSavingCloud}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 text-[11px] font-extrabold rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 border border-slate-700/50"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Lưu bản mới</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSaveToCloud()}
                      disabled={isSavingCloud}
                      className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-450 active:scale-95 text-slate-950 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-500/5"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSavingCloud ? "Đang đẩy lên mây..." : "Lưu vào thư viện mây"}</span>
                    </button>
                  )}
                </div>

                {/* Database List Block */}
                <div className="lg:col-span-8 bg-slate-950/30 border border-slate-800/80 rounded-xl p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider block w-fit">
                      Danh sách đã lưu ({cloudGames.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchCloudGames(user.uid)}
                      className="text-[10px] text-cyan-400 hover:underline font-bold transition-all"
                    >
                      Nhấp để làm mới ⟳
                    </button>
                  </div>

                  {isLoadingCloudGames ? (
                    <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                      <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
                      <span>Đang đồng bộ dữ liệu thư viện mở rộng...</span>
                    </div>
                  ) : cloudGames.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs space-y-1">
                      <p>Thư mục đám mây trống.</p>
                      <p>Hãy bấm lưu cấu hình ở bên để tải game đầu tiên lên mây!</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1.5 custom-scrollbar">
                      {cloudGames.map((item) => {
                        const isCurrentlyLoaded = loadedConfigId === item.id;
                        return (
                          <div 
                            key={item.id}
                            className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isCurrentlyLoaded
                                ? "bg-cyan-950/20 border-cyan-500/40 shadow-sm"
                                : "bg-slate-950 hover:bg-slate-900 border-slate-850 hover:border-slate-800"
                            }`}
                          >
                            <div className="space-y-1 select-none flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200 truncate block">
                                  {item.gameName || "Chưa đặt tên"}
                                </span>
                                {isCurrentlyLoaded && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800 px-1 py-0.1 rounded">
                                    Đang Mở
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                {item.subject && (
                                  <span className="bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-medium">
                                    {item.subject}
                                  </span>
                                )}
                                {item.topic && (
                                  <span className="text-slate-500 truncate max-w-[200px] block">
                                    Chủ đề: {item.topic}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleLoadCloudGame(item)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold cursor-pointer transition-all ${
                                  isCurrentlyLoaded
                                    ? "bg-slate-800 text-slate-350 cursor-default"
                                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                                }`}
                                disabled={isCurrentlyLoaded}
                              >
                                {isCurrentlyLoaded ? "Đã tải" : "Nạp game"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleShareGameLink(item.id, item.gameName)}
                                className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-400 hover:text-cyan-300 border border-cyan-900 rounded-md text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                                title="Sao chép link chia sẻ bộ game cấu hình này"
                              >
                                <Share2 className="h-3 w-3" />
                                <span>{isSharingConfigId === item.id ? "Đã lưu!" : "Chia sẻ"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteFromCloud(item.id, item.gameName)}
                                className="p-1 px-1.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 rounded-md transition-all cursor-pointer"
                                title="Xóa game vĩnh viễn khỏi đám mây"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-900 leading-relaxed">
                    <Globe className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                    <span>
                      <strong>Mẹo sử dụng Link chia sẻ:</strong> Bạn có thể chia sẻ liên kết này cho bất cứ ai, khi truy cập họ sẽ tự động load nguyên trạng bộ đề câu hỏi cùng cấu hình học thuật bạn xây dựng!
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* PRESET SAMPLES SECTION */}
        <div id="preset-showcase" className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3.5 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-display">
                Chọn Nhanh Từ 3 Mẫu Game Giáo Dục Có Sẵn
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
              Nhấn nút để điền nhanh đầy đủ dữ liệu sư phạm mẫu vào form điều hướng bên dưới
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEMPLATE_SAMPLES.map((tmpl) => {
              const isSelected = config.gameName === tmpl.config.gameName;
              return (
                <div
                  key={tmpl.id}
                  className={`border rounded-xl p-4 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                    isSelected
                      ? "border-amber-500 ring-4 ring-amber-500/10 bg-amber-950/20 glow-amber"
                      : "border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-slate-950/40"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${
                          tmpl.id === "math-apple"
                            ? "bg-red-950/50 text-red-400 border border-red-900/30"
                            : tmpl.id === "english-balloon"
                            ? "bg-sky-950/50 text-sky-400 border border-sky-900/30"
                            : "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30"
                        }`}
                      >
                        {tmpl.id === "math-apple" && <Apple className="h-5 w-5" />}
                        {tmpl.id === "english-balloon" && <Wind className="h-5 w-5" />}
                        {tmpl.id === "science-obstacle" && <Rocket className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-100 font-display leading-tight">{tmpl.title}</h3>
                        <p className="text-xs text-slate-400 font-medium">{tmpl.subtitle}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="bg-amber-500 text-slate-950 rounded-full p-1 text-[10px] shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                    <strong className="text-amber-400">Chủ đề:</strong> {tmpl.config.topic}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadTemplate(tmpl.config, tmpl.title)}
                    className={`mt-4 w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/10"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 hover:text-white"
                    }`}
                  >
                    Kích hoạt mẫu {tmpl.title}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* WORKSPACE ROWS: LEFT FORM (7/12) & RIGHT PREVIEW (5/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* LEFT COLUMN: EDITING FORM (7/12) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Nav Tabs for better form structure */}
            <div className="bg-slate-950 border-b border-slate-800/80 flex flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`flex-1 min-w-[100px] text-center py-3 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 font-display cursor-pointer ${
                  activeTab === "general"
                    ? "bg-slate-900 text-amber-400 border-amber-500 shadow-[inset_0_-2px_0_#f59e0b]"
                    : "text-slate-400 hover:text-amber-400 border-transparent hover:bg-slate-900/40"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Thông Tin Chung
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("gameplay")}
                className={`flex-1 min-w-[150px] text-center py-3 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 font-display cursor-pointer ${
                  activeTab === "gameplay"
                    ? "bg-slate-900 text-amber-400 border-amber-500 shadow-[inset_0_-2px_0_#f59e0b]"
                    : "text-slate-400 hover:text-amber-400 border-transparent hover:bg-slate-900/40"
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                Kiểu Game & Cấu Hình
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("questions")}
                className={`flex-1 min-w-[110px] text-center py-3 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 font-display cursor-pointer ${
                  activeTab === "questions"
                    ? "bg-slate-900 text-amber-400 border-amber-500 shadow-[inset_0_-2px_0_#f59e0b]"
                    : "text-slate-400 hover:text-amber-400 border-transparent hover:bg-slate-900/40"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Bộ Câu Hỏi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("visuals")}
                className={`flex-1 min-w-[150px] text-center py-3 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 font-display cursor-pointer ${
                  activeTab === "visuals"
                    ? "bg-slate-900 text-amber-400 border-amber-500 shadow-[inset_0_-2px_0_#f59e0b]"
                    : "text-slate-400 hover:text-amber-400 border-transparent hover:bg-slate-900/40"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Giao Diện & Hiệu Ứng
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* TAB 1: THÔNG TIN CHUNG */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <span className="h-5 w-5 bg-amber-955/40 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center text-xs font-extrabold">1</span>
                      Thông tin mô tả khái quát trò chơi
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Đặt tên trò chơi, xác định môn học, nhóm học sinh mục tiêu</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                        Tên trò chơi <span className="text-amber-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Chú bé hái táo cứu vương quốc"
                        value={config.gameName}
                        onChange={(e) => updateField("gameName", e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Môn học (Nhập thủ công hoặc bấm chọn nhanh bên dưới)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Toán học, Tiếng Anh..."
                        value={config.subject}
                        onChange={(e) => updateField("subject", e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      />
                    </div>
                  </div>

                  {/* CHỌN NHANH DÀNH CHO MÔN HỌC CHIPS */}
                  <div className="space-y-2">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Chọn nhanh môn học (Hệ thống hỗ trợ phối nhiều môn cùng lúc):
                    </span>
                    <div className="flex flex-wrap gap-1.5 p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
                      {POPULAR_SUBJECTS.map((subName) => {
                        const isSubSelected = selectedSubjects.includes(subName);
                        return (
                          <button
                            key={subName}
                            type="button"
                            onClick={() => handleToggleSubject(subName)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isSubSelected
                                ? "bg-amber-955/35 text-amber-300 border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-2 ring-amber-500/25"
                                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-850"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className={`block w-1.5 h-1.5 rounded-full ${isSubSelected ? "bg-amber-400 animate-pulse" : "bg-slate-705"}`} />
                              {subName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Khối lớp và cấp học
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Lớp 3 tiểu học, Học sinh lớp 6 THCS"
                        value={config.gradeLevel}
                        onChange={(e) => updateField("gradeLevel", e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                        Chủ đề bài học <span className="text-amber-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Bảng cửu chương nhân 7, học từ vựng động vật hoang dã"
                        value={config.topic}
                        onChange={(e) => updateField("topic", e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Đối tượng người chơi
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Trẻ em từ 8-10 tuổi, Học sinh lớp ôn thi đại học..."
                        value={config.targetPlayers}
                        onChange={(e) => updateField("targetPlayers", e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Thời lượng giới hạn tối đa</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 5 phút chơi nhanh, 10 phút"
                        value={config.duration}
                        onChange={(e) => updateField("duration", e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Mục tiêu học tập & sư phạm</label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả mục tiêu cụ thể để Gemini cấu trúc hệ thống giải thích tốt hơn (Ví dụ: Giúp ghi nhớ kiến thức lý thuyết bền bỉ, tạo phản xạ nhẩm phép chia nhanh dưới áp lực tinh lực...)"
                      value={config.learningGoals}
                      onChange={(e) => updateField("learningGoals", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                    />
                  </div>

                  {/* THÔNG TIN NGƯỜI CHƠI TRƯỚC KHI CHƠI */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                      Yêu cầu học sinh nhập thông tin gì khi vào game?
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="flex items-center gap-2 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer bg-slate-950/40 text-slate-400 transition-all select-none">
                        <input
                          type="checkbox"
                          checked={config.requirePlayerName}
                          onChange={(e) => updateField("requirePlayerName", e.target.checked)}
                          className="h-4 w-4 accent-amber-500 rounded border-slate-700 bg-slate-950"
                        />
                        <span className="text-xs font-semibold">Họ và tên</span>
                      </label>

                      <label className="flex items-center gap-2 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer bg-slate-950/40 text-slate-400 transition-all select-none">
                        <input
                          type="checkbox"
                          checked={config.requirePlayerClass}
                          onChange={(e) => updateField("requirePlayerClass", e.target.checked)}
                          className="h-4 w-4 accent-amber-500 rounded border-slate-700 bg-slate-950"
                        />
                        <span className="text-xs font-semibold">Lớp học</span>
                      </label>

                      <label className="flex items-center gap-2 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer bg-slate-950/40 text-slate-400 transition-all select-none">
                        <input
                          type="checkbox"
                          checked={config.requirePlayerSchool}
                          onChange={(e) => updateField("requirePlayerSchool", e.target.checked)}
                          className="h-4 w-4 accent-amber-500 rounded border-slate-700 bg-slate-950"
                        />
                        <span className="text-xs font-semibold">Trường học</span>
                      </label>

                      <label className="flex items-center gap-2 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer bg-slate-950/40 text-slate-400 transition-all select-none">
                        <input
                          type="checkbox"
                          checked={config.requirePlayerId}
                          onChange={(e) => updateField("requirePlayerId", e.target.checked)}
                          className="h-4 w-4 accent-amber-500 rounded border-slate-700 bg-slate-950"
                        />
                        <span className="text-xs font-semibold">Mã số MSHS</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerNotification("Đã áp dụng Thông tin chung thành công!");
                        setActiveTab("gameplay");
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:shadow-amber-500/10 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Áp dụng & Tiếp tục <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: KIỂU GAME & CẤU HÌNH GAMEPLAY */}
              {activeTab === "gameplay" && (
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <span className="h-5 w-5 bg-amber-955/40 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center text-xs font-extrabold font-display">2</span>
                      Chọn kiểu trò chơi chủ đạo (Chọn một hoặc nhiều kiểu)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Gemini sẽ phối hợp các kiểu này để cấu trúc mỹ thuật phù hợp</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {GAME_TYPES_PRESETS.map((type) => {
                      const isChecked = config.gameTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleToggleGameType(type)}
                          className={`text-left p-3 rounded-xl border text-xs font-semibold transition-all relative cursor-pointer ${
                            isChecked
                              ? "bg-amber-955/30 text-amber-300 border-amber-500 font-bold ring-2 ring-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                              : "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-350 hover:bg-slate-950/65 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-4 w-4 rounded flex items-center justify-center text-xs border ${
                                isChecked ? "bg-amber-500 border-amber-500 text-slate-950" : "border-slate-750 bg-slate-900"
                              }`}
                            >
                              {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                            </span>
                            <span>{type}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Kiểu trò chơi tự chọn khác (Ngoại trừ danh sách trên)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Ghép cặp từ vựng tương ứng, câu đố ô chữ cổ tích..."
                      value={config.customGameType}
                      onChange={(e) => updateField("customGameType", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                    />
                  </div>

                  <div className="border-b border-slate-800 pb-1 pt-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                      Cấu hình quy tắc & quy luật chơi (Gameplay parameters)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Số sinh mạng (Số lần sải sai tối đa)</label>
                      <select
                        value={config.livesCount.toString()}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateField("livesCount", val === "Không giới hạn" ? "Không giới hạn" : parseInt(val));
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      >
                        <option value="1" className="bg-slate-900">1 Mạng (Thử thách khắc nghiệt)</option>
                        <option value="3" className="bg-slate-900">3 Mạng (Phổ thông tiêu chuẩn)</option>
                        <option value="5" className="bg-slate-900">5 Mạng (Học sinh dễ thở)</option>
                        <option value="10" className="bg-slate-900">10 Mạng (Dành cho bản mầm non)</option>
                        <option value="Không giới hạn" className="bg-slate-900">Không giới hạn sinh mạng</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Số lượng câu hỏi</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={config.questionsCount}
                        onChange={(e) => updateField("questionsCount", parseInt(e.target.value) || 5)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Cộng điểm (mỗi câu đúng)</label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={config.correctPoints}
                        onChange={(e) => updateField("correctPoints", parseInt(e.target.value) || 10)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={config.hasWrongPenalty}
                            onChange={(e) => updateField("hasWrongPenalty", e.target.checked)}
                            className="h-4 w-4 accent-amber-500 rounded border-slate-700 bg-slate-950"
                          />
                          <span className="text-xs font-bold text-slate-350">Có trừ điểm khi làm Sai</span>
                        </label>
                      </div>

                      {config.hasWrongPenalty && (
                        <div className="pl-6">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">Số điểm trừ mỗi câu sai:</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={config.penaltyPoints}
                            onChange={(e) => updateField("penaltyPoints", parseInt(e.target.value) || 2)}
                            className="w-24 px-2 py-1 text-xs rounded border border-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold text-center bg-slate-950"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={config.hasTimeLimit}
                            onChange={(e) => updateField("hasTimeLimit", e.target.checked)}
                            className="h-4 w-4 accent-amber-500 rounded border-slate-700 bg-slate-950"
                          />
                          <span className="text-xs font-bold text-slate-350">Có giới hạn thời gian</span>
                        </label>
                      </div>

                      {config.hasTimeLimit && (
                        <div className="pl-6">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">Số giây tối đa mỗi câu hỏi:</label>
                          <input
                            type="number"
                            min={5}
                            max={300}
                            value={config.timeLimitSeconds}
                            onChange={(e) => updateField("timeLimitSeconds", parseInt(e.target.value) || 15)}
                            className="w-24 px-2 py-1 text-xs rounded border border-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold text-center bg-slate-950"
                          />
                          <span className="text-[10px] text-slate-500 ml-1.5">giây/câu</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cấu hình màn hình phụ */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                      Bao gồm các màn hình tương tác chuyên sâu nào?
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "hasIntroScreen", title: "Màn hình mở đầu (Intro)", desc: "Bố trí tiêu đề và nút Start cực đại" },
                        { key: "hasTutorialScreen", title: "Popup hướng dẫn chơi (Tutorial)", desc: "Cách kiểm soát luật chơi, phím bấm" },
                        { key: "hasSummaryScreen", title: "Màn tổng kết kết quả (Summary)", desc: "Lời khuyên, thông báo thứ hạng, điểm" },
                        { key: "hasLeaderboard", title: "Bảng xếp hạng (Leaderboard)", desc: "Ghi lại vinh danh các cao thủ" }
                      ].map((screen) => {
                        const isChecked = !!(config as any)[screen.key];
                        return (
                          <label
                            key={screen.key}
                            className={`flex items-center gap-2.5 border rounded-xl p-2.5 cursor-pointer shadow-sm transition-all select-none ${
                              isChecked
                                ? "bg-amber-955/20 text-amber-300 border-amber-500 ring-2 ring-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                                : "border-slate-800 hover:border-slate-750 bg-slate-950/40 text-slate-400"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => updateField(screen.key as any, e.target.checked)}
                              className="h-4 w-4 accent-amber-500 rounded border-slate-700 bg-slate-950"
                            />
                            <div>
                              <p className="text-xs font-bold">{screen.title}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{screen.desc}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("general")}
                      className="px-4 py-2 border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:text-amber-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Quay lại trang 1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerNotification("Đã áp dụng Kiểu game & Cấu hình thành công!");
                        setActiveTab("questions");
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:shadow-amber-500/10 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Áp dụng & Tiếp tục <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: NGÂN HÀNG CÂU HỎI CHUYÊN DỤNG */}
              {activeTab === "questions" && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                          <span className="h-5 w-5 bg-amber-955/40 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center text-xs font-extrabold font-display">3</span>
                          Định dạng danh sách câu hỏi học tập
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Tải câu hỏi của bạn lên hoặc ủy thác Gemini viết mới</p>
                      </div>

                      <label className="inline-flex items-center gap-2 bg-amber-955/20 text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 cursor-pointer font-bold text-xs select-none hover:bg-amber-955/30 shadow-sm">
                        <input
                          type="checkbox"
                          checked={config.aiGenerateQuestions}
                          onChange={(e) => updateField("aiGenerateQuestions", e.target.checked)}
                          className="h-4 w-4 accent-amber-500 rounded border-slate-700 bg-slate-950"
                        />
                        <span>Yêu cầu Gemini tự động tạo câu hỏi</span>
                      </label>
                    </div>
                  </div>

                  {config.aiGenerateQuestions ? (
                    <div className="bg-gradient-to-r from-amber-950/20 to-slate-950/40 p-5 rounded-2xl border border-amber-500/20 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-slate-950 rounded-xl shadow-lg border border-slate-800/80 text-amber-400 flex-shrink-0 animate-pulse">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200 uppercase mb-0.5 tracking-wider">Chế độ rảnh tay: Gemini Tự động sáng tạo</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Hệ thống đã chuẩn bị prompt đầu ra tối ưu để điều khiển Gemini nghiên cứu chủ đề 
                            <strong className="text-amber-400 font-bold"> "{config.topic || 'Chưa nhập chủ đề'}"</strong> của 
                            <strong className="text-amber-300 font-bold"> {config.gradeLevel || 'Chưa nhập khối/lớp'}</strong> môn 
                            <strong className="text-amber-300 font-bold"> {config.subject || 'Chưa nhập môn'}</strong> để tự động lập trình ra {config.questionsCount} câu hỏi chuẩn chỉ, cực vui nhộn và bám sát lý thuyết học đường.
                          </p>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">
                            (Nếu bạn muốn tự dán/nhập thủ công danh sách câu đố của riêng bạn, hãy gạt tắt nút nằm phía góc trên bên phải)
                          </p>
                        </div>
                      </div>

                      {/* NÚT KÍCH HOẠT GENERATION TRỰC TIẾP QUA API */}
                      <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dành riêng cho bạn:</span>
                        {(customApiKey || hasServerApiKey) ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/80 rounded-xl p-3.5 border border-slate-850">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-sans">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                {customApiKey ? "API Key cá nhân đã sẵn sàng sử dụng lâu dài" : "API Key hệ thống đã sẵn sàng hoạt động"}
                              </span>
                              <p className="text-[10px] text-slate-450 text-slate-400">Ứng dụng sẽ kết nối trực tiếp đến Google và chèn câu hỏi vào ô dán tự động.</p>
                            </div>
                            <button
                              type="button"
                              disabled={isGeneratingQuestions}
                              onClick={generateQuestionsWithGemini}
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 outline-none hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Sparkles className={`h-4 w-4 ${isGeneratingQuestions ? "animate-spin" : ""}`} />
                              {isGeneratingQuestions ? "Gemini đang suy nghĩ..." : "Sinh bộ câu hỏi từ Gemini ngay ✨"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/60 text-slate-400">
                            <div className="flex items-start gap-2 max-w-lg">
                              <Info className="h-4.5 w-4.5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-[10px] leading-relaxed text-slate-400">
                                <strong>Sinh câu hỏi tự động siêu tốc:</strong> Hãy nhập & kiểm tra Gemini API Key của bạn ở khung cấu hình phía trên cùng, hệ thống sẽ kích hoạt nút tạo câu hỏi tự động hoàn hảo ngay tại đây!
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowKeyInput(true);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                                triggerNotification("Hãy cuộn lên đầu để điền API Key và nhấn Kích hoạt & Lưu trữ!", "success");
                              }}
                              className="px-3.5 py-1.5 whitespace-nowrap bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold active:scale-95 transition-all text-center cursor-pointer"
                            >
                              Nạp API Key ngay
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs leading-relaxed space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-amber-400" />
                          <strong className="text-amber-400 text-sm">Hỗ trợ 2 định dạng câu hỏi linh hoạt:</strong>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                          <div className="border border-amber-500/25 rounded-xl p-3 bg-amber-500/5">
                            <span className="block font-bold text-amber-400 text-[11px] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                              <span className="bg-amber-500 text-slate-950 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">1</span>
                              Định cư tự nhiên / Copy từ Word:
                            </span>
                            <pre className="text-slate-200 text-[10px] font-mono leading-relaxed bg-slate-900/50 p-2 rounded border border-slate-800/80 max-h-[140px] overflow-y-auto">
{`Câu hỏi 1: 2 x 3 bằng bao nhiêu?
A. 5
B. 6
C. 7
D. 8
Đáp án đúng: B`}
                            </pre>
                            <span className="text-[10px] text-slate-400 mt-1 block leading-normal">
                              Chỉ cần soạn theo từng khối như trên, phân cách nhau bởi 1 dòng trống. Bạn có thể soạn thoải mái trong Word rồi dán vào đây.
                            </span>
                          </div>

                          <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/10">
                            <span className="block font-bold text-slate-300 text-[11px] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                              <span className="bg-slate-700 text-slate-100 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black">2</span>
                              Định dạng gạch đứng | (Một dòng):
                            </span>
                            <pre className="text-slate-300 text-[10px] font-mono leading-relaxed bg-slate-900/50 p-2 rounded border border-slate-800/80 max-h-[140px] overflow-y-auto overflow-x-auto">
{`Câu hỏi | A | B | C | D | Đáp án đúng | Giải thích

Ví dụ:
2 x 3 bằng mấy? | 5 | 6 | 7 | 8 | B | Vì 2 x 3 = 6`}
                            </pre>
                            <span className="text-[10px] text-slate-500 mt-1 block leading-normal">
                              Mỗi câu hỏi nằm gọn trên duy nhất 1 dòng, ngăn cách các cột bằng dấu <code className="text-amber-500 bg-slate-950 px-1 border border-slate-800 rounded">|</code>.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* FILE TEMPLATES & HOVER UPLOAD COMPONENT */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                        {/* Column 1: Download Templates */}
                        <div className="space-y-1.5">
                          <span className="block text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                            <Download className="h-4 w-4 text-amber-400" />
                            1. Tải file mẫu chuẩn (Tự nhiên như ảnh):
                          </span>
                          <p className="text-[11px] text-slate-405 text-slate-400 leading-relaxed">
                            Biên soạn nhanh câu đố bằng cách chỉnh sửa trực tiếp trên file mẫu tự nhiên cực kỳ dễ hiểu dưới đây:
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={downloadTxtTemplate}
                              className="px-3 py-2 bg-slate-900 hover:bg-slate-850 hover:text-amber-400 text-slate-200 border border-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                              title="Tải xuống tệp văn bản .txt định dạng tự nhiên siêu nhẹ"
                            >
                              <FileText className="h-3.5 w-3.5 text-amber-500" />
                              Tải File .TXT mẫu
                            </button>
                            <button
                              type="button"
                              onClick={downloadDocTemplate}
                              className="px-3 py-2 bg-slate-900 hover:bg-slate-850 hover:text-amber-400 text-slate-200 border border-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                              title="Tải xuống tệp Microsoft Word .docx dạng tự nhiên"
                            >
                              <FileText className="h-3.5 w-3.5 text-blue-400" />
                              Tải File Word mẫu
                            </button>
                          </div>
                        </div>

                        {/* Column 2: Upload Files */}
                        <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-4">
                          <span className="block text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                            <Upload className="h-4 w-4 text-amber-400" />
                            2. Tải lên tệp đã hoàn thiện:
                          </span>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Tải file câu hỏi của bạn lên hệ thống để phân tích và trích xuất tự động:
                          </p>
                          <div className="pt-1">
                            <label className="relative flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-900/30 hover:bg-amber-955/5 rounded-xl px-4 py-2 text-center cursor-pointer transition-all duration-300">
                              <Upload className="h-4 w-4 text-amber-500/80 mb-0.5 animate-bounce" />
                              <span className="text-xs text-slate-300 font-bold">Chọn tệp từ thiết bị</span>
                              <span className="text-[9px] text-amber-450 font-semibold bg-amber-450/10 px-2.5 py-1 rounded border border-amber-500/20 mt-1">Hỗ trợ Word (.docx) trực tiếp, .txt, .csv</span>
                              <input
                                type="file"
                                accept=".txt,.doc,.docx,.csv"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Vùng dán danh sách câu hỏi (Định dạng Word chuẩn)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const sampleWordFormat = `Câu hỏi 1: Thiết bị nào sau đây dùng để nhập dữ liệu vào máy tính?
A. Màn hình
B. Máy in
C. Bàn phím
D. Loa
Đáp án đúng: C

Câu hỏi 2: Thủ đô của nước Việt Nam là thành phố nào?
A. Thành phố Hồ Chí Minh
B. Hà Nội
C. Đà Nẵng
D. Cần Thơ
Đáp án đúng: B

Câu hỏi 3: Ai là tác giả của tác phẩm "Truyện Kiều"?
A. Nguyễn Du
B. Nguyễn Trãi
C. Trần Hưng Đạo
D. Hồ Xuân Hương
Đáp án đúng: A

Câu hỏi 4: Nước sôi ở nhiệt độ bao nhiêu độ C (ở điều kiện tiêu chuẩn)?
A. 90 độ C
B. 100 độ C
C. 120 độ C
D. 80 độ C
Đáp án đúng: B

Câu hỏi 5: Tên hành tinh màu đỏ trong Hệ Mặt Trời là gì?
A. Sao Kim
B. Sao Hỏa
C. Sao Mộc
D. Trái Đất
Đáp án đúng: B`;
                              setConfig(prev => ({
                                ...prev,
                                rawQuestions: sampleWordFormat,
                                aiGenerateQuestions: false
                              }));
                              triggerNotification("Đã nạp danh sách câu hỏi định dạng Word mẫu thành công!", "success");
                            }}
                            className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-500/50 px-2.5 py-1 rounded-lg font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                          >
                            <FileText className="h-3 w-3" /> Nạp nhanh 5 câu mẫu chuẩn Word
                          </button>
                        </div>
                        <textarea
                          rows={11}
                          placeholder={`Hãy soạn hoặc dán câu hỏi của bạn theo định dạng tự nhiên như sau:

Câu hỏi 1: Thiết bị nào sau đây dùng để nhập dữ liệu vào máy tính?
A. Màn hình
B. Máy in
C. Bàn phím
D. Loa
Đáp án đúng: C

Câu hỏi 2: Trái Đất quay quanh ngôi sao nào?
A. Mặt Trăng
B. Sao Hỏa
C. Mặt Trời
D. Sao Kim
Đáp án đúng: C

(Bạn có thể bấm nút "Nạp nhanh 5 câu mẫu chuẩn Word" ở trên để xem trực quan và chỉnh sửa trực tiếp!)`}
                          value={config.rawQuestions}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig(prev => ({
                              ...prev,
                              rawQuestions: val,
                              aiGenerateQuestions: val.trim() ? false : prev.aiGenerateQuestions
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-mono transition-all hover:border-slate-700 leading-relaxed"
                        />
                      </div>

                      {/* Phụ trợ thêm dòng nhanh */}
                      <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 space-y-2">
                        <span className="text-[11px] font-bold text-slate-300 uppercase block">Thêm nhanh từng dòng câu hỏi</span>
                        <input
                          type="text"
                          placeholder="Tên hành tinh đỏ? | Sao Mộc | Sao Hỏa | Sao Hải Vương | Trái Đất | B | Sao Hỏa có màu đỏ."
                          value={newQuestionInput}
                          onChange={(e) => setNewQuestionInput(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded border border-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber bg-slate-950 text-slate-100 transition-all hover:border-slate-700"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 font-medium">Nhập xong bấm nút bên cạnh</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (newQuestionInput.trim()) {
                                const currentRaw = config.rawQuestions ? config.rawQuestions + "\n" : "";
                                setConfig(prev => ({
                                  ...prev,
                                  rawQuestions: currentRaw + newQuestionInput.trim(),
                                  aiGenerateQuestions: false
                                }));
                                setNewQuestionInput("");
                                triggerNotification("Đã thêm câu hỏi vào ngân hàng thành công!");
                              }
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 py-1 rounded inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                          >
                            <Plus className="h-3 w-3" /> Thêm vào danh sách
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("gameplay")}
                      className="px-4 py-2 border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:text-amber-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Quay lại trang 2
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerNotification("Đã áp dụng Ngân hàng câu hỏi thành công!");
                        setActiveTab("visuals");
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:shadow-amber-500/10 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Áp dụng & Tiếp tục <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: GIAO DIỆN, ÂM THANH & HIỆU ỨNG (VISUALS) */}
              {activeTab === "visuals" && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <span className="h-5 w-5 bg-amber-955/40 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center text-xs font-extrabold font-display">4</span>
                      Tinh chỉnh phong cách mỹ thuật của game
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Đặt bối cảnh giao diện, màu sắc tươi vui hay huyền ảo</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Bối cảnh giao diện game (UI theme)</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Rừng quả xanh mướt, đại dương xanh thẳm, không gian vụ trụ"
                        value={config.uiTheme}
                        onChange={(e) => updateField("uiTheme", e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Phối dải sắc màu (Colors style)</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Neon xanh tím tương lai, màu xanh nõn chuối vàng sặc sỡ..."
                        value={config.uiColorStyle}
                        onChange={(e) => updateField("uiColorStyle", e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 font-semibold transition-all hover:border-slate-700"
                      />
                    </div>
                  </div>

                  {/* THÀNH PHẦN GIAO DIỆN (UI Elements) CONTROLLER */}
                  <div>
                    <span className="block text-xs font-bold text-slate-300 uppercase mb-2">Các thành phần giao diện bắt buộc:</span>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {config.uiElements.map((item, index) => (
                        <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-955/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg uppercase">
                          {item}
                          <button type="button" onClick={() => handleRemoveUIElement(index)} className="hover:text-amber-400 p-0.5 rounded cursor-pointer">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nút bật tắt âm nhẹ nhàng, Bảng điểm mượt..."
                        value={customUIElementInput}
                        onChange={(e) => setCustomUIElementInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber text-slate-100 transition-all hover:border-slate-700 font-medium"
                      />
                      <button type="button" onClick={handleAddUIElement} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer transition-all">
                        Thêm
                      </button>
                    </div>
                  </div>

                  {/* ÂM THANH WEB AUDIO SYNTHESIZER */}
                  <div>
                    <span className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                      <Volume2 className="h-4 w-4 text-amber-500" />
                      Âm thanh game (Được sinh từ tần số Web Audio API):
                    </span>
                    <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                      Lưu ý: Game được xuất code sài âm giả lập tự động từ tần số OscillatorNode giúp game chạy ổn định offline 100%. Giáo viên có thể tùy biến dải âm dưới đây:
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-800 p-2.5 bg-slate-950/40 rounded-xl">
                      {config.enabledSounds.map((sound, index) => (
                        <div key={index} className="flex justify-between items-center text-xs text-slate-300 bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded-lg shadow-sm">
                          <span className="font-semibold">• {sound}</span>
                          <button type="button" onClick={() => handleRemoveSound(index)} className="text-slate-500 hover:text-amber-400 p-0.5 cursor-pointer">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Ví dụ: Âm thanh gió rít nhẹ lúc bóng nổ..."
                        value={customSoundInput}
                        onChange={(e) => setCustomSoundInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber transition-all hover:border-slate-700 font-medium"
                      />
                      <button type="button" onClick={handleAddSound} className="px-4 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-600 transition-all cursor-pointer">
                        Thêm
                      </button>
                    </div>
                  </div>

                  {/* HIỆU ỨNG THỰC TẾ (EFFECTS) CONTROLLER */}
                  <div>
                    <span className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                      <Music className="h-4 w-4 text-amber-500" />
                      Hiệu ứng Visual hoành tráng:
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-800 p-2.5 bg-slate-950/40 rounded-xl">
                      {config.enabledEffects.map((effect, index) => (
                        <div key={index} className="flex justify-between items-center text-xs text-slate-300 bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded-lg shadow-sm">
                          <span className="font-semibold">• {effect}</span>
                          <button type="button" onClick={() => handleRemoveEffect(index)} className="text-slate-500 hover:text-amber-400 p-0.5 cursor-pointer">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Ví dụ: Cho các ngôi sao bay lượn trên phi thuyền..."
                        value={customEffectInput}
                        onChange={(e) => setCustomEffectInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber transition-all hover:border-slate-700 font-medium"
                      />
                      <button type="button" onClick={handleAddEffect} className="px-4 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-600 cursor-pointer transition-all">
                        Thêm
                      </button>
                    </div>
                  </div>

                  {/* KẾT QUẢ SAU KHI CHƠI (RESULT SCREEN SETUP) */}
                  <div>
                    <span className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                      <Award className="h-4 w-4 text-amber-500" />
                      Yêu cầu hiển thị ở bảng thành tích sau cùng:
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-800 p-2.5 bg-slate-950/40 rounded-xl">
                      {config.resultElements.map((resEl, index) => (
                        <div key={index} className="flex justify-between items-center text-xs text-slate-300 bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded-lg shadow-sm">
                          <span className="font-semibold">• {resEl}</span>
                          <button type="button" onClick={() => handleRemoveResultElement(index)} className="text-slate-500 hover:text-amber-400 p-0.5 cursor-pointer">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Lời khuyên chi tiết cho phụ huynh học kì..."
                        value={customResultInput}
                        onChange={(e) => setCustomResultInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus-glow-amber transition-all hover:border-slate-700 font-medium"
                      />
                      <button type="button" onClick={handleAddResultElement} className="px-4 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-600 transition-all cursor-pointer">
                        Thêm
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("questions")}
                      className="px-4 py-2 border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:text-amber-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Quay lại trang 3
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerNotification("Đã áp dụng tất cả & Tạo Prompt siêu cấp thành công!");
                        const previewEl = document.getElementById("compiled-prompt-section");
                        if (previewEl) {
                          previewEl.classList.add("ring-4", "ring-amber-500/50");
                          setTimeout(() => {
                            previewEl.classList.remove("ring-4", "ring-amber-500/50");
                          }, 1500);
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-lg text-xs font-black shadow-lg shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer uppercase transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="h-4 w-4 text-slate-950 animate-pulse" /> Áp dụng & Tạo Prompt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: GENERATED PROMPT PREVIEW & ACTION (5/12) */}
          <div className="lg:col-span-12 xl:col-span-5 lg:sticky lg:top-[90px] xl:sticky xl:top-[90px]">
            <div id="compiled-prompt-section" className="bg-slate-900 text-slate-100 border border-slate-850 rounded-2xl p-5 shadow-2xl flex flex-col justify-between max-h-[calc(100vh-140px)] overflow-hidden transition-all duration-500">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-display">
                      Kết Quả Prompt Siêu Cấp Được Tự Động Tạo
                    </h2>
                    <p className="text-[10px] text-slate-400 font-medium">Tự động biên dịch từ khâu thiết lập biểu mẫu bên trái</p>
                  </div>
                </div>

                <div className="text-[10px] bg-slate-800 text-slate-350 font-mono px-2 py-0.5 rounded border border-white/5">
                  Độ dài: {compiledPrompt.length} kí tự
                </div>
              </div>

              {/* LIVE VIEW CHANGER WARNING FOR BETTER UX IN VIETNAMESE */}
              <div className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] rounded-xl p-3 mb-4 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Sao chép prompt dưới đây rồi dán vào cửa sổ chat của Google Gemini. Nhận mã nguồn 
                  <strong className="text-white"> 100% đầy đủ</strong>, lưu thành đuôi <code className="bg-slate-800 text-yellow-300 px-1 py-0.5 rounded font-mono font-bold">.html</code> và mở trực tiếp cực dễ dàng.
                </div>
              </div>

              {/* RENDER FOR PREVIEW */}
              <div className="relative group/textarea flex-1 max-h-[360px] lg:max-h-[500px] overflow-y-auto bg-slate-950 rounded-xl border border-white/5 shadow-inner p-3">
                <pre className="text-[11px] font-mono whitespace-pre-wrap text-slate-300 leading-relaxed font-mono select-all">
                  {compiledPrompt}
                </pre>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 space-y-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                  <span>Trò chơi: <strong className="text-amber-400">{config.gameName || "Chưa nhập tên"}</strong></span>
                  <span>Môn học: <strong className="text-amber-300">{config.subject || "Chưa nhập môn"}</strong></span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleCopyPrompt}
                    id="btn-copy-prompt"
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 font-display flex items-center justify-center gap-1.5 uppercase transition-all transform active:scale-95 cursor-pointer glow-amber"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 stroke-[3]" />
                        ĐÃ SAO CHÉP
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Sao chép Prompt
                      </>
                    )}
                  </button>

                  <a
                    href="https://gemini.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 bg-slate-850 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-black font-display flex items-center justify-center gap-1.5 uppercase border border-amber-500/20 active:scale-95 transition-all text-center cursor-pointer"
                    title="Mở tab mới đến ngay cổng thông tin đối thoại của Google Gemini AI"
                  >
                    <Tv className="h-4 w-4 text-amber-500" />
                    Mở Gemini <span className="text-[9px] text-amber-400 block">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER METADATA & INSTRUCTIONS */}
      <footer className="max-w-7xl mx-auto px-4 mt-12 pt-6 pb-8 border-t border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs text-center md:text-left">
          <div>
            <p className="font-semibold text-slate-400">Trợ Lý Lập Trình Prompt Trò Chơi Giáo Dục - Phiên bản Lớp Học lắp ráp chuyên sâu</p>
            <p className="mt-0.5 text-slate-400">Một công cụ hỗ trợ Giáo viên, Giảng viên kiến tạo học liệu số nhanh chóng.</p>
            <p className="mt-2 text-slate-450 text-slate-400">
              <span className="font-semibold text-amber-400">Tác giả phát triển:</span> Thầy Võ Châu Thanh {" "}
              <span className="text-slate-700">|</span>{" "}
              <span className="font-semibold text-sky-400">Liên hệ Zalo:</span>{" "}
              <a href="https://zalo.me/0974754446" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-sky-400 hover:text-sky-300 transition-colors">
                0974754446
              </a>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="font-medium bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">Offline LocalStorage Cache Active</span>
            <span className="font-mono text-slate-400">© 2026 Thầy Võ Châu Thanh</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
