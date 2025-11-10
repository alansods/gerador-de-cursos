'use client';

export function MobileNavbar() {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-card border-b border-border">
      <div className="flex items-center h-16 px-4 pl-14">
        <h1 className="text-lg font-semibold text-foreground">
          Gerador SCORM SENAI
        </h1>
      </div>
    </div>
  );
}
