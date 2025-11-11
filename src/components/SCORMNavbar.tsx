'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, Home, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { CursoGerado } from '@/types/gerador-curso';
import { useLMS } from '@/hooks/useLMS';

interface SCORMNavbarProps {
  curso: CursoGerado;
  currentUnidadeId?: string;
  showMenu?: boolean;
}

export function SCORMNavbar({ curso, currentUnidadeId, showMenu = true }: SCORMNavbarProps) {
  const { learnerName, isConnected } = useLMS();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b-[1px] border-[#e5e7eb] z-50 h-16 flex items-center px-4">
      {showMenu && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] sm:w-[400px] p-0 bg-linear-to-b from-gray-50 to-white">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
              <SheetTitle className="text-left text-xl font-bold text-gray-900">
                Unidades do curso
              </SheetTitle>
            </SheetHeader>
            <nav className="px-4 py-6 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
              {/* Home Button */}
              <Link
                href={currentUnidadeId ? "../index.html" : "#"}
                className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
                  <Home className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm leading-snug">
                    Página inicial
                  </span>
                </div>
              </Link>

              {/* Units Section */}
              {(curso.unidades || []).map((u, index) => {
                const isActive = currentUnidadeId ? u.id === currentUnidadeId : false;
                const href = currentUnidadeId
                  ? (u.id === currentUnidadeId ? '#' : `${u.id}.html`)
                  : `unidade/${u.id}.html`;

                return (
                  <Link
                    key={u.id}
                    href={href}
                    className={`group flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? 'border-orange-500 bg-orange-50/50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    {/* Badge with number */}
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm leading-snug">
                        {u.titulo}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      )}

      {/* Course Title in Navbar */}
      <div className="ml-4 flex-1">
        <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
          {curso.titulo}
        </h2>
      </div>

      {/* Student Name Display */}
      {isConnected && learnerName && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
          <User className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{learnerName}</span>
        </div>
      )}
    </nav>
  );
}
