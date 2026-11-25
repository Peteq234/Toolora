import type { ReactNode } from "react";
import { Link } from "@/lib/router";
import { useSeo } from "@/lib/seo";
import { Icon } from "@/components/Icons";
import { Breadcrumbs, Container, Eyebrow } from "@/components/ui";

type PolicySection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  extra?: ReactNode;
};

function PolicyLayout({
  label,
  title,
  updated,
  intro,
  sections,
}: {
  label: string;
  title: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
}) {
  return (
    <Container className="pb-20 pt-7 sm:pt-9">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />

      <header className="animate-fade-up max-w-3xl">
        <Eyebrow>{label}</Eyebrow>
        <h1 className="mt-3 text-[32px] font-semibold leading-[1.04] tracking-[-0.04em] text-mist-50 sm:text-[42px]">
          {title}
        </h1>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-mist-500">
          Last updated {updated}
        </p>
        <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-mist-400">{intro}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-[86px]">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
              On this page
            </p>
            <nav aria-label="Policy contents" className="mt-3 space-y-0.5">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-[11.5px] leading-snug text-mist-500 transition hover:bg-white/[0.04] hover:text-mist-100"
                >
                  <span className="font-mono text-[9px] text-mist-600">{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="min-w-0 max-w-3xl space-y-8">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-[19px] font-semibold leading-snug tracking-[-0.015em] text-mist-50">
                <span className="mr-2 font-mono text-[11px] font-normal text-brand-300/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              <div className="mt-2.5 space-y-2.5">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[13px] leading-[1.8] text-mist-400">
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2 text-[12.5px] leading-relaxed text-mist-400">
                        <Icon name="check" size={13} className="mt-1 shrink-0 text-brand-300/70" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.extra}
              </div>
            </section>
          ))}

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[12.5px] font-semibold text-mist-100">Questions about this document?</p>
            <p className="mt-1 text-[12px] leading-relaxed text-mist-500">
              Email{" "}
              <a
                href="mailto:hello@toolsy.com"
                className="inline-flex min-h-8 items-center text-brand-200 underline decoration-brand-400/30 underline-offset-2"
              >
                hello@toolsy.com
              </a>{" "}
              or use the{" "}
              <Link href="/contact" className="inline-flex min-h-8 items-center text-brand-200 underline decoration-brand-400/30 underline-offset-2">
                contact form
              </Link>
              . This page describes the current behaviour of toolsy.com and is not legal advice for
              your own project.
            </p>
          </div>
        </article>
      </div>
    </Container>
  );
}

/* -------------------------------- privacy --------------------------------- */

