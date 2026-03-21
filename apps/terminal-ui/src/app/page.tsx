'use client';

import dynamic from 'next/dynamic';

const TerminalUI = dynamic(() => import('@/components/terminal/Terminal'), { ssr: false });

export default function Home() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      {/* Navbar */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5 text-lg font-bold tracking-tighter text-white">
            Foldaa<span className="text-primary/50">.</span>
          </a>
        </div>
        <div className="flex flex-1 justify-end gap-x-6">
          <a href="/login" className="text-sm font-semibold leading-6 text-white hover:text-white/80 transition-colors">Log in</a>
          <a href="/dashboard" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm hover:bg-gray-200 transition-colors">Go to Dashboard</a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:pt-40 lg:px-8 lg:pt-48">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-lg font-bold tracking-tight text-white sm:text-lg">
            Zero-Friction Web Apps <br /> From Any URL
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Instantly turn Framer, Webflow, or any website into a fully functional, extensible PWA. Add authentication, databases, and payments with a single command.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="/dashboard" className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-sm hover:bg-gray-200 transition-colors">
              Get Started
            </a>
            <a href="#how" className="text-sm font-semibold leading-6 text-white hover:text-white/80 transition-colors">
              How it works <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Real Terminal Engine */}
        <div className="mt-16 sm:mt-24 flex justify-center w-full max-w-4xl mx-auto h-[500px]">
          <TerminalUI 
            supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} 
            supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''} 
          />
        </div>
      </main>
    </div>
  );
}
