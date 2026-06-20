#!/usr/bin/env bash
# Lighthouse + axe 自动基线扫描脚本
# 用法：bash scripts/run-audit.sh
# 行为：启动本地 http server（端口 8091），依次抓取首页和 CH1 slide 1，
#      运行 Lighthouse 与 axe-core CLI，结果落到 docs/audits/，最后清理后台服务。
#
# 依赖：
#   - python3（提供静态服务）
#   - npx + lighthouse@^12 + @axe-core/cli@4.12.1
#   - Google Chrome 或 Chromium（headless 模式）
# 可选环境变量：
#   CHROME_PATH          显式指定 Chrome / Chromium 可执行文件
#   CHROMEDRIVER_TEST_PATH  显式指定与 Chrome 同版本的 chromedriver（axe-core CLI 需要）

set -u

PORT=8091
BASE="http://127.0.0.1:${PORT}"
HOME_URL="${BASE}/"
CH1_URL="${BASE}/slides.html?chapter=ch1&slide=1"
OUT_DIR="docs/audits"
TMP_LOG="$(mktemp)"
SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
  rm -f "${TMP_LOG}"
}
trap cleanup EXIT INT TERM

start_server() {
  if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
      echo "[run-audit] 端口 ${PORT} 已被占用，假定服务可用"
      return 0
    fi
  fi
  nohup python3 -m http.server ${PORT} >"${TMP_LOG}" 2>&1 &
  SERVER_PID=$!
  sleep 2
  if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo "[run-audit] 启动 http.server 失败" >&2
    cat "${TMP_LOG}" >&2
    exit 1
  fi
  echo "[run-audit] 已启动 http.server pid=${SERVER_PID}"
}

detect_chrome() {
  if [[ -n "${CHROME_PATH:-}" ]] && [[ -x "${CHROME_PATH}" ]]; then
    return 0
  fi
  for cand in /usr/bin/google-chrome /usr/bin/google-chrome-stable \
              /usr/bin/chromium /usr/bin/chromium-browser \
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
    if [[ -x "${cand}" ]]; then
      export CHROME_PATH="${cand}"
      return 0
    fi
  done
  return 1
}

run_lighthouse() {
  local url="$1"
  local out="$2"
  local label="$3"
  echo "[run-audit] Lighthouse -> ${label}"
  if detect_chrome; then
    CHROME_PATH="${CHROME_PATH}" npx lighthouse "${url}" \
      --output json \
      --output-path "${out}" \
      --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" \
      --only-categories=performance,accessibility,best-practices,seo \
      2>&1 | tail -5 || echo "[run-audit] Lighthouse ${label} 失败，继续"
  else
    echo "[run-audit] 未找到 Chrome，跳过 Lighthouse ${label}" >&2
    echo "{\"error\":\"chrome-not-found\",\"label\":\"${label}\"}" > "${out}.error.json"
  fi
}

run_axe() {
  local url="$1"
  local out="$2"
  local label="$3"
  echo "[run-audit] axe -> ${label}"
  local extra_env=()
  if detect_chrome; then
    extra_env+=(CHROME_TEST_PATH="${CHROME_PATH}")
  fi
  if [[ -n "${CHROMEDRIVER_TEST_PATH:-}" ]] && [[ -x "${CHROMEDRIVER_TEST_PATH}" ]]; then
    extra_env+=(CHROMEDRIVER_TEST_PATH="${CHROMEDRIVER_TEST_PATH}")
  fi
  env "${extra_env[@]}" npx @axe-core/cli "${url}" \
    --save "${out}" \
    --chrome-options="--no-sandbox --disable-dev-shm-usage" \
    2>&1 | tail -10 \
    || echo "[run-audit] axe ${label} 失败，继续"
}

main() {
  mkdir -p "${OUT_DIR}"
  start_server

  run_lighthouse "${HOME_URL}" "${OUT_DIR}/lighthouse-home.json" "home"
  run_lighthouse "${CH1_URL}" "${OUT_DIR}/lighthouse-ch1.json" "ch1-slide1"

  run_axe "${HOME_URL}" "${OUT_DIR}/axe-home.json" "home"
  run_axe "${CH1_URL}" "${OUT_DIR}/axe-ch1.json" "ch1-slide1"

  echo "[run-audit] 完成，产物位于 ${OUT_DIR}/"
}

main "$@"
