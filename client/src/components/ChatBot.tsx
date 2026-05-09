/*
 * MY비서 플로팅 챗봇
 * - 우측 하단 플로팅 버튼 → 챗봇 창 열림
 * - LLM과 대화하며 서비스 안내
 * - "상담 신청하기" 버튼 클릭 시에만 무료 상담 의뢰 폼 표시
 * - 신청서 이후에도 대화 계속 가능 (신청서 아래에 메시지 이어짐)
 * - 모바일 전체 화면 최적화 (확대 방지, 키보드 대응)
 */
import { useState, useRef, useEffect, useCallback } from "react";
// framer-motion 제거 → CSS 애니메이션으로 교체 (초기 번들 경량화)
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  User,
  CheckCircle,
  Shield,
  Check,
  Globe,
  MonitorSmartphone,
  FileText,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEventLogger } from "@/hooks/useEventLogger";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// LLM 응답에서 모든 마크다운 기호 제거 — 자연스러운 대화 톤 유지
function stripMarkdown(text: string): string {
  return text
    // 볼드+이탤릭 ***text*** → text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    // 볼드 **text** → text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // 이탤릭 *text* → text (리스트 항목 제외)
    .replace(/(?<!^)\*([^*\n]+)\*/gm, '$1')
    // 리스트 항목 "* " → "• "
    .replace(/^\s*\*\s+/gm, '• ')
    // 숫자 리스트 "1. " 그대로 유지
    // 헤더 "### " → 제거
    .replace(/^#{1,6}\s+/gm, '')
    // 인라인 코드 `code` → code
    .replace(/`([^`]+)`/g, '$1')
    // 링크 [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

// 채팅 아이템 타입: 메시지 또는 신청서 폼 또는 신청 완료
type ChatItem =
  | { type: "message"; msg: ChatMessage }
  | { type: "inquiry-button" }
  | { type: "inquiry-form" }
  | { type: "inquiry-submitted" };

const PACKAGE_OPTIONS = [
  {
    id: "has-website",
    label: "병원 홈페이지가 있는 경우",
    desc: "AI 환자 응대 + AI 노출 최적화 + 콘텐츠 제작",
    icon: MonitorSmartphone,
  },
  {
    id: "no-website",
    label: "병원 홈페이지가 없는 경우",
    desc: "홈페이지 제작 + AI 환자 응대 + AI 노출 최적화",
    icon: Globe,
  },
];

function generateSessionKey() {
  return "chat_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionKey] = useState(() => {
    try {
      const stored = sessionStorage.getItem("mybiseo_chat_session");
      if (stored) return stored;
      const key = generateSessionKey();
      sessionStorage.setItem("mybiseo_chat_session", key);
      return key;
    } catch {
      return generateSessionKey();
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // 신청서 관련 상태
  const [showInquiryButton, setShowInquiryButton] = useState(false);
  const [inquiryFormOpen, setInquiryFormOpen] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  // 신청서가 삽입된 메시지 인덱스 (신청서 이후 메시지가 그 아래에 표시되도록)
  const [inquiryInsertedAtIndex, setInquiryInsertedAtIndex] = useState<number | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [etcChecked, setEtcChecked] = useState(false);
  const [etcText, setEtcText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.chat.send.useMutation({ onError: (err) => toast.error(err.message) });
  const inquiryMutation = trpc.inquiry.submit.useMutation({ onError: (err) => toast.error(err.message) });
  const { logEvent } = useEventLogger();

  // 채팅 시작 이벤트 로깅
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      logEvent("chat_start");
    }
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    // 약간의 딜레이를 줘서 DOM 업데이트 후 스크롤
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, inquiryFormOpen, inquirySubmitted, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // 모바일에서 자동 포커스 시 키보드가 올라오면서 화면이 확대되는 것을 방지
      // 데스크톱에서만 자동 포커스
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  // 채팅 아이템 목록 생성 (메시지 + 신청서를 올바른 순서로 배치)
  const chatItems: ChatItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    chatItems.push({ type: "message", msg: messages[i] });

    // 신청서 버튼/폼/완료를 삽입할 위치 결정
    if (inquiryInsertedAtIndex !== null && i === inquiryInsertedAtIndex) {
      if (inquirySubmitted) {
        chatItems.push({ type: "inquiry-submitted" });
      } else if (inquiryFormOpen) {
        chatItems.push({ type: "inquiry-form" });
      }
    }
  }

  // 신청서가 아직 삽입되지 않았고, 버튼을 보여줘야 할 때 (마지막에 버튼 표시)
  if (showInquiryButton && !inquiryFormOpen && !inquirySubmitted && inquiryInsertedAtIndex === null) {
    chatItems.push({ type: "inquiry-button" });
  }

  const handleSelect = (id: string) => {
    if (id === "etc") {
      setEtcChecked(!etcChecked);
      if (selectedPackage) setSelectedPackage(null);
    } else {
      setSelectedPackage(selectedPackage === id ? null : id);
      setEtcChecked(false);
      setEtcText("");
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const result = await chatMutation.mutateAsync({
        messages: newMessages,
        sessionKey,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: stripMarkdown(result.reply) },
      ]);

      // LLM이 신청서를 보여주라고 했을 때 → 버튼만 표시 (자동으로 폼 열지 않음)
      if (result.showInquiryForm && !inquirySubmitted) {
        setShowInquiryButton(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOpenInquiryForm = () => {
    setInquiryFormOpen(true);
    setShowInquiryButton(false);
    // 현재 마지막 메시지 인덱스에 신청서 삽입
    setInquiryInsertedAtIndex(messages.length - 1);
    scrollToBottom();
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.phone || !inquiryForm.email) {
      toast.error("성함, 연락처, 이메일을 입력해주세요.");
      return;
    }
    if (!selectedPackage && !etcChecked) {
      toast.error("서비스를 선택해주세요.");
      return;
    }
    if (etcChecked && !etcText.trim()) {
      toast.error("기타 항목에 내용을 입력해주세요.");
      return;
    }

    let message = "";
    if (selectedPackage) {
      const pkg = PACKAGE_OPTIONS.find((o) => o.id === selectedPackage);
      message = pkg ? `${pkg.label} (${pkg.desc})` : selectedPackage;
    } else if (etcChecked) {
      message = `기타: ${etcText.trim()}`;
    }

    try {
      await inquiryMutation.mutateAsync({
        name: inquiryForm.name,
        phone: inquiryForm.phone,
        email: inquiryForm.email,
        message,
        sessionKey,
      });
      setInquirySubmitted(true);
      setInquiryFormOpen(false);
      toast.success("신청이 접수되었습니다!");
    } catch {
      toast.error("접수 중 오류가 발생했습니다.");
    }
  };

  const suggestedQuestions = [
    "병원에 AI를 어떻게 도입하나요?",
    "비용은 얼마나 드나요?",
    "의료법 위반은 없나요?",
  ];

  const chatInputClass =
    "w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/50 text-[16px] outline-none focus:border-brand/40";

  // 신청서 폼 렌더링
  const renderInquiryForm = () => (
    <div
      className="bg-brand/5 border border-brand/20 rounded-xl p-4 mt-2"
      style={{ animation: "chatFadeIn 0.2s ease-out both" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-brand" />
        <p className="text-[13px] font-semibold text-foreground">
          무료 상담 의뢰하기
        </p>
      </div>
      <form onSubmit={handleInquirySubmit} className="space-y-2">
        <input
          type="text"
          value={inquiryForm.name}
          onChange={(e) =>
            setInquiryForm({ ...inquiryForm, name: e.target.value })
          }
          placeholder="성함"
          className={chatInputClass}
        />
        <input
          type="tel"
          value={inquiryForm.phone}
          onChange={(e) =>
            setInquiryForm({ ...inquiryForm, phone: e.target.value })
          }
          placeholder="연락처"
          className={chatInputClass}
        />
        <input
          type="email"
          value={inquiryForm.email}
          onChange={(e) =>
            setInquiryForm({ ...inquiryForm, email: e.target.value })
          }
          placeholder="이메일"
          className={chatInputClass}
        />

        {/* 서비스 패키지 선택 */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] text-muted-foreground mb-1">
            어떤 서비스가 필요하신가요?
          </p>

          <div className="flex flex-col gap-1.5">
            {PACKAGE_OPTIONS.map((opt) => {
              const isSelected = selectedPackage === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`
                    flex flex-col items-start gap-1 w-full px-3 py-3 rounded-xl border text-left transition-all
                    ${
                      isSelected
                        ? "border-brand/60 bg-brand/10"
                        : "border-border bg-card hover:border-border/80"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span
                      className={`
                        flex-shrink-0 w-4 h-4 rounded-md border-[1.5px] flex items-center justify-center transition-all
                        ${isSelected ? "border-brand bg-brand" : "border-muted-foreground/30"}
                      `}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-background" />}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-brand" : "text-muted-foreground"}`} />
                    <span className={`text-[12px] font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 pl-[26px]">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 기타 */}
          <button
            type="button"
            onClick={() => handleSelect("etc")}
            className={`
              flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border text-left transition-all
              ${
                etcChecked
                  ? "border-brand/60 bg-brand/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-border/80"
              }
            `}
          >
            <span
              className={`
                flex-shrink-0 w-4 h-4 rounded-md border-[1.5px] flex items-center justify-center transition-all
                ${etcChecked ? "border-brand bg-brand" : "border-muted-foreground/30"}
              `}
            >
              {etcChecked && <Check className="w-2.5 h-2.5 text-background" />}
            </span>
            <span className="text-[12px]">기타</span>
          </button>

          {etcChecked && (
            <input
              type="text"
              value={etcText}
              onChange={(e) => setEtcText(e.target.value)}
              className={chatInputClass}
              placeholder="필요한 서비스를 적어주세요"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={inquiryMutation.isPending}
          className="w-full py-2.5 rounded-lg bg-brand text-background font-semibold text-[13px] hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {inquiryMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              접수 중...
            </>
          ) : (
            "무료 상담 신청하기"
          )}
        </button>
        <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground/60">
          <Shield className="w-2.5 h-2.5" />
          <span>계약 의무 없음 · 초안 무료</span>
        </div>
      </form>
    </div>
  );

  // 접수 완료 렌더링
  const renderInquirySubmitted = () => (
    <div
      className="bg-brand/5 border border-brand/20 rounded-xl p-4 text-center"
      style={{ animation: "chatFadeIn 0.2s ease-out both" }}
    >
      <CheckCircle className="w-8 h-8 text-brand mx-auto mb-2" />
      <p className="text-[13px] font-semibold text-foreground">
        접수 완료!
      </p>
      <p className="text-[12px] text-muted-foreground mt-1">
        최대한 빠른 시일내에 연락드리겠습니다.
      </p>
    </div>
  );

  // 신청서 작성 버튼 렌더링
  const renderInquiryButton = () => (
    <div
      className="flex justify-center mt-2"
      style={{ animation: "chatFadeIn 0.2s ease-out both" }}
    >
      <button
        onClick={handleOpenInquiryForm}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand/10 border border-brand/30 text-brand text-[13px] font-medium hover:bg-brand/20 transition-all"
      >
        <FileText className="w-4 h-4" />
        상담 신청서 작성하기
      </button>
    </div>
  );

  return (
    <>
      {/* 플로팅 버튼 + 24시간 말풍선 */}
      {!isOpen && (
        <div
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-center gap-1.5 sm:gap-2"
          style={{ animation: "chatBtnIn 0.3s ease-out both" }}
        >
            {/* "24시간" 말풍선 */}
            <div className="relative">
              <div
                className="px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md whitespace-nowrap"
                style={{
                  background: "oklch(0.72 0.14 200)",
                  color: "oklch(0.15 0.02 260)",
                }}
              >
                24시간
              </div>
              {/* 말풍선 꼬리 (아래쪽 삼각형) */}
              <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0"
                style={{
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "6px solid oklch(0.72 0.14 200)",
                }}
              />
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand text-background shadow-lg shadow-brand/30 flex items-center justify-center hover:brightness-110 transition-all"
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
      )}

      {/* 챗봇 창 */}
      {isOpen && (
        <div
          style={{ animation: "chatWindowIn 0.2s ease-out both" }}
          className={`
              fixed z-50 bg-card border border-border shadow-2xl flex flex-col overflow-hidden
              /* 모바일: 전체 화면 (safe area 대응) */
              inset-0 sm:inset-auto
              sm:bottom-6 sm:right-6
              sm:w-[380px] sm:max-w-[calc(100vw-2rem)]
              sm:h-[560px] sm:max-h-[calc(100vh-6rem)]
              sm:rounded-2xl
            `}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    MY비서
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    24시간 상담문의
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* 메시지 영역 */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 overscroll-contain"
            >
              {messages.length === 0 && !inquiryFormOpen && !inquirySubmitted && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-brand/50" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    안녕하세요! MY비서입니다.
                    <br />
                    병원 AI 마케팅에 대해 물어보세요.
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-[260px]">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const userMsg: ChatMessage = { role: "user", content: q };
                          const newMsgs = [...messages, userMsg];
                          setMessages(newMsgs);
                          setInput("");
                          setIsLoading(true);
                          chatMutation
                            .mutateAsync({ messages: newMsgs, sessionKey })
                            .then((result) => {
                              setMessages((prev) => [
                                ...prev,
{ role: "assistant", content: stripMarkdown(result.reply) },
                               ]);
                              if (result.showInquiryForm && !inquirySubmitted) {
                                setShowInquiryButton(true);
                              }
                            })
                            .catch(() => {
                              setMessages((prev) => [
                                ...prev,
                                { role: "assistant", content: "죄송합니다. 일시적인 오류가 발생했습니다." },
                              ]);
                            })
                            .finally(() => setIsLoading(false));
                        }}
                        className="text-left px-3 py-2 rounded-lg border border-border bg-card text-[12px] text-muted-foreground hover:border-brand/30 hover:text-foreground transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 채팅 아이템 렌더링 (메시지 + 신청서가 올바른 순서로) */}
              {chatItems.map((item, i) => {
                if (item.type === "message") {
                  const msg = item.msg;
                  return (
                    <div
                      key={`msg-${i}`}
                      className={`flex gap-2 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-brand text-background rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.type === "inquiry-button") {
                  return <div key={`btn-${i}`}>{renderInquiryButton()}</div>;
                }

                if (item.type === "inquiry-form") {
                  return <div key={`form-${i}`}>{renderInquiryForm()}</div>;
                }

                if (item.type === "inquiry-submitted") {
                  return <div key={`done-${i}`}>{renderInquirySubmitted()}</div>;
                }

                return null;
              })}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* 신청서 버튼이 chatItems에 포함되지 않은 경우 (메시지 없이 버튼만 표시되는 경우 대비) */}

              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="px-3 py-3 border-t border-border bg-background/80 backdrop-blur-sm shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  rows={1}
                  style={{ fontSize: "16px" }}
                  className="flex-1 px-3 py-2 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground/50 text-[16px] outline-none resize-none max-h-20 overscroll-contain"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 rounded-xl bg-brand text-background flex items-center justify-center shrink-0 disabled:opacity-40 hover:brightness-110 transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
        </div>
      )}
    </>
  );
}
