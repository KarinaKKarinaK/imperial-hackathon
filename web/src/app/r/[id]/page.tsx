import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hydrate, listEvents } from "@/lib/store";
import { publicKeyPem, signingIsEphemeral, verifyHospital, verifyRecord, verifySettlement } from "@/lib/sign";
import { connection } from "next/server";
import { Arrow } from "@/components/Arrow";

// The rider's copy of one record. Printable, verifiable, theirs. This is what
// goes to a clinic, the Labour Department or a lawyer.
export default function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="mx-auto min-h-dvh max-w-3xl px-4 py-8 text-sm opacity-60">Loading the record.</main>}>
      <RecordBody params={params} />
    </Suspense>
  );
}

async function RecordBody({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  await hydrate();
  const e = listEvents().find((x) => x.id === id);
  if (!e) notFound();
  const valid = e.signature ? verifyRecord(e, e.signature) : false;
  const when = new Date(e.ts).toLocaleString("en-GB", { timeZone: "Asia/Hong_Kong", hour12: false });
  const code = e.signature ? e.signature.slice(0, 8).toUpperCase() : "none";
  const settlementValid = e.settlement ? verifySettlement(e) : null;
  const hospitalValid = e.hospital ? verifyHospital(e) : null;
  const fmt = (ts: number) => new Date(ts).toLocaleString("en-GB", { timeZone: "Asia/Hong_Kong", hour12: false });
  const feedbackText = { false_alarm: "False alarm", real_fall: "Real fall", unsure: "Not sure" } as const;
  const jobs = e.activeJobs?.length ? e.activeJobs : [{ platform: e.platform, jobId: e.jobId ?? "none recorded" }];
  const split = e.apportionment?.length ? e.apportionment : [{ platform: e.platform, share: 1 }];
  // The statutory claim has to be lodged within a year of the accident.
  const claimBy = new Date(e.ts);
  claimBy.setFullYear(claimBy.getFullYear() + 1);
  const claimByText = claimBy.toLocaleDateString("en-GB", { timeZone: "Asia/Hong_Kong", day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-8 print:max-w-none print:p-0">
      <style>{`@media print { body { background: #fff; color: #0a0a0a } .tile { border: 1px solid #ccc !important; background: #fff !important; color: #0a0a0a !important } .no-print { display: none } }`}</style>
      <div className="no-print flex items-center justify-between">
        <Link href="/" className="text-sm opacity-70">
          Metrics
        </Link>
        <a href={`/api/events/${e.id}`} className="arrow-link text-sm" target="_blank" rel="noreferrer">
          Download JSON <Arrow size={14} />
        </a>
      </div>

      <section className="tile tile-paper mt-4 p-7 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Work-injury event record</p>
            {e.sample && <span className="pill pill-peach mt-2">Sample record, not a real rider</span>}
            <h1 className="display mt-2 text-4xl sm:text-5xl">{e.id}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`pill ${valid ? "pill-violet" : "pill-peach"}`}>{valid ? "Signature verified" : "Unsigned or altered"}</span>
            <span className={`pill ${settlementValid === null ? "pill-outline" : settlementValid ? "pill-violet" : "pill-peach"}`}>
              {settlementValid === null ? "Outcome not final yet" : settlementValid ? "Settlement verified" : "Settlement altered"}
            </span>
            {hospitalValid !== null && (
              <span className={`pill ${hospitalValid ? "pill-violet" : "pill-peach"}`}>{hospitalValid ? "Hospital claim verified" : "Hospital claim altered"}</span>
            )}
          </div>
        </div>

        <dl className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {(
            [
              ["When", `${when} HKT`],
              ["Where", `${e.lat.toFixed(5)}, ${e.lng.toFixed(5)}`],
              ["Platform at impact", e.platform],
              ["Job at impact", e.jobId ?? "none recorded"],
              ["Open orders at impact", jobs.map((j) => `${j.platform}, ${j.jobId}`).join("; ")],
              ["Liability split", split.map((a) => `${a.platform} ${Math.round(a.share * 100)}%`).join(", ")],
              ["Sensors", e.sources?.length ? (e.sources.length > 1 ? `${e.sources.join(" and ")} agreed` : `${e.sources[0]} only`) : "not recorded"],
              ["Delivery countdown at impact", e.deadlineSec === null ? "not set" : e.deadlineSec >= 0 ? `${Math.floor(e.deadlineSec / 60)} min ${e.deadlineSec % 60} s left` : `${Math.abs(e.deadlineSec)} s late`],
              ["Travel mode", e.mode],
              ["Peak acceleration", `${e.peakG} g`],
              ["Orientation change", `${e.tiltDeg} degrees`],
              ["Stillness after impact", `${e.stillSec} s`],
              ["Model probability of crash", e.confidence.toFixed(3)],
              ["Status", e.status],
              ["Exposure", `${e.context.rain ? "rain" : "dry"}, heat ${e.context.heat}`],
              ["Rider's own label", e.feedback ? feedbackText[e.feedback] : "none given"],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div key={k} className="border-t border-ink/10 pt-3">
              <dt className="text-xs uppercase tracking-wider opacity-60">{k}</dt>
              <dd className="mt-1 text-lg font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 rounded-2xl bg-ink/5 p-5">
          <p className="eyebrow">Triage note sent to dispatch</p>
          <p className="mt-2 text-lg font-medium">{e.triage.profile}</p>
          <p className="text-sm opacity-70">{e.triage.mechanism}. Probable, never a diagnosis.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-ink/15 p-5">
          <p className="eyebrow">Your claim</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60">Claim reference</p>
              <p className="mono mt-1 text-lg">{e.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60">Insurer</p>
              <p className="mt-1 text-lg font-medium">Licensed insurer (to be appointed)</p>
            </div>
          </div>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm opacity-85">
            <li>
              Fixed payout:{" "}
              {e.status === "paid"
                ? `HK$${e.insurance.payoutHkd.toLocaleString()} paid${e.insurance.paidAt ? ` at ${new Date(e.insurance.paidAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Hong_Kong", hour12: false })} HKT` : ""}.`
                : e.status === "cancelled"
                  ? "none, you cancelled inside 30 s."
                  : "paid once the 30 s cancel window closes."}
            </li>
            <li>
              Hospital admission:{" "}
              {e.hospital
                ? `${e.hospital.hospital}, admitted ${fmt(e.hospital.admittedAt)} HKT, reference ${e.hospital.dischargeRef}. ${e.hospital.status === "confirmed" ? "Confirmed by the insurer." : "Submitted and signed, insurer to confirm with the hospital."} This unlocks the statutory amounts.`
                : e.status === "paid"
                  ? "if you went to hospital, add the admission from the rider app. It is signed on receipt and unlocks the statutory amounts."
                  : "can be added once the fixed payout is made."}
            </li>
            <li>
              Lodge the statutory claim by <span className="font-medium">{claimByText}</span>, one year from the event.
            </li>
          </ol>
          <p className="mt-3 text-xs opacity-60">Payout and premium are the central case of our model, built from sourced inputs. No insurer has signed yet. The split uses an equal-share default until the regime sets a rule.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="eyebrow">Verification code</p>
            <p className="mono mt-2 text-3xl">{code}</p>
            <p className="mt-1 text-xs opacity-60">First eight characters of the Ed25519 signature over the impact facts.</p>
          </div>
          <div>
            <p className="eyebrow">How to check it</p>
            <p className="mt-2 text-sm opacity-80">
              Download the JSON and POST it to <span className="mono">metricsfile.vercel.app/api/verify</span>. The public key is published
              with the schema. If any fact above was changed after signing, verification fails.
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs opacity-60">
          This record belongs to the rider. It contains no route, no speed history and no raw sensor data. Platform and insurer hold a
          licence to read it for the job it names.
          {signingIsEphemeral() && " Signing key on this server is temporary; set RECORD_SIGNING_KEY in production."}
        </p>
        <details className="mt-4 text-xs opacity-60">
          <summary>Public key</summary>
          <pre className="mono mt-2 whitespace-pre-wrap">{publicKeyPem()}</pre>
        </details>
      </section>

      <div className="no-print mt-6 flex flex-wrap gap-4">
        <Link href="/record" className="arrow-link text-sm">
          What each field means <Arrow size={14} />
        </Link>
        <Link href="/demo" className="arrow-link text-sm">
          Back to the demo <Arrow size={14} />
        </Link>
      </div>
    </main>
  );
}
