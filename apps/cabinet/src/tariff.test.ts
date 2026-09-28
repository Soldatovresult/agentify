import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { planScreen, pricingCandidateIn, type TariffId, tariffBlock } from "./tariff.js";

/**
 * The cabinet's tariff block and the landing's pricing section describe the
 * same six candidates. If this fails, one page promises what the other does
 * not: a line of the cabinet's block is missing from the landing.
 */
const landing = readFileSync(
  new URL("../../commerce-landing/index.html", import.meta.url),
  "utf8",
).replaceAll("&nbsp;", " ");

const textsOf = (html: string): string[] =>
  [...html.matchAll(/<(?:li|span|b)>([^<]+)<\/(?:li|span|b)>/g)].map((match) => match[1] ?? "");

describe("the six pricing candidates", () => {
  it("promises nothing the landing's pricing does not", () => {
    for (const id of ["t1", "t2", "t3", "t4", "t5", "t6"] as TariffId[]) {
      const lines = textsOf(tariffBlock(id));
      expect(lines.length, id).toBeGreaterThan(0);
      for (const line of lines) {
        expect(landing, `${id}: ${line}`).toContain(line);
      }
    }
  });

  it("draws nothing while no tariff is chosen", () => {
    expect(tariffBlock(null)).toBe("");
  });
});

const viewer = {
  mode: "sandbox" as const,
  base: "/cabinet",
  who: "merchant@example.com",
  confirmed: true,
};

describe("plan and billing", () => {
  it("shows only the factual pilot state as the merchant's current access", () => {
    const html = planScreen({ ...viewer, mode: "live" }, null);

    expect(html).toContain("Pilot access");
    expect(html).toMatch(/\$0\s*<span>during the pilot<\/span>/);
    expect(html).toContain("No payment method on file");
    expect(html).toMatch(/Buyer payments go straight to your payout wallet/i);
    expect(html).not.toContain("Current plan</p><h2>Subscription");
  });

  it("keeps platform pricing and the one-time setup service separate", () => {
    const platform = planScreen(viewer, "t3");
    const setup = planScreen(viewer, "t5");

    expect(platform).toContain("Platform pricing preview");
    expect(platform).toContain("$29 a month");
    expect(platform).toMatch(/billing backend/i);
    expect(setup).toContain("Setup service preview");
    expect(setup).toContain("$99");
    expect(setup).toMatch(/does not become your ongoing Agentify plan/i);
  });

  it("puts the switcher first and redraws the complete page for the selected variant", () => {
    const html = planScreen(viewer, "t5");
    const switcher = html.indexOf("Choose a pricing variant");
    const selectedPage = html.indexOf("Setup service preview");

    expect(switcher).toBeGreaterThan(0);
    expect(selectedPage).toBeGreaterThan(switcher);
    expect(html).toContain('href="/cabinet/plan?candidate=t5" aria-current="true"');
    expect(html).toContain("One-time service");
    expect(html).toContain("Buy setup service");
  });

  it("accepts only one of the six review candidates", () => {
    expect(pricingCandidateIn("t2")).toBe("t2");
    expect(pricingCandidateIn(["t4"])).toBe("t4");
    expect(pricingCandidateIn("anything-else")).toBeNull();
    expect(pricingCandidateIn(undefined)).toBeNull();
  });

  it("does not expose the internal pricing review outside the local sandbox", () => {
    const html = planScreen({ ...viewer, mode: "live" }, "t3");

    expect(html).toContain("Pilot access");
    expect(html).not.toContain("Pricing review");
    expect(html).not.toContain("$29 a month");
  });
});
