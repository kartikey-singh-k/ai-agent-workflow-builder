import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ApolloProviderWrapper } from "@/lib/apollo";
import Navbar from "@/components/Navbar";
import "./globals.css"; // <-- THIS IS THE MAGIC LINE

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Agent Workflow Builder",
  description: "Build and monitor AI agent workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloProviderWrapper>
          <Navbar />
          <main>{children}</main>
        </ApolloProviderWrapper>
      </body>
    </html>
  );
}