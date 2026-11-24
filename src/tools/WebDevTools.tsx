import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Icon } from "@/components/Icons";
import {
  Button,
  CopyButton,
  Field,
  Input,
  Note,
  ResultCard,
  Segmented,
  Select,
  StatTile,
  Toggle,
  Workspace,
} from "@/components/ui";
import { downloadDataUrl } from "@/lib/utils";

/* ----------------------------- Wi-Fi QR code ------------------------------- */

type WifiSecurity = "WPA" | "WEP" | "nopass";
type WifiMode = "wifi" | "join";

export function WifiQrGenerator() {
  const [ssid, setSsid] = useState("Toolora Guest");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<WifiSecurity>("WPA");
  const [hidden, setHidden] = useState(false);
  const [mode, setMode] = useState<WifiMode>("wifi");
  const [size, setSize] = useState("512");
  const [showPassword, setShowPassword] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCode, setHasCode] = useState(false);

  const payload = useMemo(() => {
    const escape = (value: string) => value.replace(/([\\;,:"])/g, "\\$1");
    if (mode === "join") {
      return `https://toolora.com/tools/wifi-qr-code-generator?ssid=${encodeURIComponent(ssid)}`;
    }
    if (!ssid.trim()) return "";
    const parts = [`WIFI:T:${security};S:${escape(ssid.trim())};`];
    if (security !== "nopass" && password) parts.push(`P:${escape(password)};`);
    if (hidden) parts.push("H:true;");
    parts.push(";");
    return parts.join("");
  }, [ssid, password, security, hidden, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!payload) {
      setHasCode(false);
      const context = canvas.getContext("2d");
      if (context) context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      try {
        QRCode.toCanvas(canvas, payload, {
          width: Number(size),
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#0B0D11", light: "#FFFFFF" },
        }, (error) => {
          if (!cancelled) setHasCode(!error);
        });
      } catch {
        setHasCode(false);
      }
    }, 160);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [payload, size]);

  return (
    <Workspace slug="wifi-qr-code-generator">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Segmented
            label="QR purpose"
            value={mode}
            onChange={setMode}
            options={[
              { value: "wifi", label: "Wi-Fi network" },
              { value: "join", label: "Share this tool" },
            ]}
            className="sm:max-w-sm"
          />

          <Field label="Network name (SSID)" htmlFor="wifi-ssid">
            <Input id="wifi-ssid" value={ssid} onChange={(event) => setSsid(event.target.value)} maxLength={32} placeholder="MyWiFi" className="font-mono" />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Security" htmlFor="wifi-security">
              <Select
                id="wifi-security"
                value={security}
                onChange={(event) => setSecurity(event.target.value as WifiSecurity)}
                options={[
                  { value: "WPA", label: "WPA / WPA2 / WPA3" },
                  { value: "WEP", label: "WEP (legacy)" },
                  { value: "nopass", label: "Open — no password" },
                ]}
              />
            </Field>
            <Field label="Size" htmlFor="wifi-size">
              <Select
                id="wifi-size"
                value={size}
                onChange={(event) => setSize(event.target.value)}
                options={[
                  { value: "256", label: "256 × 256 px" },
                  { value: "512", label: "512 × 512 px" },
                  { value: "1024", label: "1024 × 1024 px" },
                ]}
              />
            </Field>
          </div>

          {security !== "nopass" && (
            <Field label="Password" htmlFor="wifi-password" hint="case-sensitive">
              <div className="flex gap-2">
                <Input id="wifi-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="off" placeholder="Network password" className="font-mono" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-mist-300">
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </Field>
          )}

          <Toggle label="Hidden network" description="Include the hidden SSID flag in the QR payload" checked={hidden} onChange={setHidden} />

          <Note tone="warn" title="The password is inside the QR code">
            Anyone who scans this code can join the network. The password is only written into the
            image locally — Toolora never receives it — but the downloaded PNG contains it in a
            scannable form. Don't publish it publicly or use it for a sensitive network without
            changing the password afterwards.
          </Note>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                const canvas = canvasRef.current;
                if (canvas && hasCode) downloadDataUrl(canvas.toDataURL("image/png"), "toolora-wifi-qr.png");
              }}
              disabled={!hasCode}
            >
              <Icon name="download" size={15} /> Download QR PNG
            </Button>
            <CopyButton value={mode === "wifi" ? (hasCode ? ssid : "") : payload} label="Copy network details" copiedLabel="Copied" />
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-ink-950/50 p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">Encoded payload</p>
            <code className="mt-1 break-all font-mono text-[10.5px] text-mist-400">
              {mode === "wifi"
                ? `WIFI:T:${security};S:${ssid};${security !== "nopass" && password ? "P:••••••;" : ""}${hidden ? "H:true;" : ""};`
                : payload}
            </code>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="grid w-full place-items-center rounded-2xl border border-white/[0.08] bg-[repeating-conic-gradient(#12161c_0%_25%,#0d1116_0%_50%)] bg-[length:18px_18px] p-4">
            <div className="grid size-[236px] max-w-full place-items-center rounded-xl bg-white p-3">
              <canvas ref={canvasRef} role="img" aria-label="Wi-Fi QR code preview" className="h-auto w-full max-w-[212px]" />
              {!hasCode && <p className="py-10 text-center text-[11px] text-ink-600">Enter a network name</p>}
            </div>
          </div>
          <p className="text-center text-[11px] leading-relaxed text-mist-500">
            Scan with a phone camera to join. Test it before printing and displaying it.
          </p>
        </div>
      </div>
    </Workspace>
  );
}

