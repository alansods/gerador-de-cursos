import { useState, useEffect } from 'react';

interface LMSInfo {
  isConnected: boolean;
  studentName: string;
  isGuest: boolean;
}

export const useLMS = (): LMSInfo => {
  const [lmsInfo, setLmsInfo] = useState<LMSInfo>({
    isConnected: false,
    studentName: 'Convidado',
    isGuest: true
  });

  useEffect(() => {
    const checkLMSConnection = () => {
      // Tentar obter informações do LMS
      let studentName = 'Convidado';
      let isConnected = false;

      // Verificar se há API do SCORM disponível
      if (typeof window !== 'undefined' && (window as any).API) {
        try {
          // Tentar obter dados do estudante do SCORM
          const learnerName = (window as any).API.get('cmi.learner_name');
          const learnerId = (window as any).API.get('cmi.learner_id');
          
          if (learnerName && learnerName !== '') {
            studentName = learnerName;
            isConnected = true;
          } else if (learnerId && learnerId !== '') {
            studentName = learnerId;
            isConnected = true;
          }
        } catch (error) {
          console.log('Erro ao acessar API SCORM:', error);
        }
      }

      // Verificar se há dados na URL (parâmetros do LMS)
      const urlParams = new URLSearchParams(window.location.search);
      const nameParam = urlParams.get('name') || urlParams.get('student') || urlParams.get('learner') || urlParams.get('user');
      if (nameParam) {
        studentName = decodeURIComponent(nameParam);
        isConnected = true;
      }

      // Verificar se há dados no localStorage (para testes)
      const storedName = localStorage.getItem('lms_student_name');
      if (storedName) {
        studentName = storedName;
        isConnected = true;
      }

      // Verificar se há dados no sessionStorage
      const sessionName = sessionStorage.getItem('student_name');
      if (sessionName) {
        studentName = sessionName;
        isConnected = true;
      }

      // Verificar se há dados em cookies
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'student_name' || name === 'learner_name') {
          studentName = decodeURIComponent(value);
          isConnected = true;
          break;
        }
      }

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
