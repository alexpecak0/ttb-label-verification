import { LabelVerificationApp } from "@/components/label-verification-app";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight">
          TTB Label Verification
          </h1>
          <p className="mt-3 text-lg text-slate-700">
            Compare alcohol-label images with submitted application details.
          </p>
        </header>
        <div className="mt-8 rounded-xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
          <LabelVerificationApp />
        </div>
      </div>
    </main>
  );
}
