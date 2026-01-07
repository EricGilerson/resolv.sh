import type { Metadata } from 'next';
import './globals.css';
import Navbar from './Navbar';
import Footer from './Footer';

export const metadata: Metadata = {
    title: 'Resolv - The Agentic SDLC IDE',
    description: 'The deterministic agentic SDLC IDE. Speed. Accuracy. Expert Mode.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="bg-black antialiased">
            <body className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-1">
                    {children}
                </div>
                <Footer />
            </body>
        </html>
    );
}
