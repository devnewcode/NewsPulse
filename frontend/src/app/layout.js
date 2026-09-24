import "./globals.css";

export const metadata = {
  title: "News Pulse — Topic-Clustered News Timeline",
  description: "Live news ingestion, TF-IDF topic clustering, and chronological timeline visualization for BBC, NPR, and The Guardian.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
