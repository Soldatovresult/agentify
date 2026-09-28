/**
 * Plan and billing in the merchant cabinet.
 *
 * The accepted product decisions describe free pilot access today and only a
 * future trigger for paid access (ADR-0026). They do not choose a price, store a
 * plan, collect a platform payment or write an invoice. Live and test therefore
 * show only the factual pilot state.
 *
 * The sandbox is also Igor's review surface. Its switcher redraws the complete
 * page for each landing-page hypothesis. T1–T3 are platform pricing models;
 * T4–T6 are three price tests for one managed setup service and deliberately do
 * not masquerade as an ongoing plan.
 */

import { escaped, page } from "./html.js";
import type { Viewer } from "./screens.js";

export type TariffId = "t1" | "t2" | "t3" | "t4" | "t5" | "t6";

type Tariff = Readonly<{
  kind: "platform" | "setup";
  shortName: string;
  name: string;
  price: string;
  note: string;
  includes: readonly string[];
}>;

const PLATFORM = [
  "Catalog connection through WooCommerce or the SDK",
  "Product cards in the Agentify catalog",
  "Orders and receipts in your dashboard",
  "Payments straight to your wallet",
];

const AGENT_READY = [
  "A review of your store: what keeps AI agents from buying",
  "Fixes for what the review finds",
  "A catalog export for AI agents",
  "Connecting your store to Agentify",
  "A test purchase by our agent, with a report",
];

const TARIFFS: Readonly<Record<TariffId, Tariff>> = {
  t1: {
    kind: "platform",
    shortName: "Free",
    name: "Free",
    price: "$0",
    note: "No monthly fee and no commission on sales",
    includes: PLATFORM,
  },
  t2: {
    kind: "platform",
    shortName: "Per order",
    name: "Pay per order",
    price: "$0 + 1%",
    note: "Free to connect, 1% of every paid order",
    includes: PLATFORM,
  },
  t3: {
    kind: "platform",
    shortName: "Subscription",
    name: "Subscription",
    price: "$29 a month",
    note: "Starts on day one, cancel anytime",
    includes: [
      ...AGENT_READY,
      "Catalog updates",
      "Checks that the sales channel is working",
      "Orders in your dashboard",
    ],
  },
  t4: {
    kind: "setup",
    shortName: "Setup",
    name: "Getting ready for AI agent marketplaces",
    price: "$49",
    note: "One-time",
    includes: AGENT_READY,
  },
  t5: {
    kind: "setup",
    shortName: "Setup",
    name: "Getting ready for AI agent marketplaces",
    price: "$99",
    note: "One-time",
    includes: AGENT_READY,
  },
  t6: {
    kind: "setup",
    shortName: "Setup",
    name: "Getting ready for AI agent marketplaces",
    price: "$149",
    note: "One-time",
    includes: AGENT_READY,
  },
};

const IDS = Object.freeze(Object.keys(TARIFFS) as TariffId[]);

/** Query strings are untrusted and Express may parse one as a string array. */
export const pricingCandidateIn = (value: unknown): TariffId | null => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === "string" && IDS.includes(candidate as TariffId)
    ? (candidate as TariffId)
    : null;
};

/**
 * One candidate's shared commercial words. Kept for the landing parity test;
 * this is a preview, never evidence that the merchant owns this plan.
 */
export const tariffBlock = (shown: TariffId | null): string => {
  if (shown === null) return "";
  const tariff = TARIFFS[shown];
  return `<p class="tariff-name"><span>${escaped(tariff.name)}</span> · <b>${escaped(tariff.price)}</b></p>
  <p class="quiet">${escaped(tariff.note)}</p>
  <ul class="tariff-includes">${tariff.includes.map((line) => `<li>${escaped(line)}</li>`).join("")}</ul>`;
};

const status = (label: string, tone: "active" | "preview" = "preview"): string =>
  `<span class="plan-status plan-status--${tone}"><span class="dot"></span>${escaped(label)}</span>`;

