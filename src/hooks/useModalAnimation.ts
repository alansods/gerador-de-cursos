import { useState, useCallback } from "react";

export const useModalAnimation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    setIsClosing(false);
  }, []);

  const close = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200); // Duração da animação
  }, []);

  const getModalClasses = useCallback(() => {
    const baseClasses = "fixed inset-0 bg-black flex items-center justify-center p-4 z-50";
    const animationClasses = isClosing
      ? "animate-out fade-out duration-200"
      : "animate-in fade-in duration-200";
    const opacityClasses = isClosing ? "bg-opacity-0" : "bg-opacity-50";
    
    return `${baseClasses} ${animationClasses} ${opacityClasses}`;
  }, [isClosing]);

  const getContentClasses = useCallback((maxWidth = "max-w-2xl") => {
    const baseClasses = `w-full ${maxWidth}`;
    const animationClasses = isClosing
      ? "animate-out zoom-out-95 duration-200"
      : "animate-in zoom-in-95 duration-200";
    
    return `${baseClasses} ${animationClasses}`;
  }, [isClosing]);

  return {
    isOpen,
    isClosing,
    open,
    close,
    getModalClasses,
    getContentClasses,
  };
};
