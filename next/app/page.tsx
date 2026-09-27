import HomeClient from './home-client';

export const metadata = {
  title: 'Top 10 Australian News Quiz',
  description: "How closely have you been following the news? Test your knowledge of Australia's biggest stories.",
  openGraph: {
    title: 'Top 10 Australian News Quiz',
    description: "How closely have you been following the news? Test your knowledge of Australia's biggest stories.",
    url: 'https://news10-chi.vercel.app',
    images: [
      {
        url: 'https://news10-chi.vercel.app/preview.png',
        width: 1200,
        height: 630,
        alt: 'Homepage Preview Image',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top 10 Australian News Quiz',
    description: "How closely have you been following the news? Test your knowledge of Australia's biggest stories.",
    images: ['https://news10-chi.vercel.app/preview.png'],
  },
}

export default function HomePage() {
  return (
    <main>
      <HomeClient />
    </main>
  );
}