const PRIVACY_SECTIONS: PolicySection[] = [
  {
    id: "short-version",
    title: "The short version",
    body: [
      "Toolsy is a free toolkit that runs most processing in your browser. You don't need an account, and we don't receive the content you type into the tools. The favorites feature stores tool names in your browser's local storage. The main information we receive is what you choose to send us by email.",
      "We do not currently run analytics or advertising scripts. If that changes, this policy will be updated and any legally required consent mechanism will be added before those services are enabled.",
    ],
    bullets: [
      "Tool inputs are processed locally, not sent to a Toolsy server.",
      "Favorites are stored in your browser, not in a user account.",
      "We don't sell personal information.",
      "No advertising is running on the site today.",
    ],
  },
  {
    id: "controller",
    title: "Who operates Toolsy",
    body: [
      "Toolsy is an independent website available at toolsy.com. In this policy, “Toolsy”, “we” and “us” refer to the operator of this site. Privacy questions, access requests or deletion requests can be sent to hello@toolsy.com.",
    ],
  },
  {
    id: "tool-inputs",
    title: "What you enter into the tools",
    body: [
      "Generated passwords, pasted text, QR code content, numbers, measurements and dates are handled in your browser. There is no application endpoint that receives this data, no account history, and no server-side storage of tool inputs.",
      "The password generator uses the browser's Web Crypto API. The timer can use the Web Audio API to play a local alert. The internet speed guide can read the Network Information API where your browser exposes it. The image compressor reads your chosen file and re-encodes it with an in-browser canvas; Markdown drafts, JSON, regex tests, diffs and other text inputs are processed in page memory. These are browser capabilities, not requests to Toolsy.",
      "Copy buttons write to your clipboard only when you activate them. If a tool can download a file, the file is created locally in your browser.",
    ],
  },
  {
    id: "favorites",
    title: "Favorites, recent tools and local storage",
    body: [
      "When you star a tool, Toolsy saves its identifier in a browser-localStorage key reserved for favorite tools. When you open a tool, its identifier is also recorded in a separate localStorage key so the recently used shortcut stays useful. Both lists are limited in size and remain on your device; they are not transmitted to us and are not accessible across different browsers or devices.",
      "You can remove favorites using the star controls or the “Clear all” button on the favorites page, and clear the recent list with “Clear history”. Clearing site data in your browser also removes both lists. Toolsy cannot restore them because we never receive a copy.",
    ],
  },
  {
    id: "contact-information",
    title: "Information you send us",
    body: [
      "The contact form prepares an email draft in your email application. When you send that email, we receive your name, email address, the topic and your message. We use that information only to reply and to deal with the request.",
      "Contact emails may be retained for as long as needed to handle the conversation, resolve a dispute or meet a legal obligation. We don't add contact addresses to a marketing list, and there is currently no newsletter.",
      "Please do not send passwords, private keys or other secrets. Email is not a secure vault, and no tool support question requires a real password.",
    ],
  },
  {
    id: "hosting-data",
    title: "Hosting and technical data",
    body: [
      "The site is delivered by a hosting or content delivery provider. Like most providers, they may automatically process technical data such as your IP address, browser and device type, requested URL and timestamps in order to deliver content, prevent abuse and maintain service security.",
      "Web fonts are currently requested from Google Fonts, which receives your IP address and browser information when the font files are loaded. The site remains usable with fallback fonts if that request is blocked. We may self-host the fonts in a future update to reduce third-party requests.",
      "We do not maintain a separate visitor profile or cross-site tracking database. Server log retention is controlled by the hosting arrangement and the provider's own policies.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    body: [
      "At the time of writing, Toolsy does not set analytics cookies or advertising cookies. The favorites feature uses localStorage, which is technically different from a cookie and does not send data with every request.",
      "If we introduce a service that requires cookies, this policy will identify the provider, the purpose and the choices available to you. Where consent is required by law, it will be requested before non-essential cookies are set.",
    ],
  },
  {
    id: "advertising",
    title: "Future advertising (including Google AdSense)",
    body: [
      "Toolsy may apply for advertising programmes such as Google AdSense and display clearly labelled ads on the site. Advertising is not active today. No ad network script is currently running and no ad slots contain fabricated advertisements.",
      "If advertising is enabled, Google and its partners may use cookies or similar technologies to serve ads based on previous visits to this or other websites. Google's own privacy policy explains how Google uses information from sites that use its services. You can review and adjust Google ad personalisation in Google's Ads Settings, and opt out of some third-party vendors' personalised advertising via industry opt-out pages such as aboutads.info.",
      "We intend to keep ad placements clearly labelled and separate from tool controls. We will not place ads that imitate results, downloads or navigation.",
    ],
    extra: (
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px]">
        <li>
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1 text-brand-200 underline decoration-brand-400/30 underline-offset-2"
          >
            Google privacy policy
            <Icon name="external" size={11} />
          </a>
        </li>
        <li>
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1 text-brand-200 underline decoration-brand-400/30 underline-offset-2"
          >
            How Google uses advertising data
            <Icon name="external" size={11} />
          </a>
        </li>
        <li>
          <a
            href="https://optout.aboutads.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1 text-brand-200 underline decoration-brand-400/30 underline-offset-2"
          >
            Ad industry opt-out
            <Icon name="external" size={11} />
          </a>
        </li>
      </ul>
    ),
  },
  {
    id: "affiliates",
    title: "Affiliate links",
    body: [
      "Some future links may be affiliate links, meaning Toolsy could receive a commission if you buy through them, at no additional cost to you. Affiliate relationships will be disclosed near the link and will not change the editorial content of a tool or calculator.",
      "No affiliate links are currently placed in tool results, and nothing in a free tool requires a purchase.",
    ],
  },
  {
    id: "third-parties",
    title: "Third-party links",
    body: [
      "Some pages link to external resources, such as independent internet speed-test providers. Those sites have their own privacy policies and may collect data when you visit them. A link is not an endorsement of every practice on the destination site.",
    ],
  },
  {
    id: "children",
    title: "Children's privacy",
    body: [
      "Toolsy is a general-audience utility site and is not directed at children. We do not knowingly collect personal information from children, and there are no accounts or profiles. If you believe a child has sent us personal information by email, contact us and we will delete it where appropriate.",
    ],
  },
  {
    id: "rights",
    title: "Your choices and rights",
    body: [
      "Depending on where you live, you may have rights to access, correct, delete or restrict the personal information we hold, or to object to certain processing. The only routine personal information we hold is correspondence you send us.",
      "To make a request, email hello@toolsy.com from the address you used to contact us, or identify the relevant email. We may need to verify that the request relates to you. You also have the right to complain to your local data-protection authority.",
      "Local data such as favorites is under your direct control: clear it in your browser at any time.",
    ],
  },
  {
    id: "security",
    title: "Security",
    body: [
      "The site is served over HTTPS. Tool secrets are not transmitted to us because generation happens in your browser. No system is perfectly secure, however, and email in transit is not end-to-end encrypted, so please avoid sending sensitive information by email.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: [
      "We may update this policy when the site changes — for example, if advertising is enabled or a new feature stores different data. The “last updated” date at the top of this page will change. Significant changes will be described clearly where practical.",
    ],
  },
  {
    id: "privacy-contact",
    title: "Contact",
    body: [
      "Privacy questions and requests can be sent to hello@toolsy.com. Please include “Privacy” in the subject line so the message is routed correctly. You can also use the contact page and select the privacy topic.",
    ],
  },
];

