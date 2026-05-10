#!/usr/bin/env bash
# hotspot.sh — 코드 변경 빈도 × 파일 크기 기반 Hotspot 분석
# 사용법: bash scripts/hotspot.sh [기간] (기본: 6 months ago)
# 참고: Adam Tornhill의 "코드의 4-6%가 결함의 90%를 만든다" 관찰 기반

set -euo pipefail

SINCE="${1:-6 months ago}"
echo "=== 마이비서 Hotspot 분석 (since: $SINCE) ==="
echo ""

echo "--- Top 15: 변경 빈도 (가장 자주 수정된 파일) ---"
git log --since="$SINCE" --name-only --pretty=format: \
  | grep -v '^$' \
  | sort \
  | uniq -c \
  | sort -rg \
  | awk 'NR<=15'

echo ""
echo "--- Top 10: Churn × LOC (변경 빈도 × 현재 줄 수) ---"
git log --since="$SINCE" --name-only --pretty=format: \
  | grep -v '^$' \
  | sort \
  | uniq -c \
  | sort -rg \
  | awk 'NR<=30' \
  | while read -r count file; do
      if [ -f "$file" ]; then
        loc=$(wc -l < "$file" 2>/dev/null || echo 0)
        score=$((count * loc))
        printf "%8d  (churn=%d × loc=%d)  %s\n" "$score" "$count" "$loc" "$file"
      fi
    done \
  | sort -rg \
  | awk 'NR<=10'

echo ""
echo "--- 실행 완료: $(date '+%Y-%m-%d %H:%M') ---"
