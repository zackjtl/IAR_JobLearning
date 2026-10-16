import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/layout/shell";

export const metadata: Metadata = {
  title: { default: "IAR FAE Interview Academy", template: "%s · IAR FAE Academy" },
  description: "個人化 IAR Systems FAE / Technical Support 面試準備平台",
  robots: { index: false, follow: false },
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant-TW" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