export function PrivacyPage() {
  useSeo({
    title: "Privacy Policy — Toolsy",
    description:
      "How Toolsy handles data: local tool processing, browser-stored favorites, contact emails, hosting logs, and our approach to future advertising and cookies.",
    path: "/privacy",
    schema: {
      "@type": "WebPage",
      name: "Privacy Policy",
      url: "https://toolsy.com/privacy",
      description:
        "Toolsy's privacy policy covering local tool processing, local favorites, contact correspondence and future advertising.",
      isPartOf: { "@type": "WebSite", name: "Toolsy", url: "https://toolsy.com" },
    },
  });

  return (
    <PolicyLayout
      label="Legal · privacy"
      title="Privacy Policy"
      updated="12 February 2026"
      intro="Toolsy is built around a simple idea: a useful tool shouldn't require you to hand over more data than necessary. This page explains exactly what stays on your device, what we receive, and what changes if advertising is enabled."
      sections={PRIVACY_SECTIONS}
    />
  );
}

/* ---------------------------------- terms --------------------------------- */

const TERMS_SECTIONS: PolicySection[] = [
  {
    id: "terms-acceptance",
    title: "Agreement to these terms",
    body: [
      "By accessing or using toolsy.com, you agree to these terms of use and to the privacy policy. If you do not agree, please do not use the site. If you use Toolsy on behalf of an organisation, you confirm that you have authority to accept these terms for that organisation.",
    ],
  },
  {
    id: "service",
    title: "The service",
    body: [
      "Toolsy provides free, browser-based utilities including text tools, generators, calculators, converters, timers and informational guides. They are provided as a convenience and for general information.",
      "The service is offered free of charge and without an account. We do not guarantee that any particular tool will remain available, that the catalogue will not change, or that the site will always be uninterrupted or error-free.",
    ],
  },
  {
    id: "not-professional-advice",
    title: "No professional advice",
    body: [
      "Results from BMI, age, percentage, unit conversion, PC bottleneck and internet speed tools are informational. They are not medical, legal, financial, engineering or professional advice, and they are not a diagnosis or a recommendation.",
      "The PC bottleneck tool is a rough, tier-based heuristic that does not measure your hardware and does not predict frame rates. The internet speed guide does not perform a speed test. Unit conversions and calculations can involve rounding. Verify important results independently before acting on them.",
    ],
    bullets: [
      "BMI is a screening indicator only and is not valid during pregnancy; interpretations differ for children, older adults and some ethnic groups.",
      "Unit conversions should be checked against a calibrated reference where engineering tolerances apply.",
      "Hardware and internet decisions should be based on independent benchmarks and measurements for your exact situation.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: [
      "You may use Toolsy for personal, educational and commercial tasks, subject to these terms. You may not use the site in a way that is unlawful, harmful or that interferes with other people's use of it.",
    ],
    bullets: [
      "Do not use the QR code generator to distribute malware, phishing links or fraudulent material.",
      "Do not attempt to disrupt, overload or gain unauthorised access to the site or its hosting infrastructure.",
      "Do not scrape the site at a volume that degrades service, or resell the toolkit wholesale as your own product.",
      "Do not use the tools to violate privacy, intellectual-property or other applicable laws.",
    ],
  },
  {
    id: "your-inputs",
    title: "Your inputs and outputs",
    body: [
      "You keep whatever rights you have in the text, data and other content you enter into the tools. Because processing happens locally, Toolsy does not claim a licence to your inputs.",
      "You are responsible for the content you generate, download or distribute using the tools — including links or text encoded in a QR code — and for checking that you have the rights to use it. Outputs are provided without any warranty that they are fit for a particular purpose.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: [
      "The Toolsy name, logo, site design, written content and underlying code are protected by intellectual-property laws and remain the property of their respective owners. You receive a limited, revocable, non-exclusive licence to use the site for its intended purpose.",
      "You may link to Toolsy pages and share individual results. You may not copy substantial portions of the site, remove attribution, or present the site or its content as your own without permission, except where applicable law allows it.",
    ],
  },
  {
    id: "third-party",
    title: "Third-party links, advertising and affiliates",
    body: [
      "The site may link to third-party resources, including independent speed-test services. Those services are not controlled by Toolsy and we are not responsible for their content, availability, accuracy or practices. A link does not imply endorsement.",
      "Future advertising will be clearly labelled. Future affiliate links may earn Toolsy a commission at no extra cost to you. Sponsored or affiliate content will not be presented as a neutral tool result.",
    ],
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: [
      "We may add, modify, suspend or remove any tool, page or feature at any time. We may also update these terms. The version published on this page, with its last-updated date, is the current version. Continued use after a change means you accept the updated terms.",
    ],
  },
  {
    id: "disclaimer",
    title: "Disclaimer of warranties",
    body: [
      "To the maximum extent permitted by law, the site and its tools are provided “as is” and “as available”, without warranties of any kind, whether express or implied. This includes implied warranties of merchantability, fitness for a particular purpose, accuracy and non-infringement.",
      "We do not warrant that the site will be uninterrupted, secure or free from errors, or that any result will meet your requirements. Some jurisdictions do not allow certain exclusions, so parts of this section may not apply to you.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: [
      "To the maximum extent permitted by law, Toolsy and its operator will not be liable for indirect, incidental, special, consequential or punitive damages, or for loss of profits, data, goodwill or opportunity arising from the use of, or inability to use, the site.",
      "Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, including your mandatory consumer rights under applicable law.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: [
      "These terms are governed by the laws applicable in the operator's jurisdiction, without regard to conflict-of-law rules. Any dispute should first be raised with us so that we can try to resolve it informally. Mandatory protections available to you where you live are not affected by this clause.",
    ],
  },
  {
    id: "terms-contact",
    title: "Contact",
    body: [
      "Questions about these terms can be sent to hello@toolsy.com or through the contact page. Please include “Terms” in the subject line so the message is routed correctly.",
    ],
  },
];

export function TermsPage() {
  useSeo({
    title: "Terms of Use — Toolsy",
    description:
      "The terms for using Toolsy's free online tools, including acceptable use, no professional advice, approximate results, intellectual property and liability.",
    path: "/terms",
    schema: {
      "@type": "WebPage",
      name: "Terms of Use",
      url: "https://toolsy.com/terms",
      description:
        "Terms of use for Toolsy's free browser-based tools, including disclaimers and acceptable-use rules.",
      isPartOf: { "@type": "WebSite", name: "Toolsy", url: "https://toolsy.com" },
    },
  });

  return (
    <PolicyLayout
      label="Legal · terms"
      title="Terms of Use"
      updated="12 February 2026"
      intro="These terms explain what you can expect from Toolsy, what you can and can't do with the site, and the limits of the estimates it provides. Plain language is used where possible, but this is a legally oriented document."
      sections={TERMS_SECTIONS}
    />
  );
}
