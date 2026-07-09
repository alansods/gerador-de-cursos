#!/bin/bash
# Remove pastas duplicadas geradas pelo macOS Finder (ex: "api 2", "[id] 3")
# O Finder cria essas cópias ao fazer Cmd+D ou ao resolver conflitos de nome.

ROOT="$(cd "$(dirname "$0")/.." && pwd)/src"

echo "🔍 Procurando pastas duplicadas do Finder em $ROOT..."

# Encontra pastas cujo nome termina com " <número>"
# Usa find + python para lidar com caracteres especiais (colchetes, espaços)
FOUND=$(find "$ROOT" -type d | python3 -c "
import sys, re
dirs = [line.rstrip() for line in sys.stdin]
dups = [d for d in dirs if re.search(r' \d+$', d.split('/')[-1])]
# Ordenar do mais profundo para o mais raso (deletar filhos antes dos pais)
dups.sort(key=lambda x: -x.count('/'))
for d in dups:
    print(d)
")

if [ -z "$FOUND" ]; then
  echo "✅ Nenhuma pasta duplicada encontrada."
  exit 0
fi

echo "🗑️  Removendo:"
echo "$FOUND" | while IFS= read -r dir; do
  echo "  - $dir"
  rm -rf "$dir"
done

echo "✅ Limpeza concluída."
