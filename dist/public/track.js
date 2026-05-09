/**
 * MY비서 추적 코드 v1.0
 * 병원 웹사이트에 삽입하여 방문자 유입 채널을 자동 식별하고
 * 마이비서 서버로 데이터를 전송합니다.
 *
 * 사용법:
 * <script src="https://mybiseo.com/track.js" data-hospital-id="123"></script>
 */
(function () {
  "use strict";

  // ─── 설정 ─────────────────────────────────────────────────────
  var API_URL = "https://mybiseo.com/api/trpc";
  var COOKIE_NAME = "_mb_vid";
  var SESSION_COOKIE = "_mb_sid";
  var COOKIE_DAYS = 365;
  var SESSION_TIMEOUT = 30; // 분
  var HEARTBEAT_INTERVAL = 15000; // 15초

  // ─── 스크립트 태그에서 설정 읽기 ──────────────────────────────
  var scripts = document.getElementsByTagName("script");
  var currentScript = scripts[scripts.length - 1];
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf("track.js") !== -1) {
      currentScript = scripts[i];
      break;
    }
  }
  var hospitalId = parseInt(currentScript.getAttribute("data-hospital-id"), 10);
  if (!hospitalId) {
    console.warn("[MY비서] data-hospital-id가 설정되지 않았습니다.");
    return;
  }

  // 커스텀 API URL 지원
  var customApi = currentScript.getAttribute("data-api-url");
  if (customApi) API_URL = customApi;

  // ─── 유틸리티 ─────────────────────────────────────────────────
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      ";expires=" +
      d.toUTCString() +
      ";path=/;SameSite=Lax";
  }

  function getCookie(name) {
    var match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)")
    );
    return match ? decodeURIComponent(match[2]) : null;
  }

  function generateId() {
    return (
      "mb_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).substring(2, 10)
    );
  }

  // ─── 방문자 ID 관리 ──────────────────────────────────────────
  function getVisitorId() {
    var vid = getCookie(COOKIE_NAME);
    if (!vid) {
      vid = generateId();
      setCookie(COOKIE_NAME, vid, COOKIE_DAYS);
    }
    return vid;
  }

  function getSessionId() {
    var sid = getCookie(SESSION_COOKIE);
    if (!sid) {
      sid = generateId();
    }
    // 세션 쿠키 갱신 (30분 타임아웃)
    setCookie(SESSION_COOKIE, sid, SESSION_TIMEOUT / (24 * 60));
    return sid;
  }

  // ─── 채널 식별 ────────────────────────────────────────────────
  function detectChannel(referrer) {
    if (!referrer) return "direct";

    var ref = referrer.toLowerCase();

    // AI 채널 식별
    if (ref.indexOf("chatgpt.com") !== -1 || ref.indexOf("chat.openai.com") !== -1)
      return "ai_chatgpt";
    if (ref.indexOf("gemini.google.com") !== -1 || ref.indexOf("bard.google.com") !== -1)
      return "ai_gemini";
    if (ref.indexOf("claude.ai") !== -1 || ref.indexOf("anthropic.com") !== -1)
      return "ai_claude";
    if (ref.indexOf("perplexity.ai") !== -1) return "ai_perplexity";
    if (ref.indexOf("copilot.microsoft.com") !== -1 || ref.indexOf("bing.com/chat") !== -1)
      return "ai_copilot";

    // AI 검색 기타 (SearchGPT, You.com 등)
    if (
      ref.indexOf("you.com") !== -1 ||
      ref.indexOf("phind.com") !== -1 ||
      ref.indexOf("searchgpt") !== -1
    )
      return "ai_other";

    // 포털/검색 엔진
    if (ref.indexOf("naver.com") !== -1 || ref.indexOf("search.naver") !== -1)
      return "naver";
    if (
      ref.indexOf("google.com") !== -1 ||
      ref.indexOf("google.co.kr") !== -1 ||
      ref.indexOf("google.co.jp") !== -1
    )
      return "google";

    // SNS
    if (ref.indexOf("instagram.com") !== -1) return "sns_instagram";
    if (ref.indexOf("youtube.com") !== -1 || ref.indexOf("youtu.be") !== -1)
      return "sns_youtube";
    if (
      ref.indexOf("blog.naver.com") !== -1 ||
      ref.indexOf("tistory.com") !== -1 ||
      ref.indexOf("brunch.co.kr") !== -1
    )
      return "sns_blog";

    // UTM 파라미터 체크
    var params = new URLSearchParams(window.location.search);
    var utmSource = (params.get("utm_source") || "").toLowerCase();
    var utmMedium = (params.get("utm_medium") || "").toLowerCase();

    if (utmSource.indexOf("chatgpt") !== -1) return "ai_chatgpt";
    if (utmSource.indexOf("gemini") !== -1) return "ai_gemini";
    if (utmSource.indexOf("perplexity") !== -1) return "ai_perplexity";
    if (utmSource.indexOf("naver") !== -1) return "naver";
    if (utmSource.indexOf("google") !== -1) return "google";
    if (utmMedium === "social" || utmMedium === "sns") return "sns_blog";

    return "referral";
  }

  // ─── 디바이스 타입 식별 ───────────────────────────────────────
  function detectDevice() {
    var ua = navigator.userAgent || "";
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (
      /mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)
    )
      return "mobile";
    return "desktop";
  }

  // ─── 데이터 전송 ──────────────────────────────────────────────
  function sendPageview(data) {
    var payload = {
      "0": {
        json: data,
      },
    };

    // Beacon API 우선 사용 (페이지 이탈 시에도 전송 보장)
    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon(
        API_URL + "/tracking.pageview?batch=1",
        blob
      );
    } else {
      // Fallback: XMLHttpRequest
      var xhr = new XMLHttpRequest();
      xhr.open("POST", API_URL + "/tracking.pageview?batch=1", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(payload));
    }
  }

  // ─── 상담 폼 자동 감지 및 연동 ────────────────────────────────
  function hookConsultationForms() {
    var forms = document.querySelectorAll(
      'form[data-mybiseo-form], form[action*="consult"], form[action*="inquiry"], form.consultation-form, form.inquiry-form'
    );

    forms.forEach(function (form) {
      form.addEventListener("submit", function () {
        var formData = new FormData(form);
        var data = {
          hospitalId: hospitalId,
          visitorId: getVisitorId(),
          patientName:
            formData.get("name") ||
            formData.get("patient_name") ||
            formData.get("이름") ||
            "",
          patientPhone:
            formData.get("phone") ||
            formData.get("tel") ||
            formData.get("전화번호") ||
            formData.get("연락처") ||
            "",
          patientEmail:
            formData.get("email") ||
            formData.get("이메일") ||
            "",
          treatmentType:
            formData.get("treatment") ||
            formData.get("시술") ||
            formData.get("진료과목") ||
            "",
          message:
            formData.get("message") ||
            formData.get("내용") ||
            formData.get("문의내용") ||
            "",
          channel: detectChannel(document.referrer),
        };

        var payload = { "0": { json: data } };
        if (navigator.sendBeacon) {
          var blob = new Blob([JSON.stringify(payload)], {
            type: "application/json",
          });
          navigator.sendBeacon(
            API_URL + "/tracking.inquiry?batch=1",
            blob
          );
        }
      });
    });
  }

  // ─── 체류 시간 측정 ───────────────────────────────────────────
  var pageStartTime = Date.now();
  var totalDuration = 0;
  var isVisible = true;

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      totalDuration += Date.now() - pageStartTime;
      isVisible = false;
    } else {
      pageStartTime = Date.now();
      isVisible = true;
    }
  });

  // ─── 페이지 이탈 시 체류 시간 전송 ────────────────────────────
  function sendDuration() {
    if (isVisible) {
      totalDuration += Date.now() - pageStartTime;
    }
    var durationSec = Math.round(totalDuration / 1000);
    if (durationSec > 1) {
      var data = {
        hospitalId: hospitalId,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        channel: detectChannel(document.referrer),
        referrer: document.referrer || "",
        landingPage: window.location.pathname,
        pageUrl: window.location.pathname + window.location.search,
        pageTitle: document.title || "",
        deviceType: detectDevice(),
        duration: durationSec,
      };
      sendPageview(data);
    }
  }

  // ─── 초기 페이지뷰 전송 ───────────────────────────────────────
  function init() {
    var visitorId = getVisitorId();
    var sessionId = getSessionId();
    var referrer = document.referrer || "";
    var channel = detectChannel(referrer);

    var data = {
      hospitalId: hospitalId,
      visitorId: visitorId,
      sessionId: sessionId,
      channel: channel,
      referrer: referrer,
      landingPage: window.location.pathname,
      pageUrl: window.location.pathname + window.location.search,
      pageTitle: document.title || "",
      deviceType: detectDevice(),
      duration: 0,
    };

    sendPageview(data);

    // 상담 폼 자동 감지
    if (document.readyState === "complete") {
      hookConsultationForms();
    } else {
      window.addEventListener("load", hookConsultationForms);
    }

    // 페이지 이탈 시 체류 시간 전송
    window.addEventListener("beforeunload", sendDuration);

    // SPA 라우팅 감지 (pushState/popstate)
    var originalPushState = history.pushState;
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      setTimeout(function () {
        var newData = {
          hospitalId: hospitalId,
          visitorId: visitorId,
          sessionId: sessionId,
          channel: channel,
          referrer: referrer,
          landingPage: window.location.pathname,
          pageUrl: window.location.pathname + window.location.search,
          pageTitle: document.title || "",
          deviceType: detectDevice(),
          duration: 0,
        };
        sendPageview(newData);
      }, 100);
    };

    window.addEventListener("popstate", function () {
      setTimeout(function () {
        var newData = {
          hospitalId: hospitalId,
          visitorId: visitorId,
          sessionId: sessionId,
          channel: channel,
          referrer: referrer,
          landingPage: window.location.pathname,
          pageUrl: window.location.pathname + window.location.search,
          pageTitle: document.title || "",
          deviceType: detectDevice(),
          duration: 0,
        };
        sendPageview(newData);
      }, 100);
    });
  }

  // ─── 실행 ─────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
