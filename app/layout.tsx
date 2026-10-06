import type { Metadata } from "next";
import localFont from "next/font/local";

import "@/app/styles/catalog.css";

const onest=localFont({src:"../public/fonts/Onest.ttf",display:"swap",variable:"--font-onest"});

export const metadata: Metadata = {
  title: "Roadmap Courses",
  description: "Схема и экосистема образовательных программ по практической кибербезопасности."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('education-theme');document.documentElement.dataset.theme=(t==='dark'||t==='light')?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();` }} /></head>
      <body className={onest.variable}>{children}</body>
    </html>
  );
}
