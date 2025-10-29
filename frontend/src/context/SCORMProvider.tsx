import React, { createContext, useContext, useState } from 'react';

interface SCORMContextType {
  isSCORM: boolean;
  setSCORM: (value: boolean) => void;
}

const SCORMContext = createContext<SCORMContextType | undefined>(undefined);

export const SCORMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSCORM, setIsSCORM] = useState(false);

  const setSCORM = (value: boolean) => {
    setIsSCORM(value);
  };

  return (
    <SCORMContext.Provider value={{ isSCORM, setSCORM }}>
      {children}
    </SCORMContext.Provider>
  );
};

export const useSCORMContext = () => {
  const context = useContext(SCORMContext);
  if (context === undefined) {
    throw new Error('useSCORMContext must be used within a SCORMProvider');
  }
  return context;
};
