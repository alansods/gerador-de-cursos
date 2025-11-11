// Caminho do Ficheiro: src/lib/scorm-service.ts

import JSZip from 'jszip';
// Importe os seus tipos TypeScript. Ajuste o caminho se estiver incorreto.
import { CursoGerado, Unidade, ConteudoUnidade } from '@/types/gerador-curso'; 

// =======================================================================
// 1. GERADOR DE HTML (PLAYER) - "player.html"
// =======================================================================

/**
 * Converte um único bloco de conteúdo (JSON) em HTML usando classes Tailwind.
 * (Esta função permanece a mesma da versão anterior)
 */
function renderConteudo(conteudo: ConteudoUnidade): string {
  const getAlignment = (alinhamento: string | undefined) => {
    switch (alinhamento) {
      case 'centro': return 'text-center';
      case 'direita': return 'text-right';
      default: return 'text-left';
    }
  };

  const getImageSize = (tamanho: string | undefined) => {
    switch (tamanho) {
      case 'pequena': return 'max-w-sm';
      case 'media': return 'max-w-md';
      case 'grande': return 'max-w-full';
      default: return 'max-w-md';
    }
  };

  switch (conteudo.tipo) {
    case 'titulo':
      return `<h1 class="text-3xl sm:text-4xl font-bold mt-8 mb-4 text-gray-900">${conteudo.conteudo}</h1>`;

    case 'subtitulo':
      return `<h2 class="text-2xl sm:text-3xl font-semibold mt-6 mb-3 text-gray-800">${conteudo.conteudo}</h2>`;

    case 'paragrafo':
      return `<p class="text-base sm:text-lg leading-relaxed text-gray-700 mb-4 whitespace-pre-wrap ${getAlignment(conteudo.alinhamento)}" style="color: ${conteudo.corTexto || 'inherit'};">
        ${conteudo.conteudo}
      </p>`;

    case 'imagem':
      return `
        <figure class="my-8 ${getAlignment(conteudo.alinhamento)}">
          <img src="${conteudo.conteudo}" alt="${conteudo.legenda || 'Imagem do curso'}" 
               class="inline-block rounded-lg shadow-lg ${getImageSize(conteudo.tamanho)}">
          ${conteudo.legenda ? `<figcaption class="text-sm text-gray-600 mt-2 italic">${conteudo.legenda}</figcaption>` : ''}
          ${conteudo.fonte ? `<small class="text-xs text-gray-500 block mt-1">Fonte: ${conteudo.fonte}</small>` : ''}
        </figure>
      `;

    // --- Stubs para os seus outros tipos de conteúdo ---
    case 'accordion':
      const itemsAccordion = conteudo.items || [];
      return `
        <div class="border rounded-lg overflow-hidden my-6">
          <h3 class="px-6 py-4 bg-gray-50 text-lg font-semibold border-b text-gray-800">Accordion (Conteúdo Interativo)</h3>
          <div class="p-6 text-gray-700 whitespace-pre-wrap space-y-2">
            ${itemsAccordion.map(item => `<div><strong>${item.titulo}:</strong> ${item.conteudo}</div>`).join('')}
          </div>
        </div>
      `;

    case 'flipcard':
       return `
        <div class="border rounded-lg overflow-hidden my-6 bg-blue-50">
          <h3 class="px-6 py-4 bg-blue-100 text-lg font-semibold border-b border-blue-200 text-blue-800">Flipcard (Conteúdo Interativo)</h3>
          <div class="p-6 text-blue-700 whitespace-pre-wrap space-y-2">
            <p><strong>Frente:</strong> ${conteudo.tituloFrente || ''}</p>
            <p><strong>Verso:</strong> ${conteudo.conteudoVerso || ''}</p>
          </div>
        </div>
      `;

    case 'quiz':
      const questions = conteudo.quizData?.questions || [];
      return `
        <div class="border rounded-lg overflow-hidden my-6 bg-yellow-50">
          <h3 class="px-6 py-4 bg-yellow-100 text-lg font-semibold border-b border-yellow-200 text-yellow-800">Quiz (Conteúdo Interativo)</h3>
          <div class="p-6 text-yellow-700 whitespace-pre-wrap space-y-2">
            ${questions.map(q => `<p><strong>Pergunta:</strong> ${q.pergunta}</p>`).join('')}
          </div>
        </div>
      `;

    case 'lista':
    case 'info-box':
    default:
      return `<div class="p-4 bg-gray-100 rounded-lg my-6 text-gray-600 italic">(Conteúdo do tipo '${conteudo.tipo}' não renderizado no SCORM)</div>`;
  }
}

