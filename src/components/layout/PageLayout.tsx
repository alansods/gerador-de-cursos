import React from "react";

interface PageLayoutProps {
  children: React.ReactNode;
  navbar?: React.ReactNode;
  showNavbar?: boolean;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  navbar,
  showNavbar = true,
  className = "",
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && navbar}
      <div className={`${showNavbar ? "pt-24" : ""} ${className}`}>
        {children}
      </div>
    </div>
  );
};

interface ContentSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {children}
    </div>
  );
};
