import BlobTracker from "./components/BlobTracker";

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-black">
        <BlobTracker />
      </main>
      <footer className="relative md:static h-16 bg-background py-4 px-6 text-xs">
        <p>© 2026 @dachanjeong.xyz All rights reserved.</p>
      </footer>
    </>
  );
}