/**
 * Gera o HTML completo do player (index.html), agora como uma SPA.
 */
function generateIndexHtml(curso: CursoGerado): string {
  
  // --- HTML para a PÁGINA DO PLAYER ---
  // Gera o HTML de uma única unidade (para a área de conteúdo)
  const generateUnitHtml = (unidade: Unidade) => `
    <div id="unit-${unidade.id}" class="course-unit" style="display: none;">
      ${unidade.conteudo.sort((a, b) => a.ordem - b.ordem).map(renderConteudo).join('\n')}
    </div>
  `;

  // Gera os links da "Sheet" (gaveta) de navegação
  const generateSheetLinks = (unidades: Unidade[]) => {
    return unidades.sort((a, b) => a.ordem - b.ordem).map((unidade, index) => `
      <a href="#" 
         data-unit-id="${unidade.id}" 
         class="unit-link-sheet group flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200">
        <div class="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
          ${String(index + 1).padStart(2, "0")}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm leading-snug">
            ${unidade.titulo}
          </p>
        </div>
      </a>
    `).join('\n');
  };

  // Gera os botões de Navegação (Anterior/Próxima)
  const generateNavButtons = (unidades: Unidade[]) => {
    const sortedUnits = unidades.sort((a, b) => a.ordem - b.ordem);

    return sortedUnits.map((unidade, index) => {
      const prev = index > 0 ? sortedUnits[index - 1] : null;
      const next = index < sortedUnits.length - 1 ? sortedUnits[index + 1] : null;
      
      return `
        <div id="nav-unit-${unidade.id}" class="course-nav" style="display: none;">
          <a href="#" ${prev ? `data-unit-id="${prev.id}"` : 'disabled'} 
             class="nav-prev flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${!prev ? 'pointer-events-none' : ''}">
            <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            Unidade Anterior
          </a>
          <div class="flex-1 text-center">
            <span class="text-sm text-gray-600">
              ${index + 1} de ${unidades.length}
            </span>
          </div>
          <a href="#" ${next ? `data-unit-id="${next.id}"` : 'disabled'} 
             class="nav-next flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${!next ? 'pointer-events-none' : ''}">
            Próxima Unidade
            <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </a>
        </div>
      `;
    }).join('\n');
  };

  // --- HTML para a PÁGINA DO MENU (HERO) ---
  // Gera o HTML para a lista de unidades (Cards)
  const generateUnitListHtml = (unidades: Unidade[]) => {
    if (!unidades || unidades.length === 0) {
      return `
        <div class="bg-white rounded-lg shadow border p-12 text-center text-gray-500">
          <p>Nenhuma unidade criada ainda.</p>
        </div>
      `;
    }
    return unidades.sort((a, b) => a.ordem - b.ordem).map((unidade, index) => `
      <a href="#" 
         data-unit-id="${unidade.id}" 
         class="unit-link-hero block bg-white hover:border-orange-600 border border-gray-200 rounded-lg shadow overflow-hidden transition-all duration-200 cursor-pointer">
        <div class="p-6">
          <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <div class="shrink-0">
              <div class="flex items-center justify-center w-12 h-12 rounded-full bg-orange-600">
                <svg class="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m6-4h1m-1 4h1m-1 4h1m-1-8h1m-1 4h1"></path></svg>
              </div>
            </div>
            <div class="flex-1 text-center sm:text-left">
              <div>
                <span class="text-xs font-bold text-orange-600 uppercase tracking-wide">
                  UNIDADE ${String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 class="text-xl md:text-2xl font-bold text-gray-900 leading-tight">${unidade.titulo}</h3>
              <p class="text-gray-600 text-base leading-relaxed my-2">${unidade.descricao || ''}</p>
            </div>
            <div class="shrink-0">
              <div class="text-orange-600 h-10 w-10 flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </a>
    `).join('\n');
  };

  // --- HTML PRINCIPAL (SPA) ---
  return `<!DOCTYPE html>
<html lang="pt-BR" class="h-full bg-gray-50">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${curso.titulo}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: { fontFamily: { sans: ['Inter', 'sans-serif'] } } }
    }
  </script>
  <script src="scorm_api_wrapper.js"></script>
  <style>
    #sheet-overlay {
      position: fixed; inset: 0; background-color: rgba(0,0,0,0.5);
      opacity: 0; transition: opacity 0.3s ease;
      z-index: 50; pointer-events: none;
    }
    #sheet-content {
      position: fixed; top: 0; left: 0; bottom: 0;
      width: 90%; max-width: 400px;
      background: linear-gradient(to bottom, #f9fafb, #ffffff);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      z-index: 60;
      display: flex; flex-direction: column;
    }
    #sheet-content.open { transform: translateX(0); }
    #sheet-overlay.open { opacity: 1; pointer-events: auto; }
  </style>
</head>
<body class="h-full font-sans antialiased text-gray-900">

  <!-- ============================================= -->
  <!-- ECRÃ 1: PLAYER (Oculto por defeito)            -->
  <!-- ============================================= -->
  <div id="player-screen" style="display: none;" class="h-full flex flex-col">
    <!-- Navbar Fixa (do Player) -->
    <nav class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 h-16 flex items-center px-4 shrink-0">
      <button id="sheet-trigger" type="button" class="p-2 rounded-md text-gray-700 hover:bg-gray-100">
        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        <span class="sr-only">Abrir menu</span>
      </button>
      <div class="ml-4 flex-1">
        <h2 class="text-lg font-semibold text-gray-900 line-clamp-1">${curso.titulo}</h2>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-gray-700">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span id="student-name-display-player" class="text-sm font-medium">Carregando...</span>
        </div>
        <button id="logout-button" type="button" title="Sair do Curso" class="p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </div>
    </nav>

    <!-- Sheet (Gaveta) de Navegação -->
    <div id="sheet-overlay"></div>
    <div id="sheet-content">
      <div class="px-6 pt-6 pb-4 border-b border-gray-100 bg-white flex justify-between items-center">
        <h3 class="text-left text-xl font-bold text-gray-900">Unidades do curso</h3>
        <button id="sheet-close" class="p-2 rounded-md text-gray-600 hover:bg-gray-100">
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <nav id="unit-navigation" class="px-4 py-6 space-y-2 overflow-y-auto flex-1">
        <a href="#" id="home-link" class="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200">
          <div class="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6-4h.01M12 10h.01M15 10h.01M9 10h.01M12 13h.01M15 13h.01M9 13h.01M12 16h.01M15 16h.01M9 16h.01"></path></svg>
          </div>
          <div class="flex-1 min-w-0">
            <span class="block font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm leading-snug">
              Página inicial
            </span>
          </div>
        </a>
        ${generateSheetLinks(curso.unidades)}
      </nav>
    </div>

    <!-- Área de Conteúdo Principal (do Player) -->
    <main class="flex-1 p-6 sm:p-10 mt-16 overflow-y-auto">
      <div class="max-w-4xl mx-auto">
        <div id="course-content-area">
          ${curso.unidades.sort((a, b) => a.ordem - b.ordem).map(generateUnitHtml).join('\n')}
        </div>
        
        <!-- Navegação Anterior/Próxima (recriada do seu código) -->
        <div id="course-navigation" class="flex items-center justify-between gap-4 mt-8 pt-8 border-t border-gray-200">
           ${generateNavButtons(curso.unidades)}
        </div>
        
        <footer class="mt-12 pt-6 border-t border-gray-200 text-center">
          <button id="complete-button" 
                  class="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow
                         hover:bg-blue-700 transition-colors
                         disabled:bg-gray-400 disabled:cursor-not-allowed">
            Marcar como Concluído
          </button>
        </footer>
      </div>
    </main>
  </div>
  
  <!-- ============================================= -->
  <!-- ECRÃ 2: MENU (Visível por defeito)             -->
  <!-- ============================================= -->
  <div id="menu-screen" class="h-full flex flex-col">
    <!-- Navbar Fixa (do Menu) - AGORA COM O BOTÃO DE MENU -->
    <nav class="w-full bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200 shrink-0">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex-shrink-0 flex items-center gap-4">
            <!-- !!! CORREÇÃO: Botão de Menu (sanduíche) !!! -->
            <button id="sheet-trigger-menu" type="button" class="p-2 rounded-md text-gray-700 hover:bg-gray-100">
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <span class="font-bold text-lg text-gray-900">${curso.titulo}</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 text-gray-700">
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span id="student-name-display-menu" class="text-sm font-medium">Carregando...</span>
            </div>
             <button id="logout-button-menu" type="button" title="Sair do Curso" class="p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50">
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Corpo Principal (do Menu) -->
    <main class="w-full overflow-y-auto">
      <!-- INÍCIO: Hero Section (Recriado do seu Preview) -->
      <div class="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="mb-4">
            <span class="bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              ${curso.categoria}
            </span>
          </div>
          <h1 class="text-3xl md:text-5xl font-bold mb-4">${curso.titulo}</h1>
          <p class="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl">${curso.descricao}</p>
          <div class="flex flex-wrap gap-6 text-blue-100">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span class="text-sm font-medium">${curso.cargaHoraria}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span class="text-sm font-medium">${curso.modalidade}</span>
            </div>
          </div>
        </div>
      </div>
      <!-- FIM: Hero Section -->
      
      <!-- Área da Lista de Unidades (Recriada do seu Preview) -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div id="unit-list-section">
          <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">
            Unidades do Curso
          </h2>
          <div class="space-y-6">
            ${generateUnitListHtml(curso.unidades)}
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    var scorm = SCORM; 
    var units = ${JSON.stringify(curso.unidades.sort((a, b) => a.ordem - b.ordem).map(u => ({ id: u.id, titulo: u.titulo })))};
    var lessonStatus = 'incomplete';
    var studentName = 'Convidado';
    var currentUnitId = '';

    // === ELEMENTOS DA DOM ===
    var menuScreen = document.getElementById('menu-screen');
    var playerScreen = document.getElementById('player-screen');
    
    // Elementos da Sheet
    var sheetTriggerPlayer = document.getElementById('sheet-trigger');
    var sheetTriggerMenu = document.getElementById('sheet-trigger-menu');
    var sheetClose = document.getElementById('sheet-close');
    var sheetOverlay = document.getElementById('sheet-overlay');
    var sheetContent = document.getElementById('sheet-content');
    var unitNavigation = document.getElementById('unit-navigation');
    var homeLink = document.getElementById('home-link');
    
    // Botões
    var completeButton = document.getElementById('complete-button');
    var logoutButtonPlayer = document.getElementById('logout-button');
    var logoutButtonMenu = document.getElementById('logout-button-menu');
    var courseNavigation = document.getElementById('course-navigation');
    var studentNamePlayer = document.getElementById('student-name-display-player');
    var studentNameMenu = document.getElementById('student-name-display-menu');

    // === LÓGICA DE NAVEGAÇÃO (SPA) ===
    
    function showPlayer(unitId) {
      currentUnitId = unitId;
      menuScreen.style.display = 'none';
      playerScreen.style.display = 'flex'; // Alterado para 'flex'
      
      // Mostra o conteúdo da unidade correta
      document.querySelectorAll('.course-unit').forEach(unit => unit.style.display = 'none');
      // !!! CORREÇÃO DO BUG "CONTEÚDO VAZIO" !!!
      // O ID do div é 'unit-' + unitId
      var unitToShow = document.getElementById('unit-' + unitId);
      if (unitToShow) {
        unitToShow.style.display = 'block';
      }
      
      // Mostra os botões de navegação corretos
      document.querySelectorAll('.course-nav').forEach(nav => nav.style.display = 'none');
      var navToShow = document.getElementById('nav-unit-' + unitId);
      if (navToShow) {
        navToShow.style.display = 'flex';
      }
      
      // Atualiza o link ativo na Sheet
      document.querySelectorAll('.unit-link-sheet').forEach(a => {
        a.classList.remove('border-orange-300', 'bg-orange-50/50');
        a.classList.add('border-gray-200');
      });
      var linkToActivate = document.querySelector(\`.unit-link-sheet[data-unit-id="\${unitId}"]\`);
      if (linkToActivate) {
        linkToActivate.classList.add('border-orange-300', 'bg-orange-50/50');
        linkToActivate.classList.remove('border-gray-200');
      }
      closeSheet(); // Fecha a gaveta ao selecionar
      window.scrollTo(0, 0); // Rola para o topo
    }
    
    function showMenu() {
      currentUnitId = 'index';
      playerScreen.style.display = 'none';
      menuScreen.style.display = 'flex'; // Alterado para 'flex'
      closeSheet();
    }

    // === LÓGICA DA SHEET (GAVETA) ===
    function openSheet() {
      sheetOverlay.classList.add('open');
      sheetContent.classList.add('open');
    }
    function closeSheet() {
      sheetOverlay.classList.remove('open');
      sheetContent.classList.remove('open');
    }
    sheetTriggerPlayer.onclick = openSheet;
    sheetTriggerMenu.onclick = openSheet;
    sheetClose.onclick = closeSheet;
    sheetOverlay.onclick = closeSheet;

    // === LÓGICA SCORM ===
    function initCourse() {
      var initResult = scorm.init();
      if (initResult) {
        lessonStatus = scorm.getValue('cmi.core.lesson_status');
        if (lessonStatus === 'not attempted' || lessonStatus === 'unknown') {
          scorm.setValue('cmi.core.lesson_status', 'incomplete');
          lessonStatus = 'incomplete';
        }
        
        studentName = scorm.getStudentName(); 
        
        if (lessonStatus === 'completed' || lessonStatus === 'passed') {
          completeButton.disabled = true;
          completeButton.textContent = 'Concluído';
        } else {
          completeButton.disabled = false;
        }

        // Verifica se o LMS quer que a gente resuma
        var lessonLocation = scorm.getValue('cmi.core.lesson_location');
        if (lessonLocation && lessonLocation.startsWith('unit-')) {
          showPlayer(lessonLocation); // Vai direto para o player
        } else {
          showMenu(); // Começa no menu (lessonLocation pode ser 'index' ou vazio)
        }
        scorm.save();
      } else {
        // Modo fallback
        console.warn("SCORM API not found.");
        showMenu(); // Começa no menu
      }
      
      studentNamePlayer.textContent = studentName;
      studentNameMenu.textContent = studentName;
    }
    
    function navigateToUnit(unitId) {
      if (!unitId) return;
      showPlayer(unitId);
      scorm.setValue('cmi.core.lesson_location', unitId);
      scorm.save();
    }

    // === EVENT LISTENERS ===
    
    // Links das unidades no Menu Hero
    document.getElementById('unit-list-section').addEventListener('click', function(e) {
      var targetLink = e.target.closest('a.unit-link-hero');
      if (targetLink) {
        e.preventDefault();
        var unitId = targetLink.getAttribute('data-unit-id');
        navigateToUnit(unitId);
      }
    });
    
    // Links das unidades na Sheet (Gaveta)
    unitNavigation.addEventListener('click', function(e) {
      var targetLink = e.target.closest('a.unit-link-sheet');
      if (targetLink) {
        e.preventDefault(); 
        var unitId = targetLink.getAttribute('data-unit-id');
        navigateToUnit(unitId);
      }
    });
    
    // Link "Página Inicial" na Sheet
    homeLink.onclick = function(e) {
      e.preventDefault();
      showMenu();
      scorm.setValue('cmi.core.lesson_location', 'index'); // Salva que estamos no menu
      scorm.save();
    }
    
    // Botões de Navegação (Anterior/Próxima)
    courseNavigation.addEventListener('click', function(e) {
      var targetLink = e.target.closest('a[data-unit-id]');
      if (targetLink && !targetLink.hasAttribute('disabled')) {
        e.preventDefault();
        var unitId = targetLink.getAttribute('data-unit-id');
        navigateToUnit(unitId);
      }
    });

    // Botão de Concluir
    completeButton.addEventListener('click', function() {
      if (lessonStatus !== 'completed' && lessonStatus !== 'passed') {
        scorm.setValue('cmi.core.lesson_status', 'completed');
        scorm.setValue('cmi.core.score.raw', '100'); 
        lessonStatus = 'completed';
        scorm.save();
        this.disabled = true;
        this.textContent = 'Concluído!';
      }
    });
    
    // Botões de Logout
    function handleLogout() {
      scorm.terminate();
      window.close(); // Tenta fechar a janela
    }
    logoutButtonPlayer.onclick = handleLogout;
    logoutButtonMenu.onclick = handleLogout;

    window.onload = initCourse;
    window.onbeforeunload = function() {
      // Salva a localização atual ao sair
      if (currentUnitId) {
         scorm.setValue('cmi.core.lesson_location', currentUnitId);
      }
      scorm.terminate();
    };
  </script>
</body>
</html>`;
}