/* ----------------------------- HTTP status codes --------------------------- */

type StatusEntry = { code: number; name: string; summary: string; category: string };

const STATUS_CODES: StatusEntry[] = [
  { code: 100, name: "Continue", summary: "The server received the request headers and the client should proceed with the body.", category: "Informational" },
  { code: 101, name: "Switching Protocols", summary: "The server is switching protocols as requested, commonly to WebSocket.", category: "Informational" },
  { code: 200, name: "OK", summary: "The request succeeded and the response contains the result.", category: "Success" },
  { code: 201, name: "Created", summary: "A new resource was created, often after a POST request.", category: "Success" },
  { code: 202, name: "Accepted", summary: "The request was accepted for processing but is not complete yet.", category: "Success" },
  { code: 204, name: "No Content", summary: "The request succeeded and there is intentionally no response body.", category: "Success" },
  { code: 206, name: "Partial Content", summary: "Only part of the resource is returned, used for ranged downloads.", category: "Success" },
  { code: 301, name: "Moved Permanently", summary: "The resource has a new permanent URL. Search engines transfer signals.", category: "Redirect" },
  { code: 302, name: "Found", summary: "A temporary redirect. Method changes to GET are common.", category: "Redirect" },
  { code: 304, name: "Not Modified", summary: "The cached copy is still valid; no body is sent.", category: "Redirect" },
  { code: 307, name: "Temporary Redirect", summary: "Temporary redirect that preserves the request method.", category: "Redirect" },
  { code: 308, name: "Permanent Redirect", summary: "Permanent redirect that preserves the request method.", category: "Redirect" },
  { code: 400, name: "Bad Request", summary: "The server cannot process the request because of client-side syntax or validation errors.", category: "Client error" },
  { code: 401, name: "Unauthorized", summary: "Authentication is required, or the supplied credentials are invalid.", category: "Client error" },
  { code: 403, name: "Forbidden", summary: "The server understands the request but refuses to authorise it.", category: "Client error" },
  { code: 404, name: "Not Found", summary: "The requested resource does not exist or is deliberately hidden.", category: "Client error" },
  { code: 405, name: "Method Not Allowed", summary: "The HTTP method is not supported for this resource.", category: "Client error" },
  { code: 408, name: "Request Timeout", summary: "The client took too long to send the request.", category: "Client error" },
  { code: 409, name: "Conflict", summary: "The request conflicts with the current state of the resource.", category: "Client error" },
  { code: 410, name: "Gone", summary: "The resource was permanently removed and no forwarding address exists.", category: "Client error" },
  { code: 413, name: "Content Too Large", summary: "The request body exceeds the server's limit.", category: "Client error" },
  { code: 415, name: "Unsupported Media Type", summary: "The request body format is not supported by the server.", category: "Client error" },
  { code: 422, name: "Unprocessable Content", summary: "The request is syntactically valid but fails semantic validation.", category: "Client error" },
  { code: 429, name: "Too Many Requests", summary: "The client has been rate limited and should retry later.", category: "Client error" },
  { code: 500, name: "Internal Server Error", summary: "The server encountered an unexpected condition.", category: "Server error" },
  { code: 501, name: "Not Implemented", summary: "The server does not support the request method or feature.", category: "Server error" },
  { code: 502, name: "Bad Gateway", summary: "An upstream server returned an invalid response.", category: "Server error" },
  { code: 503, name: "Service Unavailable", summary: "The server is overloaded or down for maintenance.", category: "Server error" },
  { code: 504, name: "Gateway Timeout", summary: "An upstream server did not respond in time.", category: "Server error" },
];