const facts = (rows: readonly (readonly [string, string])[]): string =>
  `<dl class="billing-facts">${rows
    .map(([term, answer]) => `<div><dt>${escaped(term)}</dt><dd>${escaped(answer)}</dd></div>`)
    .join("")}</dl>`;

const pilotPage = (): string => `<div class="plan-grid">
  <section class="plan-card plan-primary">
    <div class="plan-card-head">
      <div><p class="eyebrow">Current access</p><h2>Pilot access</h2></div>
      ${status("Active", "active")}
    </div>
    <p class="plan-price">$0 <span>during the pilot</span></p>
    <p>Agentify is not collecting a platform charge from this account now.</p>
    <ul class="tariff-includes">
      <li>Agentify's catalog is for physical products, digital products, and services</li>
      <li>Use the test marketplace and see test orders and receipts</li>
      <li>Request live publication after your seller name and payout wallet are ready</li>
    </ul>
    <p class="quiet">Available fulfillment depends on the integration and channel. Shipping is not enabled on live yet.</p>
  </section>
  <section class="plan-card">
    <p class="eyebrow">Billing</p>
    <h2>No billing account yet</h2>
    <p>Buyer payments go straight to your payout wallet and are separate from Agentify billing.</p>
    ${facts([
      ["Agentify sales fee", "None during the pilot"],
      ["Payment method", "No payment method on file"],
      ["Invoices", "None"],
    ])}
  </section>
  <section class="plan-card plan-wide plan-note">
    <p class="eyebrow">Before pricing changes</p>
    <h2>No paid plan is enabled</h2>
    <p>If Agentify introduces paid access, its price, effective date and billing controls will appear here before any charge.</p>
  </section>
</div>`;

const candidateSwitcher = (shown: TariffId, base: string): string => {
  const choices = IDS.map((id) => {
    const tariff = TARIFFS[id];
    const current = id === shown ? ' aria-current="true"' : "";
    const kind = tariff.kind === "platform" ? "Platform" : "Setup service";
    return `<a href="${escaped(base)}/plan?candidate=${id}"${current}>
      <span class="plan-candidate-kind">${id.toUpperCase()} · ${kind}</span>
      <strong class="plan-candidate-name">${escaped(tariff.shortName)}</strong>
      <b class="plan-candidate-price">${escaped(tariff.price)}</b>
    </a>`;
  }).join("");

  return `<section class="plan-switcher">
    <div class="plan-switcher-copy">
      <div>
        <p class="eyebrow">Local prototype only</p>
        <h2>Choose a pricing variant</h2>
      </div>
      <p>Switch here; the complete page below redraws for the selected option. None of these prices is approved.</p>
    </div>
    <nav class="plan-candidates" aria-label="Pricing variants">${choices}</nav>
  </section>`;
};

const gap = (title: string, copy: string): string => `<section class="plan-card plan-wide plan-gap">
  <div>
    <p class="eyebrow">Not connected</p>
    <h2>${escaped(title)}</h2>
  </div>
  <p>${escaped(copy)}</p>
</section>`;

