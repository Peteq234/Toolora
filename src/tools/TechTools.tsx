import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import {
  Badge,
  Button,
  CopyButton,
  Field,
  Input,
  Note,
  ResultCard,
  Segmented,
  Select,
  StatTile,
  Workspace,
} from "@/components/ui";
import { clamp, formatNumber, parseNumeric } from "@/lib/utils";

/* ------------------------------- internet speed ---------------------------- */

type NavigatorConnection = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
};

type BrowserConnection = { connection: NavigatorConnection | null; online: boolean };

const SIZE_UNITS = [
  { value: "MB", label: "MB", factor: 1_000_000 },
  { value: "GB", label: "GB", factor: 1_000_000_000 },
  { value: "TB", label: "TB", factor: 1_000_000_000_000 },
];

const SPEED_ROWS = [
  { activity: "Browsing, email, messaging", need: "1–5 Mbps", note: "Plenty for one or two people; pages are small." },
  { activity: "HD video calls", need: "3–5 Mbps", note: "Both download and upload matter." },
  { activity: "HD streaming (1080p)", need: "5–8 Mbps", note: "Per stream, depending on the service." },
  { activity: "4K streaming", need: "15–25 Mbps", note: "Per stream; HDR and high bitrates use more." },
  { activity: "Online gaming", need: "10–25 Mbps", note: "Latency and jitter usually matter more than raw speed." },
  { activity: "Uploading large files", need: "50+ Mbps", note: "Upload speed is the limiting number, not download." },
];

const TEST_LINKS = [
  { name: "Cloudflare Speed Test", href: "https://speed.cloudflare.com/", note: "Detailed latency and jitter figures." },
  { name: "Fast.com", href: "https://fast.com/", note: "Simple Netflix-hosted download check." },
  { name: "Speedtest by Ookla", href: "https://www.speedtest.net/", note: "Widely used, with server selection." },
];

function readConnection(): BrowserConnection {
  if (typeof navigator === "undefined") return { connection: null, online: true };
  const nav = navigator as Navigator & { connection?: NavigatorConnection };
  return { connection: nav.connection ?? null, online: nav.onLine };
}

function formatTransferTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 1) return "under a second";
  if (seconds < 60) return `about ${Math.ceil(seconds)} seconds`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.round(seconds % 60);
    return `about ${minutes} min${remainder ? ` ${remainder} s` : ""}`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `about ${hours} h${minutes ? ` ${minutes} min` : ""}`;
}

