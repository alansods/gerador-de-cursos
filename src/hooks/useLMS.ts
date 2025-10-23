import { useState, useEffect } from 'react';

interface LMSInfo {
  isConnected: boolean;
  studentName: string;
  isGuest: boolean;
}

export const useLMS = (): LMSInfo => {
  console.log('🚀 [useLMS] Hook inicializado');
  
  const [lmsInfo, setLmsInfo] = useState<LMSInfo>({
    isConnected: false,
    studentName: 'Convidado',
    isGuest: true
  });

  useEffect(() => {
    console.log('⚡ [useLMS] useEffect executado');
    
    const checkLMSConnection = () => {
      console.log('🔍 [useLMS] Iniciando verificação de conexão LMS...');
      
      // Tentar obter informações do LMS
      let studentName = 'Convidado';
      let isConnected = false;

      // Verificar se há API do SCORM disponível
      if (typeof window !== 'undefined' && (window as any).API) {
        console.log('✅ [useLMS] API SCORM detectada');
        try {
          // Tentar obter dados do estudante do SCORM - múltiplas propriedades
          const learnerName = (window as any).API.get('cmi.learner_name');
          const learnerId = (window as any).API.get('cmi.learner_id');
          const learnerPreference = (window as any).API.get('cmi.learner_preference');
          const studentName = (window as any).API.get('cmi.student_name');
          const studentId = (window as any).API.get('cmi.student_id');
          const userName = (window as any).API.get('cmi.user_name');
          const userId = (window as any).API.get('cmi.user_id');
          
          console.log('📊 [useLMS] Dados SCORM completos:', {
            learnerName,
            learnerId,
            learnerPreference,
            studentName,
            studentId,
            userName,
            userId,
            learnerNameType: typeof learnerName,
            learnerIdType: typeof learnerId
          });
          
          // Tentar diferentes propriedades em ordem de prioridade
          if (learnerName && learnerName !== '') {
            studentName = learnerName;
            isConnected = true;
            console.log('✅ [useLMS] Nome do aluno obtido via SCORM learner_name:', learnerName);
          } else if (studentName && studentName !== '') {
            studentName = studentName;
            isConnected = true;
            console.log('✅ [useLMS] Nome do aluno obtido via SCORM student_name:', studentName);
          } else if (userName && userName !== '') {
            studentName = userName;
            isConnected = true;
            console.log('✅ [useLMS] Nome do aluno obtido via SCORM user_name:', userName);
          } else if (learnerId && learnerId !== '') {
            studentName = learnerId;
            isConnected = true;
            console.log('✅ [useLMS] ID do aluno obtido via SCORM learner_id:', learnerId);
          } else if (studentId && studentId !== '') {
            studentName = studentId;
            isConnected = true;
            console.log('✅ [useLMS] ID do aluno obtido via SCORM student_id:', studentId);
          } else if (userId && userId !== '') {
            studentName = userId;
            isConnected = true;
            console.log('✅ [useLMS] ID do aluno obtido via SCORM user_id:', userId);
          } else {
            console.log('⚠️ [useLMS] Nenhum dado de aluno encontrado na API SCORM');
          }
        } catch (error) {
          console.log('❌ [useLMS] Erro ao acessar API SCORM:', error);
        }
      } else {
        console.log('⚠️ [useLMS] API SCORM não disponível');
      }

      // Verificar se há dados na URL (parâmetros do LMS)
      const urlParams = new URLSearchParams(window.location.search);
      const nameParam = urlParams.get('name') || urlParams.get('student') || urlParams.get('learner') || urlParams.get('user');
      console.log('🔗 [useLMS] Parâmetros da URL:', {
        search: window.location.search,
        nameParam,
        allParams: Object.fromEntries(urlParams.entries())
      });
      if (nameParam) {
        studentName = decodeURIComponent(nameParam);
        isConnected = true;
        console.log('✅ [useLMS] Nome do aluno obtido via URL:', nameParam);
      }

      // Verificar se há dados no localStorage (para testes)
      const storedName = localStorage.getItem('lms_student_name');
      console.log('💾 [useLMS] localStorage:', { storedName });
      if (storedName) {
        studentName = storedName;
        isConnected = true;
        console.log('✅ [useLMS] Nome do aluno obtido via localStorage:', storedName);
      }

      // Verificar se há dados no sessionStorage
      const sessionName = sessionStorage.getItem('student_name');
      console.log('🗂️ [useLMS] sessionStorage:', { sessionName });
      if (sessionName) {
        studentName = sessionName;
        isConnected = true;
        console.log('✅ [useLMS] Nome do aluno obtido via sessionStorage:', sessionName);
      }

      // Verificar se há dados em cookies
      const cookies = document.cookie.split(';');
      console.log('🍪 [useLMS] Cookies:', { cookies: document.cookie });
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'student_name' || name === 'learner_name') {
          studentName = decodeURIComponent(value);
          isConnected = true;
          console.log('✅ [useLMS] Nome do aluno obtido via cookie:', { name, value });
          break;
        }
      }

      console.log('🎯 [useLMS] Resultado final:', {
        isConnected,
        studentName,
        isGuest: !isConnected,
        windowLocation: window.location.href,
        windowParent: window.parent !== window,
        windowTop: window.top !== window,
        documentReferrer: document.referrer
      });

      setLmsInfo({
        isConnected,
        studentName,
        isGuest: !isConnected
      });
    };

    checkLMSConnection();

    // Verificar novamente após um pequeno delay para garantir que o LMS carregou
    const timeout = setTimeout(checkLMSConnection, 1000);
    
    return () => clearTimeout(timeout);
  }, []);

  return lmsInfo;
};
