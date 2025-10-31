import { ReactNode } from "react";

interface ContentSectionProps {
  children: ReactNode;
  className?: string;
}

export function ContentSection({
  children,
  className = "",
}: ContentSectionProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

interface ContentTitleProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function ContentTitle({
  children,
  level = 3,
  className = "",
}: ContentTitleProps) {
  const baseClasses = "font-medium mb-4";
  const levelClasses = {
    1: "text-3xl",
    2: "text-2xl",
    3: "text-xl",
    4: "text-lg",
    5: "text-base",
    6: "text-sm",
  };

  // Se não há className personalizada, usa a cor padrão
  const defaultColorClass =
    !className || !className.includes("text-") ? "text-foreground" : "";

  const finalClassName = className
    ? `${baseClasses} ${levelClasses[level]} ${defaultColorClass} ${className}`
    : `${baseClasses} ${levelClasses[level]} ${defaultColorClass}`;

  switch (level) {
    case 1:
      return <h1 className={finalClassName}>{children}</h1>;
    case 2:
      return <h2 className={finalClassName}>{children}</h2>;
    case 3:
      return <h3 className={finalClassName}>{children}</h3>;
    case 4:
      return <h4 className={finalClassName}>{children}</h4>;
    case 5:
      return <h5 className={finalClassName}>{children}</h5>;
    case 6:
      return <h6 className={finalClassName}>{children}</h6>;
    default:
      return <h3 className={finalClassName}>{children}</h3>;
  }
}

interface ContentParagraphProps {
  children: ReactNode;
  className?: string;
}

export function ContentParagraph({
  children,
  className = "",
}: ContentParagraphProps) {
  // Se não há className personalizada, usa a cor padrão
  const defaultColorClass =
    !className || !className.includes("text-") ? "text-foreground" : "";

  return (
    <p className={`leading-relaxed mb-4 ${defaultColorClass} ${className}`}>
      {children}
    </p>
  );
}

interface ContentListProps {
  items: string[];
  ordered?: boolean;
  className?: string;
}

export function ContentList({
  items,
  ordered = false,
  className = "",
}: ContentListProps) {
  const ListTag = ordered ? "ol" : "ul";

  // Se não há className personalizada, usa a cor padrão
  const defaultColorClass =
    !className || !className.includes("text-") ? "text-foreground" : "";

  return (
    <ListTag
      className={`leading-relaxed mb-4 space-y-2 ${defaultColorClass} ${className}`}
    >
      {items.map((item, index) => (
        <li key={index} className="flex items-start">
          <span className="mr-2 text-muted-foreground">
            {ordered ? `${index + 1}.` : "•"}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ListTag>
  );
}
