import { LabelVerificationApp } from "@/components/label-verification-app";

export default function Home() {
  return (
    <main className="aurora-page min-h-screen px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="glass-panel max-w-3xl p-6 sm:p-8">
          <h1 className="text-4xl font-bold tracking-tight">
            TTB Label Verification
          </h1>
          <p className="mt-3 text-lg text-slate-800">
            Compare alcohol-label images with submitted application details.
          </p>
        </header>
        <div className="mt-8">
          <LabelVerificationApp />
        </div>
      </div>
    </main>
  );
}