export function HttpStatusLookup() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return STATUS_CODES.filter((entry) => {
      if (category !== "all" && entry.category !== category) return false;
      if (!normalized) return true;
      return `${entry.code} ${entry.name} ${entry.summary} ${entry.category}`.toLowerCase().includes(normalized);
    });
  }, [query, category]);

  return (
    <Workspace slug="http-status-code-lookup">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <Field label="Search" htmlFor="status-search" hint="code, name or meaning">
            <Input id="status-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. 404, redirect, timeout" className="font-mono" />
          </Field>
          <Field label="Category" htmlFor="status-category">
            <Select
              id="status-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              options={[
                { value: "all", label: "All categories" },
                { value: "Informational", label: "1xx · Informational" },
                { value: "Success", label: "2xx · Success" },
                { value: "Redirect", label: "3xx · Redirect" },
                { value: "Client error", label: "4xx · Client error" },
                { value: "Server error", label: "5xx · Server error" },
              ]}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[200, 301, 401, 403, 404, 429, 500, 503].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => { setQuery(String(code)); setCategory("all"); }}
              className="rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-1.5 font-mono text-[11px] text-mist-400 transition hover:border-brand-400/30 hover:text-brand-200"
            >
              {code}
            </button>
          ))}
        </div>

        {results.length === 0 ? (
          <Note tone="info">No status code in this reference matches “{query}”. The list covers common codes; vendor-specific codes (such as Cloudflare 52x) are not standardised here.</Note>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.07]">
            {results.map((entry) => (
              <div key={entry.code} className="border-b border-white/[0.05] px-3.5 py-3 last:border-b-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-brand-400/25 bg-brand-400/10 px-2 py-0.5 font-mono text-[12px] font-semibold text-brand-200">{entry.code}</span>
                  <span className="text-[13px] font-semibold text-mist-100">{entry.name}</span>
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">{entry.category}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-mist-400">{entry.summary}</p>
                <CopyButton value={`${entry.code} ${entry.name}`} label="Copy" copiedLabel="Copied" variant="ghost" size="sm" className="mt-2" />
              </div>
            ))}
          </div>
        )}

        <Note tone="info">
          These are standard HTTP status codes defined by RFC 9110 and related specifications. API
          providers often add vendor-specific codes, so check their documentation for those.
        </Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------ user agent parser -------------------------- */

const BROWSER_RULES: [string, RegExp][] = [
  ["Edge", /Edg(?:e|A|iOS)?\/([\d.]+)/i],
  ["Opera", /(?:OPR|Opera)\/([\d.]+)/i],
  ["Samsung Internet", /SamsungBrowser\/([\d.]+)/i],
  ["Firefox", /(?:Firefox|FxiOS)\/([\d.]+)/i],
  ["Chrome", /(?:Chrome|CriOS)\/([\d.]+)/i],
  ["Safari", /Version\/([\d.]+).*Safari/i],
  ["Internet Explorer", /(?:MSIE |Trident\/.*rv:)([\d.]+)/i],
  ["curl", /curl\/([\d.]+)/i],
  ["Python requests", /python-requests\/([\d.]+)/i],
  ["Googlebot", /Googlebot\/([\d.]+)/i],
];

