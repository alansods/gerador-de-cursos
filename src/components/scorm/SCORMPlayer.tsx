"use client";
import React, { useState, useEffect } from "react";
import type { CursoGerado } from "@/types/gerador-curso";
import { SCORMNavbar } from "@/components/SCORMNavbar";
import { SCORMHome } from "./SCORMHome";
import { SCORMUnit } from "./SCORMUnit";
interface SCORMPlayerProps {
  curso: CursoGerado;
}

export function SCORMPlayer({ curso }: SCORMPlayerProps) {
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);

  // Effect to sync with SCORM LMS if needed, or handle initial load
  useEffect(() => {
    // Check if there's a saved location in SCORM
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scorm = (window as any).SCORM;
    if (typeof window !== 'undefined' && scorm) {
      try {
        const savedLocation = scorm.getValue('cmi.core.lesson_location');
        if (savedLocation && savedLocation !== 'index' && savedLocation !== '') {
           // Verify if unit exists
           const unitExists = curso.unidades.some(u => u.id === savedLocation);
           if (unitExists) {
             setCurrentUnitId(savedLocation);
           }
        }
      } catch (e) {
        console.warn('Error reading SCORM location:', e);
      }
    }
  }, [curso.unidades]);

  const handleNavigate = (unitId: string | null) => {
    setCurrentUnitId(unitId);
    
    // Save location to SCORM
    // Save location to SCORM
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scorm = (window as any).SCORM;
    if (typeof window !== 'undefined' && scorm) {
      try {
        const location = unitId || 'index';
        scorm.setValue('cmi.core.lesson_location', location);
        scorm.save();
        console.log('[SCORM-SPA] Saved location:', location);
      } catch (e) {
        console.warn('Error saving SCORM location:', e);
      }
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SCORMNavbar 
        curso={curso} 
        currentUnidadeId={currentUnitId || undefined} 
        showMenu={true} 
        onNavigate={handleNavigate}
      />
      
      {currentUnitId ? (
        <SCORMUnit 
          curso={curso} 
          unidadeId={currentUnitId} 
          onNavigate={handleNavigate} 
        />
      ) : (
        <SCORMHome 
          curso={curso} 
          onNavigate={handleNavigate} 
        />
      )}
    </div>
  );
}