const platformPreview = (id: TariffId, tariff: Tariff): string => {
  const billing: readonly (readonly [string, string])[] =
    id === "t1"
      ? [
          ["Platform charge", "$0"],
          ["Sales fee", "None"],
          ["Payment method", "Not needed"],
          ["Invoices", "None"],
        ]
      : id === "t2"
        ? [
            ["Paid orders this period", "Not connected"],
            ["Gross sales this period", "Not connected"],
            ["1% Agentify fee", "Not connected"],
            ["Payment method", "Not connected"],
          ]
        : [
            ["Billing status", "Not connected"],
            ["Next charge", "Not available"],
            ["Payment method", "Not connected"],
            ["Invoices", "None"],
          ];

  const missing =
    id === "t1"
      ? "A stored plan and an effective date are still needed before this can replace pilot access."
      : id === "t2"
        ? "Direct buyer-to-seller payments cannot be skimmed. This option needs a usage ledger, statements and a separate way to collect the 1% fee."
        : "This option needs a billing backend, payment method, renewal date, invoices and cancellation.";

  return `<div class="plan-preview-heading">
    <div><p class="eyebrow">Platform pricing preview</p><h2>${escaped(tariff.name)}</h2></div>
    ${status("Preview")}
  </div>
  <div class="plan-grid">
    <section class="plan-card plan-primary">
      <div class="plan-card-head">
        <div><p class="eyebrow">Your plan</p><h2>${escaped(tariff.name)}</h2></div>
        ${status("Preview")}
      </div>
      <p class="plan-price">${escaped(tariff.price)}</p>
      <p>${escaped(tariff.note)}</p>
      <ul class="tariff-includes">${tariff.includes.map((line) => `<li>${escaped(line)}</li>`).join("")}</ul>
    </section>
    <section class="plan-card">
      <p class="eyebrow">${id === "t2" ? "Usage & billing" : "Billing"}</p>
      <h2>${id === "t1" ? "Nothing to pay" : "Billing details"}</h2>
      <p>Sales paid by buyers stay separate from what Agentify charges for this plan.</p>
      ${facts(billing)}
      ${id === "t3" ? '<div class="plan-actions"><button class="button button-secondary" type="button" disabled>Manage subscription</button></div>' : ""}
    </section>
    ${gap("Backend required before launch", missing)}
  </div>`;
};

const setupPreview = (tariff: Tariff): string => `<div class="plan-preview-heading">
  <div><p class="eyebrow">Setup service preview</p><h2>Agent-ready setup</h2></div>
  ${status("Preview")}
</div>
<div class="plan-grid">
  <section class="plan-card plan-primary">
    <div class="plan-card-head">
      <div><p class="eyebrow">One-time service</p><h2>${escaped(tariff.name)}</h2></div>
      ${status("Not purchased")}
    </div>
    <p class="plan-price">${escaped(tariff.price)} <span>one-time</span></p>
    <p>This purchase prepares your store; it does not become your ongoing Agentify plan.</p>
    <ul class="tariff-includes">${tariff.includes.map((line) => `<li>${escaped(line)}</li>`).join("")}</ul>
    <div class="plan-actions"><button class="button button-primary" type="button" disabled>Buy setup service</button></div>
  </section>
  <section class="plan-card">
    <p class="eyebrow">Ongoing platform access</p>
    <h2>Pilot access</h2>
    <p class="plan-price">$0 <span>during the pilot</span></p>
    <p>The setup service is a separate purchase. Buyer payments still go straight to your payout wallet.</p>
    ${facts([
      ["Setup payment", "Not connected"],
      ["Work status", "Not started"],
      ["Receipt", "None"],
    ])}
  </section>
  ${gap(
    "Service checkout required before launch",
    "This option needs its own checkout, setup order, work status and receipt. It must not be stored as the merchant's ongoing platform plan.",
  )}
</div>`;

const candidatePage = (shown: TariffId): string => {
  const tariff = TARIFFS[shown];
  return tariff.kind === "platform" ? platformPreview(shown, tariff) : setupPreview(tariff);
};

export const planScreen = (viewer: Viewer, shown: TariffId | null = null): string => {
  const selected = shown ?? "t1";
  const body = `<div class="lede plan-page-lede">
    <div>
      <h1>Plan &amp; billing</h1>
      <p>Your Agentify access and charges. Sales paid by buyers stay separate.</p>
    </div>
  </div>
  ${
    viewer.mode === "sandbox"
      ? `${candidateSwitcher(selected, viewer.base)}${candidatePage(selected)}`
      : pilotPage()
  }`;

  return page({
    mode: viewer.mode,
    base: viewer.base,
    who: viewer.who,
    confirmed: viewer.confirmed,
    tab: "plan",
    title: "Plan & billing",
    ...(viewer.selling === undefined ? {} : { selling: viewer.selling }),
    body,
  });
};