function parseUserAgent(ua: string) {
  const browser = BROWSER_RULES.map(([name, regex]) => {
    const match = regex.exec(ua);
    return match ? { name, version: match[1] } : null;
  }).find(Boolean) ?? { name: "Unknown browser", version: "" };

  let os = "Unknown operating system";
  const osMatch =
    /Windows NT 10\.0/.test(ua) ? "Windows 10 / 11"
    : /Windows NT 6\.3/.test(ua) ? "Windows 8.1"
    : /Windows NT 6\.1/.test(ua) ? "Windows 7"
    : /Windows Phone/.test(ua) ? "Windows Phone"
    : /iPhone|iPad|iPod/.test(ua) ? "iOS / iPadOS"
    : /Mac OS X ([\d_.]+)/.exec(ua) ? `macOS ${/Mac OS X ([\d_.]+)/.exec(ua)![1].replace(/_/g, ".")}`
    : /Android ([\d.]+)/.exec(ua) ? `Android ${/Android ([\d.]+)/.exec(ua)![1]}`
    : /CrOS/.test(ua) ? "ChromeOS"
    : /Linux/.test(ua) ? "Linux"
    : "Unknown operating system";
  os = osMatch;

  const device = /iPad/.test(ua) ? "Tablet (iPad)"
    : /Tablet|PlayBook|Silk/.test(ua) ? "Tablet"
    : /Mobile|iPhone|iPod|Android.*Mobile/.test(ua) ? "Mobile"
    : /Android/.test(ua) ? "Tablet / mobile (Android)"
    : "Desktop";

  const engine = /Gecko\/|Firefox/.test(ua) && !/Chrome/.test(ua) ? "Gecko"
    : /AppleWebKit/.test(ua) ? "WebKit / Blink"
    : /Trident/.test(ua) ? "Trident"
    : "Unknown";

  const bot = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|curl|python-requests/i.exec(ua)?.[0];
  return { browser, os, device, engine, bot };
}

export function UserAgentParser() {
  const [ua, setUa] = useState("");

  useEffect(() => {
    setUa(navigator.userAgent);
  }, []);

  const parsed = useMemo(() => (ua.trim() ? parseUserAgent(ua) : null), [ua]);

  return (
    <Workspace slug="user-agent-parser">
      <div className="space-y-5">
        <Field label="User-Agent string" htmlFor="ua-input" hint="paste a string or use this browser's">
          <textarea id="ua-input" value={ua} onChange={(event) => setUa(event.target.value)} rows={4} spellCheck={false} className="field-input resize-y font-mono text-[11.5px] leading-relaxed" />
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setUa(navigator.userAgent)}>
            <Icon name="refresh" size={13} /> Use this browser
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setUa("Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1")}>
            iPhone example
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setUa("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")}>
            Googlebot example
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setUa("")} disabled={!ua}>
            <Icon name="trash" size={13} /> Clear
          </Button>
        </div>

        {parsed ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Browser" value={parsed.browser.version ? `${parsed.browser.name} ${parsed.browser.version}` : parsed.browser.name} />
              <StatTile label="Operating system" value={parsed.os} />
              <StatTile label="Device class" value={parsed.device} />
              <StatTile label="Engine" value={parsed.engine} />
            </div>
            {parsed.bot && <StatTile label="Automation / crawler detected" value={<span className="text-[12px]">{parsed.bot}</span>} hint="This string identifies a bot or script client" />}
            <div className="rounded-xl border border-white/[0.07] bg-ink-950/50 p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">Raw string</p>
              <code className="mt-1 block break-all font-mono text-[10.5px] text-mist-400">{ua}</code>
            </div>
            <CopyButton value={`${parsed.browser.name} ${parsed.browser.version} on ${parsed.os}; device: ${parsed.device}; engine: ${parsed.engine}`} label="Copy parsed summary" copiedLabel="Copied" />
          </>
        ) : (
          <Note tone="info">Enter a User-Agent string to identify the browser, operating system and rough device class.</Note>
        )}

        <Note tone="warn" title="User-Agent strings are unreliable and privacy-sensitive">
          Browsers can be told to send almost any string, and privacy tools deliberately reduce the
          detail. This parser is a convenience, not proof of identity or a security control. Treat a
          User-Agent as attributable data when logging it: don't store it longer than needed, and
          never use it to fingerprint visitors without a lawful basis and clear notice.
        </Note>
      </div>
    </Workspace>
  );
}

/* ------------------------------ IP address info ---------------------------- */

type IpAnalysis = {
  address: string;
  version: 4 | 6;
  scope: "private" | "public" | "loopback" | "link-local" | "multicast" | "reserved" | "documentation";
  description: string;
};

