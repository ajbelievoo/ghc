import Link from "next/link";
import Drone404Background from "@/components/Drone404Background";
import GoBackButton from "@/components/GoBackButton";
import { Home, Headset, Search } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | GHC",
  robots: "noindex, follow",
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f8fcff] px-6 py-20 text-[#0f172a]">
      <Drone404Background color="#00B7FF" />

      <Link
        href="/"
        className="fixed left-6 top-6 z-20 flex h-12 w-12 items-center justify-center rounded-xl border border-[#00B7FF]/20 bg-[#00B7FF]/10 text-[#00B7FF] backdrop-blur-md transition hover:bg-[#00B7FF] hover:text-white"
        aria-label="Home"
      >
        <Home size={20} />
      </Link>

      <main className="relative z-10 text-center">
        <h1 className="text-[10rem] font-black leading-none text-[#00B7FF] md:text-[16rem]">
          404
        </h1>
        <h2 className="mt-2 text-3xl font-black md:text-5xl">
          Sorry, The Page Not Found!
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-slate-500">
          It looks like this page took off with the drones. The link may be broken or the page may have been moved.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#00B7FF] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00B7FF]/30 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Home size={18} /> Back to home
          </Link>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 rounded-full border border-[#00B7FF]/30 bg-white px-8 py-3.5 text-sm font-bold text-[#00B7FF] transition hover:bg-[#00B7FF]/10"
          >
            <Headset size={18} /> Contact support
          </Link>
          <GoBackButton />
        </div>

        <form action="/domain" method="get" className="relative mx-auto mt-8 w-full max-w-md">
          <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00B7FF]" />
          <input
            type="text"
            name="q"
            placeholder="Search domains, VPS plans..."
            className="w-full rounded-full border border-[#00B7FF]/20 bg-white/80 py-3.5 pl-12 pr-6 text-sm text-[#0f172a] outline-none backdrop-blur-sm focus:border-[#00B7FF]"
            aria-label="Search"
          />
        </form>
      </main>

      <footer className="fixed bottom-5 left-0 right-0 z-10 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} GHC - Go Host Cloud. All rights reserved.
      </footer>
    </div>
  );
}