export function InternetSpeedGuide() {
  const [fileSize, setFileSize] = useState("1");
  const [sizeUnit, setSizeUnit] = useState("GB");
  const [speed, setSpeed] = useState("100");
  const [snapshot, setSnapshot] = useState<BrowserConnection>(() => ({ connection: null, online: true }));

  useEffect(() => {
    setSnapshot(readConnection());
    function update() {
      setSnapshot(readConnection());
    }
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const calculation = useMemo(() => {
    const size = parseNumeric(fileSize);
    const mbps = parseNumeric(speed);
    const unit = SIZE_UNITS.find((item) => item.value === sizeUnit) ?? SIZE_UNITS[1];
    if (!Number.isFinite(size) || !Number.isFinite(mbps) || size <= 0 || mbps <= 0) {
      return { valid: false, seconds: 0, megabytesPerSecond: 0, bytes: 0 };
    }
    const bytes = size * unit.factor;
    const seconds = (bytes * 8) / (mbps * 1_000_000);
    return { valid: true, seconds, megabytesPerSecond: mbps / 8, bytes };
  }, [fileSize, sizeUnit, speed]);

  const connection = snapshot.connection;

  return (
    <Workspace slug="internet-speed-guide">
      <div className="space-y-6">
        <Note tone="warn" title="Toolora does not run a speed test">
          We won't show you invented numbers. Accurate testing needs dedicated servers and large
          transfers. This page gives you the maths, vocabulary and links to real measurement tools.
        </Note>

        <div>
          <h3 className="text-[15px] font-semibold text-mist-50">Download time calculator</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-mist-500">
            A realistic ideal-condition estimate. Protocol overhead, Wi-Fi and server limits usually
            make real transfers a little slower.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px_1fr]">
            <Field label="File size" htmlFor="speed-size">
              <Input
                id="speed-size"
                type="number"
                min={0}
                inputMode="decimal"
                value={fileSize}
                onChange={(event) => setFileSize(event.target.value)}
                className="font-mono"
              />
            </Field>
            <Field label="Unit" htmlFor="speed-unit">
              <Select
                id="speed-unit"
                value={sizeUnit}
                onChange={(event) => setSizeUnit(event.target.value)}
                options={SIZE_UNITS.map((unit) => ({ value: unit.value, label: unit.label }))}
              />
            </Field>
            <Field label="Connection speed" htmlFor="speed-mbps" hint="megabits per second">
              <Input
                id="speed-mbps"
                type="number"
                min={0}
                inputMode="decimal"
                value={speed}
                onChange={(event) => setSpeed(event.target.value)}
                className="font-mono"
              />
            </Field>
          </div>

          <div className="mt-3">
            <ResultCard
              label="Ideal download time"
              value={calculation.valid ? formatTransferTime(calculation.seconds) : "—"}
              hint={
                calculation.valid
                  ? `${formatNumber(parseNumeric(speed), 2)} Mbps ≈ ${formatNumber(calculation.megabytesPerSecond, 2)} MB/s. A larger file or a busier network will take longer.`
                  : "Enter a file size and a speed above zero."
              }
            />
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <StatTile
              label="Speed in MB/s"
              value={calculation.valid ? `${formatNumber(calculation.megabytesPerSecond, 2)} MB/s` : "—"}
              hint="divide Mbps by 8"
            />
            <StatTile
              label="Data per minute"
              value={calculation.valid ? `${formatNumber(calculation.megabytesPerSecond * 60 / 1000, 2)} GB` : "—"}
              hint="at full speed"
            />
            <StatTile label="Overhead" value="Not included" hint="real transfers add overhead" />
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-mist-100">Your browser's network report</h3>
              <Badge tone={snapshot.online ? "brand" : "warn"}>{snapshot.online ? "Online" : "Offline"}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSnapshot(readConnection())}>
              <Icon name="refresh" size={13} />
              Refresh
            </Button>
          </div>
          {connection ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Effective type" value={connection.effectiveType?.toUpperCase() ?? "—"} />
              <StatTile
                label="Downlink estimate"
                value={connection.downlink ? `${formatNumber(connection.downlink, 2)} Mbps` : "—"}
              />
              <StatTile label="Round-trip time" value={connection.rtt ? `${connection.rtt} ms` : "—"} />
              <StatTile label="Data saver" value={connection.saveData ? "On" : "Off"} />
            </div>
          ) : (
            <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
              This browser doesn't expose network information — that's common in Safari and Firefox.
              No problem: use one of the dedicated tests below for a real measurement.
            </p>
          )}
          <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
            Reported by the browser · a coarse estimate, not a speed test
          </p>
        </div>

        <div>
          <h3 className="text-[15px] font-semibold text-mist-50">What speed do you need?</h3>
          <p className="mt-1 text-[12.5px] text-mist-500">
            General guidance for a single person. Add headroom for every person and active device.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07]">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.025]">
                  <th scope="col" className="px-4 py-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-mist-500">Activity</th>
                  <th scope="col" className="px-4 py-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-mist-500">Suggested speed</th>
                  <th scope="col" className="px-4 py-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-mist-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {SPEED_ROWS.map((row) => (
                  <tr key={row.activity} className="border-b border-white/[0.05] last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 text-[12.5px] font-medium text-mist-200">{row.activity}</th>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11.5px] text-brand-200">{row.need}</td>
                    <td className="px-4 py-2.5 text-[11.5px] leading-relaxed text-mist-400">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { term: "Download", text: "Data arriving at your device: pages, streams, files." },
            { term: "Upload", text: "Data leaving your device: calls, backups, posts." },
            { term: "Latency (ping)", text: "Round-trip delay in milliseconds. Lower is more responsive." },
            { term: "Jitter", text: "Variation in latency. High jitter makes calls glitchy." },
          ].map((item) => (
            <div key={item.term} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <p className="text-[12px] font-semibold text-mist-200">{item.term}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-mist-500">{item.text}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-[15px] font-semibold text-mist-50">Measure it properly</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {TEST_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-white/[0.08] bg-white/[0.022] p-3.5 transition hover:border-brand-400/30 hover:bg-brand-400/[0.04]"
              >
                <span className="flex items-center justify-between gap-2 text-[12.5px] font-semibold text-mist-100">
                  {link.name}
                  <Icon name="external" size={13} className="text-mist-500 group-hover:text-brand-300" />
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-mist-500">{link.note}</span>
              </a>
            ))}
          </div>
          <ul className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-mist-400">
            <li>• Test with an Ethernet cable first, then repeat over Wi-Fi.</li>
            <li>• Close downloads, cloud backups and streaming on other devices.</li>
            <li>• Test at different times of day; congestion changes results.</li>
            <li>• Compare like with like — servers, devices and test methods all matter.</li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton
            value={
              calculation.valid
                ? `${fileSize} ${sizeUnit} at ${speed} Mbps takes about ${formatTransferTime(calculation.seconds)} in ideal conditions (${formatNumber(calculation.megabytesPerSecond, 2)} MB/s).`
                : ""
            }
            label="Copy estimate"
            copiedLabel="Copied"
          />
          <span className="text-[11px] text-mist-500">
            A “GB” here is 1,000,000,000 bytes. Your OS may use GiB.
          </span>
        </div>
      </div>
    </Workspace>
  );
}

