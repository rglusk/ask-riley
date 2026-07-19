import type { Metadata } from "next";
import "./globals.css";
import { quicksand, highbeams } from "@/lib/fonts";
import { InkFilter } from "@/components/InkFilter";

export const metadata: Metadata = {
    title: "ask riley",
    description:
        "Ask me about the movies I love, my work, or how to reach me — I'm a little bit of a chatbot about it.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${quicksand.variable} ${highbeams.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                <InkFilter />
                {children}
            </body>
        </html>
    );
}
