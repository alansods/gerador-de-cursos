import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Drawer from "./Drawer";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-[73px]">{children}</main>
      <Footer />
      <Drawer />
    </div>
  );
}
