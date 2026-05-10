import { useState } from "react";
import { X } from "lucide-react";

const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_KxmnZn/chat";

export default function KakaoFloat() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-[88px] sm:bottom-[96px] right-4 sm:right-6 z-40 flex flex-col items-end gap-2">
      {/* 말풍선 툴팁 */}
      <div className="relative bg-[#FEE500] text-[#3C1E1E] text-xs font-medium px-3 py-2 rounded-lg shadow-lg animate-bounce-slow">
        카카오톡으로 무료 상담하기
        <div className="absolute bottom-[-6px] right-4 w-3 h-3 bg-[#FEE500] rotate-45" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* 카카오 버튼 */}
      <a
        href={KAKAO_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 bg-[#FEE500] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        aria-label="카카오톡 상담"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 256 256"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M128 36C70.562 36 24 72.713 24 118c0 29.279 19.466 54.97 48.748 69.477-1.593 5.494-10.237 35.344-10.581 37.689 0 0-.207 1.762.934 2.434 1.14.671 2.474.154 2.474.154 3.263-.458 37.786-24.657 43.769-28.878A164.245 164.245 0 00128 200c57.438 0 104-36.713 104-82S185.438 36 128 36z"
            fill="#3C1E1E"
          />
        </svg>
      </a>
    </div>
  );
}
