#!/usr/bin/env bash
# =============================================================================
# scripts/manus-audit.sh — 마누스 회피 패턴 메타 KPI
# =============================================================================
# 목적: AI 에이전트(마누스)가 코드 변경 대비 문서만 생산하는 "회피 패턴"을
#       조기 감지하기 위한 자기 감시 스크립트.
#
# 측정 지표:
#   1. 최근 N개 커밋에서 server/ 변경 라인 vs docs/ 변경 라인 비율
#   2. server/ 변경이 0인 커밋 연속 횟수 (streak)
#   3. 전체 커밋 중 docs-only 커밋 비율
#
# 사용법:
#   ./scripts/manus-audit.sh          # 기본: 최근 20개 커밋 분석
#   ./scripts/manus-audit.sh 50       # 최근 50개 커밋 분석
#   ./scripts/manus-audit.sh --ci     # CI 모드: 임계값 초과 시 exit 1
#
# 임계값 (조정 가능):
#   - DOCS_ONLY_RATIO_THRESHOLD: docs-only 커밋 비율 상한 (기본 40%)
#   - SERVER_ZERO_STREAK_THRESHOLD: server/ 변경 0인 연속 커밋 상한 (기본 5)
# =============================================================================

set -euo pipefail

# --- Configuration ---
COMMIT_COUNT="${1:-20}"
CI_MODE=false
DOCS_ONLY_RATIO_THRESHOLD=40   # percent
SERVER_ZERO_STREAK_THRESHOLD=5  # consecutive commits

if [[ "${1:-}" == "--ci" ]]; then
  CI_MODE=true
  COMMIT_COUNT="${2:-20}"
fi

# --- Colors (disabled in CI) ---
if [[ "$CI_MODE" == true ]] || [[ ! -t 1 ]]; then
  RED="" GREEN="" YELLOW="" RESET=""
else
  RED="\033[0;31m" GREEN="\033[0;32m" YELLOW="\033[1;33m" RESET="\033[0m"
fi

# --- Ensure we're in a git repo ---
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "Error: Not inside a git repository" >&2
  exit 1
fi

# --- Metric 1: server/ vs docs/ line changes ---
echo "═══════════════════════════════════════════════════════════════"
echo "  마누스 회피 패턴 메타 KPI — 최근 ${COMMIT_COUNT}개 커밋 분석"
echo "═══════════════════════════════════════════════════════════════"
echo ""

server_lines=0
docs_lines=0
total_commits=0
docs_only_commits=0
server_zero_streak=0
max_server_zero_streak=0

while IFS= read -r line; do
  if [[ "$line" =~ ^COMMIT: ]]; then
    total_commits=$((total_commits + 1))
    commit_server=0
    commit_docs=0
  elif [[ "$line" =~ ^SERVER:([0-9]+) ]]; then
    commit_server="${BASH_REMATCH[1]}"
    server_lines=$((server_lines + commit_server))
  elif [[ "$line" =~ ^DOCS:([0-9]+) ]]; then
    commit_docs="${BASH_REMATCH[1]}"
    docs_lines=$((docs_lines + commit_docs))
  elif [[ "$line" == "END_COMMIT" ]]; then
    # Check docs-only commit
    if [[ $commit_server -eq 0 && $commit_docs -gt 0 ]]; then
      docs_only_commits=$((docs_only_commits + 1))
    fi
    # Track server-zero streak
    if [[ $commit_server -eq 0 ]]; then
      server_zero_streak=$((server_zero_streak + 1))
      if [[ $server_zero_streak -gt $max_server_zero_streak ]]; then
        max_server_zero_streak=$server_zero_streak
      fi
    else
      server_zero_streak=0
    fi
  fi
done < <(
  git log -"$COMMIT_COUNT" --numstat --pretty=format:"COMMIT:%H" |
  awk '
    /^COMMIT:/ { print; next }
    /^[0-9]/ {
      if ($3 ~ /^server\//) server += $1 + $2
      if ($3 ~ /^docs\// || $3 ~ /\.md$/) docs += $1 + $2
    }
    /^$/ {
      printf "SERVER:%d\nDOCS:%d\nEND_COMMIT\n", server, docs
      server = 0; docs = 0
    }
    END {
      printf "SERVER:%d\nDOCS:%d\nEND_COMMIT\n", server, docs
    }
  '
)

# --- Calculate ratios ---
total_lines=$((server_lines + docs_lines))
if [[ $total_lines -gt 0 ]]; then
  server_pct=$((server_lines * 100 / total_lines))
  docs_pct=$((docs_lines * 100 / total_lines))
else
  server_pct=0
  docs_pct=0
fi

if [[ $total_commits -gt 0 ]]; then
  docs_only_pct=$((docs_only_commits * 100 / total_commits))
else
  docs_only_pct=0
fi

# --- Output ---
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ 지표                          │ 값                          │"
echo "├─────────────────────────────────────────────────────────────┤"
printf "│ server/ 변경 라인             │ %6d lines (%2d%%)          │\n" "$server_lines" "$server_pct"
printf "│ docs/ 변경 라인               │ %6d lines (%2d%%)          │\n" "$docs_lines" "$docs_pct"
printf "│ docs-only 커밋 수             │ %3d / %3d (%2d%%)            │\n" "$docs_only_commits" "$total_commits" "$docs_only_pct"
printf "│ server=0 최대 연속 커밋       │ %3d                         │\n" "$max_server_zero_streak"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

# --- Verdict ---
violations=0

if [[ $docs_only_pct -gt $DOCS_ONLY_RATIO_THRESHOLD ]]; then
  echo -e "${RED}⚠ WARN: docs-only 커밋 비율 ${docs_only_pct}% > 임계값 ${DOCS_ONLY_RATIO_THRESHOLD}%${RESET}"
  violations=$((violations + 1))
else
  echo -e "${GREEN}✓ PASS: docs-only 커밋 비율 ${docs_only_pct}% ≤ ${DOCS_ONLY_RATIO_THRESHOLD}%${RESET}"
fi

if [[ $max_server_zero_streak -gt $SERVER_ZERO_STREAK_THRESHOLD ]]; then
  echo -e "${RED}⚠ WARN: server/ 변경 0 연속 ${max_server_zero_streak}개 > 임계값 ${SERVER_ZERO_STREAK_THRESHOLD}${RESET}"
  violations=$((violations + 1))
else
  echo -e "${GREEN}✓ PASS: server/ 변경 0 연속 ${max_server_zero_streak}개 ≤ ${SERVER_ZERO_STREAK_THRESHOLD}${RESET}"
fi

echo ""
if [[ $violations -eq 0 ]]; then
  echo -e "${GREEN}결론: 회피 패턴 미감지. 정상 개발 흐름.${RESET}"
else
  echo -e "${YELLOW}결론: 회피 패턴 의심 신호 ${violations}건. 코드 변경 비율 점검 필요.${RESET}"
fi

# --- CI exit code ---
if [[ "$CI_MODE" == true && $violations -gt 0 ]]; then
  exit 1
fi

exit 0
