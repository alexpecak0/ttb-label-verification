import { LabelVerificationApp } from "@/components/label-verification-app";

export default function Home() {
  return (
    <main>
      <div aria-hidden="true" className="scene">
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
        <div className="orb o4" />
        <div className="shape s1" />
        <div className="shape s2" />
        <div className="shape s3" />
        <div className="shape s4" />
      </div>
      <div className="wrap">
        <header className="glass bar">
          <div className="brand">
            <span aria-hidden="true" className="seal">✓</span>
            <div>
              <h1>TTB Label Verification</h1>
              <p>Compare alcohol-label images with submitted application details.</p>
            </div>
          </div>
        </header>
        <div>
          <LabelVerificationApp />
        </div>
      </div>
    </main>
  );
}