// =======================================================================
// 2. GERADOR DO MANIFESTO (imsmanifest.xml)
// =======================================================================
export function generateManifest(curso: CursoGerado): string {
  const sanitizedTitle = curso.titulo.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" 
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          identifier="MANIFEST-${sanitizedTitle}-${curso.id}" 
          version="1.0"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-${sanitizedTitle}">
    <organization identifier="ORG-${sanitizedTitle}">
      <title>${curso.titulo}</title>
      <item identifier="ITEM-${sanitizedTitle}" identifierref="RES-${sanitizedTitle}">
        <title>${curso.titulo}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <!-- O recurso principal (SCO) é o index.html -->
    <resource identifier="RES-${sanitizedTitle}" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <!-- Não precisamos mais do player.html -->
      <file href="scorm_api_wrapper.js"/>
      <file href="imscp_rootv1p1p2.xsd"/>
      <file href="adlcp_rootv1p2.xsd"/>
      <file href="imsmd_rootv1p2p1.xsd"/>
    </resource>
  </resources>
</manifest>`;
}

// =======================================================================
// 3. GERADOR DO WRAPPER SCORM (scorm_api_wrapper.js) - Sem alterações
// =======================================================================
export function generateScormWrapper(): string {
  // Este é o wrapper robusto que suporta 1.2 e 2004
  return `console.log('📦 [SCORM-PLAYER] Carregando SCORM API Wrapper...');
var SCORM = (function(){
    var API = null, findAPITries = 0, _debug = true;
    function log(msg) { if (_debug) { console.log('📦 [SCORM-PLAYER] ' + msg); } }
    function findAPI(win) {
        log('Procurando API...');
        while (win.API == null && win.API_1484_11 == null && win.parent != null && win.parent != win) {
            findAPITries++;
            if (findAPITries > 500) { log('Erro: API não encontrada (muitos aninhamentos)'); return null; }
            win = win.parent;
        }
        return win.API_1484_11 || win.API;
    }
    function initAPI() {
        log('Procurando API em window...');
        var win = window;
        API = findAPI(win);
        if (API == null && win.opener != null && typeof(win.opener) != "undefined") { log('Procurando API em window.opener...'); API = findAPI(win.opener); }
        if (API) { log('API encontrada! Versão: ' + (API.LMSInitialize ? '1.2' : '2004')); } else { log('Erro: API não encontrada em nenhum local.'); }
    }
    initAPI();
    return {
        API: API,
        init: function() {
            if (!API) return false;
            var result = API.LMSInitialize ? API.LMSInitialize("") : API.Initialize("");
            log('LMSInitialize/Initialize: ' + result);
            return result === "true" || result === true;
        },
        terminate: function() {
            if (!API) return false;
            var result = API.LMSFinish ? API.LMSFinish("") : API.Terminate("");
            log('LMSFinish/Terminate: ' + result);
            return result === "true" || result === true;
        },
        save: function() {
            if (!API) return false;
            var result = API.LMSCommit ? API.LMSCommit("") : API.Commit("");
            log('LMSCommit/Commit: ' + result);
            return result === "true" || result === true;
        },
        getValue: function(param) {
            if (!API) return "";
            var result = API.LMSGetValue ? API.LMSGetValue(param) : API.GetValue(param);
            log('LMSGetValue(' + param + '): ' + result);
            return result;
        },
        setValue: function(param, value) {
            if (!API) return false;
            var result = API.LMSSetValue ? API.LMSSetValue(param, value) : API.SetValue(param, value);
            log('LMSSetValue(' + param + ', ' + value + '): ' + result);
            return result === "true" || result === true;
        },
        getStudentName: function() {
            var name12 = this.getValue('cmi.core.student_name');
            var name2004 = this.getValue('cmi.learner_name');
            return name12 || name2004 || 'Aluno (Convidado)';
        }
    };
})();
console.log('📦 [SCORM-PLAYER] SCORM Wrapper carregado com sucesso.');
`;
}

// =======================================================================
// 4. GERADOR DOS SCHEMAS XSD (Arquivos de Definição) - Sem alterações
// =======================================================================
export function getXSDs(): { [key: string]: string } {
  return {
    'imscp_rootv1p1p2.xsd': `<?xml version="1.0" encoding="UTF-8"?><xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.imsproject.org/xsd/imscp_rootv1p1p2" version="IMS CP 1.1.2"><xsd:annotation><xsd:documentation>Schema simplificado para validação.</xsd:documentation></xsd:annotation></xsd:schema>`,
    'adlcp_rootv1p2.xsd': `<?xml version="1.0" encoding="UTF-8"?><xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.adlnet.org/xsd/adlcp_rootv1p2"><xsd:annotation><xsd:documentation>Schema simplificado para validação ADL.</xsd:documentation></xsd:annotation></xsd:schema>`,
    'imsmd_rootv1p2p1.xsd': `<?xml version="1.0" encoding="UTF-8"?><xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1"><xsd:annotation><xsd:documentation>Schema simplificado para metadados IMS.</xsd:documentation></xsd:annotation></xsd:schema>`
  };
}

// =======================================================================
// 5. FUNÇÃO PRINCIPAL DE GERAÇÃO DO ZIP
// =======================================================================

export async function generateSCORMPackage(curso: CursoGerado): Promise<Buffer> {
  console.log(`📦 [SCORM Service] Iniciando geração do pacote para: ${curso.titulo}`);
  
  const zip = new JSZip();

  // 1. Gerar e adicionar o Manifesto
  const manifestContent = generateManifest(curso);
  zip.file('imsmanifest.xml', manifestContent);

  // 2. Gerar e adicionar o Player ÚNICO (index.html)
  const indexHtmlContent = generateIndexHtml(curso);
  zip.file('index.html', indexHtmlContent);
  
  // 3. Gerar e adicionar o Wrapper da API
  const wrapperContent = generateScormWrapper();
  zip.file('scorm_api_wrapper.js', wrapperContent);

  // 4. Adicionar os arquivos XSD
  const xsds = getXSDs();
  for (const [filename, content] of Object.entries(xsds)) {
    zip.file(filename, content);
  }

  console.log(`✅ [SCORM Service] Pacote gerado com sucesso para: ${curso.titulo}`);

  // 5. Gerar o .zip como um Buffer
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  return zipBuffer;
}