function analyzeIp(raw: string): IpAnalysis | { error: string } {
  const value = raw.trim();
  if (!value) return { error: "Enter an IP address to analyse." };

  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(value);
  if (v4) {
    const octets = v4.slice(1).map(Number);
    if (octets.some((octet) => octet > 255)) return { error: "IPv4 octets must be between 0 and 255." };
    const [a, b] = octets;
    let scope: IpAnalysis["scope"] = "public";
    let description = "Publicly routable IPv4 address (according to the standard reserved ranges).";
    if (a === 10) { scope = "private"; description = "Private network (RFC 1918, 10.0.0.0/8). Not reachable from the internet."; }
    else if (a === 172 && b >= 16 && b <= 31) { scope = "private"; description = "Private network (RFC 1918, 172.16.0.0/12)."; }
    else if (a === 192 && b === 168) { scope = "private"; description = "Private network (RFC 1918, 192.168.0.0/16)."; }
    else if (a === 127) { scope = "loopback"; description = "Loopback address: refers to this device (127.0.0.0/8)."; }
    else if (a === 169 && b === 254) { scope = "link-local"; description = "Link-local address (APIPA), used when DHCP is unavailable."; }
    else if (a === 0) { scope = "reserved"; description = "“This network”, reserved and not a usable host address in normal traffic."; }
    else if (a >= 224 && a <= 239) { scope = "multicast"; description = "IPv4 multicast address (224.0.0.0/4)."; }
    else if (a === 240 || a === 255) { scope = "reserved"; description = "Reserved or broadcast address range."; }
    else if (a === 192 && b === 0 && octets[2] === 2) { scope = "documentation"; description = "Documentation range (192.0.2.0/24), used in examples."; }
    else if (a === 198 && b === 51 && octets[2] === 100) { scope = "documentation"; description = "Documentation range (198.51.100.0/24), used in examples."; }
    else if (a === 203 && b === 0 && octets[2] === 113) { scope = "documentation"; description = "Documentation range (203.0.113.0/24), used in examples."; }
    else if (a === 100 && b >= 64 && b <= 127) { scope = "reserved"; description = "Shared address space (100.64.0.0/10), often used by carrier NAT."; }
    return { address: octets.join("."), version: 4, scope, description };
  }

  if (/^[0-9a-f:.]+$/i.test(value) && value.includes(":")) {
    const compressed = value.includes("::");
    const groups = value.split(":");
    if (value.split("::").length > 2) return { error: "An IPv6 address can contain only one “::” compression." };
    if (!compressed && groups.length !== 8) return { error: "A full IPv6 address has eight groups of hexadecimal digits." };
    const lower = value.toLowerCase();
    const isIpv6 = /^[0-9a-f:]+$/.test(lower);
    if (!isIpv6) return { error: "That doesn't look like a valid IPv4 or IPv6 address." };
    let scope: IpAnalysis["scope"] = "public";
    let description = "Global unicast IPv6 address, routable when the network supports it.";
    if (lower === "::1") { scope = "loopback"; description = "IPv6 loopback address: this device."; }
    else if (lower === "::") { scope = "reserved"; description = "Unspecified address, not a host address."; }
    else if (/^fe80:/.test(lower)) { scope = "link-local"; description = "IPv6 link-local address (fe80::/10), valid only on one link."; }
    else if (/^f[cd]/.test(lower)) { scope = "private"; description = "IPv6 unique local address (fc00::/7), similar in purpose to private IPv4."; }
    else if (/^ff/.test(lower)) { scope = "multicast"; description = "IPv6 multicast address (ff00::/8)."; }
    else if (/^2001:db8/.test(lower)) { scope = "documentation"; description = "Documentation range (2001:db8::/32), used in examples."; }
    return { address: value, version: 6, scope, description };
  }

  return { error: "That doesn't look like a valid IPv4 or IPv6 address. Examples: 192.168.1.1 or 2001:db8::1." };
}