/* ------------------------------ PC bottleneck ------------------------------ */

type ResolutionId = "1080" | "1440" | "4k" | "work";
type WorkloadId = "aaa" | "esports" | "simulation" | "creative" | "general";

const CPU_TIERS = [
  { id: "entry", label: "Entry — older 4-core", score: 32, note: "Older or budget quad-core. Fine for light tasks and older titles." },
  { id: "budget", label: "Budget modern — 6-core", score: 52, note: "Modern entry-level six-core. Capable, but not for heavy simulation." },
  { id: "mainstream", label: "Mainstream — 8-core", score: 70, note: "A common mid-range choice for gaming and general work." },
  { id: "high", label: "High-end — 12+ core", score: 86, note: "Strong multi-core performance for creative and CPU-heavy work." },
  { id: "flagship", label: "Flagship — 16+ core", score: 100, note: "Top-tier relative capability on our simplified scale." },
];

const GPU_TIERS = [
  { id: "integrated", label: "Integrated graphics", score: 16, note: "Built into the processor. Suitable for desktop work, not demanding games." },
  { id: "entry", label: "Entry-level discrete", score: 34, note: "Older or budget card for 1080p at modest settings." },
  { id: "mainstream", label: "Mainstream 1080p", score: 54, note: "Comfortable for many modern games at 1080p." },
  { id: "upper", label: "Upper mid-range 1440p", score: 74, note: "A strong 1440p card with headroom for high settings." },
  { id: "high", label: "High-end 4K", score: 92, note: "Built for high-resolution, high-refresh gaming." },
  { id: "flagship", label: "Enthusiast flagship", score: 100, note: "The fastest tier on our scale, at a premium price." },
];

const WORKLOADS: { value: WorkloadId; label: string; cpuWeight: number; description: string }[] = [
  { value: "aaa", label: "Modern AAA games", cpuWeight: 0.4, description: "Graphics-heavy titles at high settings." },
  { value: "esports", label: "Competitive / esports", cpuWeight: 0.55, description: "High frame rates and CPU-heavy responses." },
  { value: "simulation", label: "Simulation, strategy & MMO", cpuWeight: 0.68, description: "Large worlds and many units stress the processor." },
  { value: "creative", label: "Video editing & 3D", cpuWeight: 0.35, description: "Rendering leans heavily on the graphics card." },
  { value: "general", label: "Everyday productivity", cpuWeight: 0.62, description: "Browsing, office work and light multitasking." },
];

