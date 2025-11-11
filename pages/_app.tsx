import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ClerkProvider } from '@clerk/nextjs';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <Head>
        {/* Favicon shown in browser tab - file placed in /public */}
        <link rel="icon" href="/badcompany_logo1_nobkg.png" />
        <meta name="theme-color" content="#0f172a" />
      </Head>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}