export function IpAddressInfo() {
  const [input, setInput] = useState("");
  const [lookup, setLookup] = useState<null | { loading: boolean; data?: Record<string, unknown>; error?: string }>(null);
  const analysis = input.trim() ? analyzeIp(input) : null;

  async function externalLookup() {
    if (!analysis || "error" in analysis) return;
    setLookup({ loading: true });
    try {
      const response = await fetch(`https://ipapi.co/${encodeURIComponent(analysis.address)}/json/`);
      if (!response.ok) throw new Error(`The lookup service returned HTTP ${response.status}.`);
      const data = (await response.json()) as Record<string, unknown>;
      if (data.error) throw new Error(String(data.reason ?? "The lookup service rejected this address."));
      setLookup({ loading: false, data });
    } catch (error) {
      setLookup({ loading: false, error: error instanceof Error ? error.message : "Lookup failed." });
    }
  }

  const fields = lookup?.data
    ? [
        ["City", lookup.data.city],
        ["Region", lookup.data.region],
        ["Country", lookup.data.country_name],
        ["Postal code", lookup.data.postal],
        ["Organisation", lookup.data.org],
        ["Timezone", lookup.data.timezone],
        ["Latitude", lookup.data.latitude],
        ["Longitude", lookup.data.longitude],
      ].filter(([, value]) => value !== undefined && value !== null && value !== "")
    : [];

  return (
    <Workspace slug="ip-address-lookup">
      <div className="space-y-5">
        <Field label="IP address" htmlFor="ip-input" hint="IPv4 or IPv6">
          <Input id="ip-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="e.g. 192.168.1.1 or 2001:db8::1" className="font-mono" />
        </Field>

        <div className="flex flex-wrap gap-1.5">
          {["8.8.8.8", "192.168.1.10", "10.0.0.5", "127.0.0.1", "2001:4860:4860::8888"].map((sample) => (
            <button key={sample} type="button" onClick={() => { setInput(sample); setLookup(null); }} className="rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-1.5 font-mono text-[10.5px] text-mist-400 transition hover:border-brand-400/30 hover:text-brand-200">
              {sample}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setInput(""); setLookup(null); }} disabled={!input}>
            <Icon name="trash" size={13} /> Clear
          </Button>
        </div>

        {!analysis ? (
          <Note tone="info">
            Offline analysis identifies address type, private/reserved ranges and IPv4/IPv6 scope.
            Nothing is sent anywhere for this step.
          </Note>
        ) : "error" in analysis ? (
          <Note tone="warn">{analysis.error}</Note>
        ) : (
          <>
            <ResultCard
              label={`${analysis.version === 4 ? "IPv4" : "IPv6"} address`}
              value={analysis.address}
              hint={analysis.description}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Version" value={`IPv${analysis.version}`} />
              <StatTile label="Scope" value={analysis.scope.replace("-", " ")} />
              <StatTile label="Routable" value={analysis.scope === "public" ? "Likely public" : "Not public"} />
              <StatTile label="Analysis" value="Offline" hint="no network request" />
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] font-semibold text-mist-200">Geolocation (optional, third-party)</p>
                <Button variant="secondary" size="sm" onClick={() => void externalLookup()} disabled={lookup?.loading}>
                  <Icon name={lookup?.loading ? "refresh" : "globe"} size={13} className={lookup?.loading ? "animate-spin" : ""} />
                  {lookup?.loading ? "Looking up…" : "Look up publicly"}
                </Button>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-mist-500">
                Pressing the button sends the IP address you entered to{" "}
                <a href="https://ipapi.co/" target="_blank" rel="noopener noreferrer" className="text-brand-200 underline decoration-brand-400/30 underline-offset-2">ipapi.co</a>,
                a third-party service with its own privacy policy. Toolora does not receive or store the
                result. Look up only addresses you are entitled to query, and be aware that your own IP
                and request metadata are visible to that provider.
              </p>
              {lookup?.error && <Note tone="warn" className="mt-2">{lookup.error}</Note>}
              {fields.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {fields.map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2">
                      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist-500">{String(label)}</p>
                      <p className="mt-0.5 break-words font-mono text-[11.5px] text-mist-200">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <CopyButton value={`${analysis.address} — IPv${analysis.version}, scope: ${analysis.scope}. ${analysis.description}`} label="Copy analysis" copiedLabel="Copied" />
          </>
        )}

        <Note tone="warn" title="IP geolocation is approximate">
          Addresses are allocated in blocks, so geolocation often points to a city or region rather than
          a precise location, and VPNs, mobile networks and CGNAT can make it inaccurate. Never use this
          to identify a person. For your own connection, the address this page sees is the one your
          network sends — we do not fetch or display it automatically.
        </Note>
      </div>
    </Workspace>
  );
}
