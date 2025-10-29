#!/bin/bash

echo "🚀 Iniciando ambiente de desenvolvimento fullstack..."

# Função para verificar se uma porta está em uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Porta $1 já está em uso"
        return 1
    else
        echo "✅ Porta $1 disponível"
        return 0
    fi
}

# Verificar portas
echo "🔍 Verificando portas..."
check_port 3000
check_port 5001

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd ../frontend
npm install

# Voltar para o diretório raiz
cd ..

echo "✅ Dependências instaladas!"
echo ""
echo "📋 Para iniciar o desenvolvimento:"
echo "1. Terminal 1 (Backend): cd backend && npm run dev"
echo "2. Terminal 2 (Frontend): cd frontend && npm run dev"
echo ""
echo "🌐 URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:5001"
echo "- Health Check: http://localhost:5001/api/health"
echo ""
echo "🧪 Para testar SCORM:"
echo "cd backend && node test-scorm.js"
