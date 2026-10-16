export type NavItem = { href: string; label: string; en: string; icon: string; group: string };

export const NAV: NavItem[] = [
  { href: "/", label: "學習儀表板", en: "Dashboard", icon: "LayoutDashboard", group: "總覽" },
  { href: "/diagnostic", label: "診斷測驗", en: "Diagnostic", icon: "ClipboardCheck", group: "總覽" },
  { href: "/jd", label: "JD 需求對照", en: "JD Mapping", icon: "Target", group: "總覽" },
  { href: "/plan", label: "14 天計畫", en: "Study Plan", icon: "CalendarDays", group: "總覽" },
  { href: "/learn", label: "技術課程", en: "Learning Center", icon: "BookOpen", group: "技術" },
  { href: "/labs", label: "互動實驗室", en: "Technical Labs", icon: "FlaskConical", group: "技術" },
  { href: "/review", label: "錯題與複習", en: "Review", icon: "Repeat", group: "技術" },
  { href: "/english", label: "英文面試題庫", en: "Interview Q&A", icon: "Languages", group: "英文與面試" },
  { href: "/speaking", label: "口說聽力練習", en: "Speaking", icon: "Mic", group: "英文與面試" },
  { href: "/mock", label: "模擬面試", en: "Mock Interview", icon: "MessagesSquare", group: "英文與面試" },
  { href: "/copilot", label: "Interview Copilot", en: "Copilot", icon: "Zap", group: "英文與面試" },
  { href: "/notes", label: "筆記與書籤", en: "Notes", icon: "NotebookPen", group: "其他" },
  { href: "/settings", label: "設定", en: "Settings", icon: "Settings", group: "其他" },
];
