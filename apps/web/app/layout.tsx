import type { Metadata } from "next";
import "./globals.css";
import { quicksand, highbeams } from "@/lib/fonts";
import { InkFilter } from "@/components/InkFilter";

const description =
    "Ask me about the movies I love, my work, or how to reach me — I'm a little bit of a chatbot about it.";

export const metadata: Metadata = {
    metadataBase: new URL("https://rileyglusker.com"),
    title: "ask riley",
    description,
    // opengraph-image.tsx / icon.svg are picked up by convention; these fill in
    // the surrounding unfurl text for iMessage, Slack, Twitter, etc.
    openGraph: {
        title: "ask riley",
        description,
        url: "/",
        siteName: "ask riley",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "ask riley",
        description,
    },
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
