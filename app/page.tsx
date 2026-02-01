import BlobTracker from "./components/BlobTracker";

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-black">
        <BlobTracker />
      </main>
      <footer className="fixed bottom-0 left-0 right-0 z-10 md:static h-24 bg-background py-4 px-6 pt-4">
        <p>© 2026 @dachanjeong.xyz All rights reserved.</p>
      </footer>
    </>
  );
}
