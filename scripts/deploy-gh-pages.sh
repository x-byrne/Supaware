#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCS_DIR="${REPO_ROOT}/docs"

echo "Preparing GitHub Pages deployment in ${DOCS_DIR}"

mkdir -p "${DOCS_DIR}"

FILES=(
  "index.html"
  "datasets.json"
  "package.json"
)

DIRS=(
  "src"
  "data"
)

for f in "${FILES[@]}"; do
  if test -f "${REPO_ROOT}/${f}"; then
    cp "${REPO_ROOT}/${f}" "${DOCS_DIR}/"
    echo "  copied ${f}"
  else
    echo "  WARN: ${f} not found, skipping"
  fi
done

for d in "${DIRS[@]}"; do
  if test -d "${REPO_ROOT}/${d}"; then
    rm -rf "${DOCS_DIR}/${d}"
    cp -r "${REPO_ROOT}/${d}" "${DOCS_DIR}/"
    echo "  copied ${d}/"
  else
    echo "  WARN: ${d}/ not found, skipping"
  fi
done

rm -f "${DOCS_DIR}/verification-report.md" "${DOCS_DIR}/e2e-verification.md"

echo "GitHub Pages files prepared in ${DOCS_DIR}"
echo ""
echo "To deploy:"
echo "  1. Commit and push the docs/ folder to main"
echo "  2. In GitHub repo Settings -> Pages, set Source to 'Deploy from a branch'"
echo "     Branch: main, Folder: /docs"
echo "  3. Site will be available at https://x-byrne.github.io/Supaware/"