const RESOLUTIONS: { value: ResolutionId; label: string; cpuFactor: number }[] = [
  { value: "1080", label: "1080p", cpuFactor: 1.12 },
  { value: "1440", label: "1440p", cpuFactor: 0.97 },
  { value: "4k", label: "4K", cpuFactor: 0.78 },
  { value: "work", label: "Not gaming", cpuFactor: 1 },
];

export function PcBottleneckCalculator() {
  const [cpuId, setCpuId] = useState("mainstream");
  const [gpuId, setGpuId] = useState("mainstream");
  const [resolution, setResolution] = useState<ResolutionId>("1440");
  const [workload, setWorkload] = useState<WorkloadId>("aaa");

  const cpu = CPU_TIERS.find((tier) => tier.id === cpuId) ?? CPU_TIERS[2];
  const gpu = GPU_TIERS.find((tier) => tier.id === gpuId) ?? GPU_TIERS[2];
  const selectedWorkload = WORKLOADS.find((item) => item.value === workload) ?? WORKLOADS[0];
  const resolutionFactor = RESOLUTIONS.find((item) => item.value === resolution)?.cpuFactor ?? 1;

  const estimate = useMemo(() => {
    const cpuWeight = clamp(selectedWorkload.cpuWeight * resolutionFactor, 0.15, 0.82);
    const gpuWeight = 1 - cpuWeight;
    const cpuContribution = cpu.score * cpuWeight;
    const gpuContribution = gpu.score * gpuWeight;
    const total = cpuContribution + gpuContribution;
    const cpuShare = (cpuContribution / total) * 100;
    const gpuShare = (gpuContribution / total) * 100;
    const gap = Math.abs(cpuShare - gpuShare);
    const balanceScore = Math.round(clamp(100 - gap * 1.35, 0, 100));
    const limiter = gap < 7 ? "Balanced" : cpuShare > gpuShare ? "CPU" : "GPU";
    const bothModest = cpu.score < 55 && gpu.score < 55;
    return {
      cpuWeight,
      gpuWeight,
      cpuShare: Math.round(cpuShare),
      gpuShare: Math.round(gpuShare),
      gap: Math.round(gap),
      balanceScore,
      limiter,
      capability: Math.round(total),
      bothModest,
    };
  }, [cpu, gpu, selectedWorkload, resolutionFactor]);

  const verdict =
    estimate.limiter === "CPU"
      ? "The processor looks like the relative limit"
      : estimate.limiter === "GPU"
        ? "The graphics card looks like the relative limit"
        : "This pairing looks roughly balanced";

  const advice =
    estimate.limiter === "CPU"
      ? "Check benchmarks for the specific games or applications you use. A processor upgrade can also require a new motherboard, memory or cooler, so price the platform — not just the chip."
      : estimate.limiter === "GPU"
        ? "Compare graphics cards using benchmarks at your actual resolution and settings. Also confirm your power supply wattage, connectors and case clearance before buying."
        : estimate.bothModest
          ? "Both parts sit in modest tiers, so raising just one may bring limited gains. Decide based on the games or applications you actually use, and confirm with independent benchmarks."
          : "Neither part is dramatically out of step on this rough scale. Upgrade for a specific workload or feature rather than because of a score alone.";

  return (
    <Workspace slug="pc-bottleneck-calculator">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Processor tier" htmlFor="bottleneck-cpu">
            <Select
              id="bottleneck-cpu"
              value={cpuId}
              onChange={(event) => setCpuId(event.target.value)}
              options={CPU_TIERS.map((tier) => ({ value: tier.id, label: tier.label }))}
            />
          </Field>
          <Field label="Graphics card tier" htmlFor="bottleneck-gpu">
            <Select
              id="bottleneck-gpu"
              value={gpuId}
              onChange={(event) => setGpuId(event.target.value)}
              options={GPU_TIERS.map((tier) => ({ value: tier.id, label: tier.label }))}
            />
          </Field>
        </div>
        <div className="-mt-2 grid gap-2 sm:grid-cols-2">
          <p className="text-[11px] leading-relaxed text-mist-500">{cpu.note}</p>
          <p className="text-[11px] leading-relaxed text-mist-500">{gpu.note}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-mist-200">Resolution</p>
            <Segmented label="Resolution" value={resolution} onChange={setResolution} options={RESOLUTIONS} />
          </div>
          <Field label="Workload" htmlFor="bottleneck-workload">
            <Select
              id="bottleneck-workload"
              value={workload}
              onChange={(event) => setWorkload(event.target.value as WorkloadId)}
              options={WORKLOADS.map((item) => ({ value: item.value, label: item.label }))}
            />
          </Field>
        </div>
        <p className="-mt-2 text-[11px] text-mist-500">{selectedWorkload.description}</p>

        <div className="rounded-2xl border border-brand-400/20 bg-gradient-to-br from-brand-400/[0.1] via-white/[0.025] to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-brand-200/80">
              Approximate balance estimate
            </p>
            <Badge tone="warn">Heuristic · not a benchmark</Badge>
          </div>
          <p className="mt-2 text-[18px] font-semibold leading-snug text-mist-50">{verdict}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div>
              <p className="font-mono text-[26px] leading-none text-mist-50">{estimate.balanceScore}</p>
              <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist-500">balance / 100</p>
            </div>
            <div>
              <p className="font-mono text-[26px] leading-none text-mist-50">{estimate.gap}%</p>
              <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist-500">est. imbalance</p>
            </div>
            <div>
              <p className="font-mono text-[26px] leading-none text-mist-50">{estimate.capability}</p>
              <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist-500">relative capability</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] text-mist-400">
              <span>CPU emphasis in this scene</span>
              <span>{estimate.cpuShare}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-700">
              <span className="block h-full rounded-full bg-sky-400/80" style={{ width: `${estimate.cpuShare}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] text-mist-400">
              <span>GPU emphasis in this scene</span>
              <span>{estimate.gpuShare}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-700">
              <span className="block h-full rounded-full bg-brand-400/80" style={{ width: `${estimate.gpuShare}%` }} />
            </div>
          </div>
          <p className="pt-1 text-[11.5px] leading-relaxed text-mist-500">
            Shares express how much relative weight this scene places on each tier. They are not
            utilisation percentages and do not come from your hardware.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="text-[12px] font-semibold text-mist-100">What to do with this</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-mist-400">{advice}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <StatTile label="CPU tier" value={<span className="font-sans text-[12px]">{cpu.label.split("—")[0]}</span>} />
            <StatTile label="GPU tier" value={<span className="font-sans text-[12px]">{gpu.label.split(" ")[0]}</span>} />
            <StatTile label="Resolution" value={<span className="font-sans text-[12px]">{RESOLUTIONS.find((item) => item.value === resolution)?.label}</span>} />
          </div>
        </div>

        <div>
          <CopyButton
            value={`Approximate PC balance estimate — CPU: ${cpu.label}; GPU: ${gpu.label}; ${resolution}; ${selectedWorkload.label}. Likely limiter: ${estimate.limiter}. Balance score ${estimate.balanceScore}/100. Not a benchmark; results are a rough heuristic.`}
            label="Copy estimate"
            copiedLabel="Copied"
          />
        </div>

        <Note tone="warn" title="Read this before buying anything">
          This is a rough planning estimate, not a benchmark or a measurement of your PC. It doesn't
          model RAM, cooling, drivers, game engines, in-game settings, upscaling or background
          software — and it deliberately shows no FPS prediction. Confirm any upgrade with
          independent benchmarks for your exact games and applications.
        </Note>

        <details className="rounded-xl border border-white/[0.07] bg-white/[0.015] px-4 py-3 text-[12px] text-mist-400">
          <summary className="cursor-pointer font-semibold text-mist-200">Why is there no FPS number?</summary>
          <p className="mt-2 leading-relaxed">
            Predicting frame rate without running the software would be guesswork. Frame rate depends
            on the engine, scene, GPU driver, resolution, upscaling, memory configuration and many
            other variables. Some balanced systems are still limited by other parts; some
            “mismatched” systems perform brilliantly in particular games.
          </p>
        </details>
      </div>
    </Workspace>
  );
}
