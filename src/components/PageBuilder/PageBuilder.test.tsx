import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import data from "@/data/data.json";
import PageBuilder from "./PageBuilder";

// Cada grupo prueba los dos lados:
// - "debe fallar": la entrada mala se omite sin tumbar la pagina.
// - "debe pasar": la entrada valida (aunque sea minima o traiga campos de
//   mas) se renderiza y NO genera warnings. Un validador demasiado estricto
//   esconderia bloques legitimos en silencio.
//
// Se renderiza el PageBuilder real con los componentes reales (sin mocks):
// el test prueba lo mismo que corre en produccion (CLAUDE.md, regla 5).

const hero = { id: "hero-1", type: "hero", props: { title: "Hero title" } };
const pricing = {
  id: "pricing-1",
  type: "pricing",
  props: {
    title: "Pricing title",
    plans: [{ name: "Pro", price: "$29", period: "month", features: ["10 sites"], highlighted: true }],
  },
};
const cta = { id: "cta-1", type: "cta", props: { title: "CTA title" } };

// Titulos de bloque (h1 del hero, h2 del resto) en orden de aparicion.
const headingTexts = () =>
  screen.queryAllByRole("heading").filter((h) => ["H1", "H2"].includes(h.tagName)).map((h) => h.textContent);
const notices = () => screen.queryAllByRole("note");

let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("PageBuilder — known blocks", () => {
  it("debe pasar: renders each known type with the right component, in array order", () => {
    render(<PageBuilder blocks={[cta, hero, pricing]} />);

    expect(headingTexts()).toEqual(["CTA title", "Hero title", "Pricing title"]);
    expect(screen.getByRole("heading", { level: 1, name: "Hero title" })).toBeTruthy();
    expect(screen.getByText("10 sites")).toBeTruthy();
    expect(notices()).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it("debe pasar: renders the real data.json — 4 blocks in order and only the slider skipped", () => {
    render(<PageBuilder blocks={data} />);

    expect(headingTexts()).toEqual([
      "Pages assembled from data, not hardcoded markup",
      "Why a page builder",
      "Simple pricing",
      "Ready to build your next page?",
    ]);
    expect(notices()).toHaveLength(1);
    expect(notices()[0].textContent).toContain('"slider"');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("debe pasar: accepts blocks with only the required props (optional fields omitted)", () => {
    const minimal = [
      { type: "hero", props: { title: "Only title" } },
      { type: "features", props: { title: "Features", items: [] } },
      { type: "pricing", props: { title: "Plans", plans: [{ name: "Free", price: "$0", features: [] }] } },
      { type: "cta", props: { title: "No button" } },
    ];
    render(<PageBuilder blocks={minimal} />);

    expect(headingTexts()).toEqual(["Only title", "Features", "Plans", "No button"]);
    expect(notices()).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it("debe pasar: tolerates extra fields the CMS may add (on the block and in props)", () => {
    const withExtras = [
      { id: "h", type: "hero", createdAt: "2026-10-01", props: { title: "Hero", locale: "en", seo: { noindex: false } } },
    ];
    render(<PageBuilder blocks={withExtras} />);

    expect(headingTexts()).toEqual(["Hero"]);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("PageBuilder — Unknown Component Type", () => {
  const slider = { id: "slider-1", type: "slider", props: { slides: [{ caption: "SLIDE CAPTION" }] } };

  it("debe fallar (sin romper): skips a 'slider' and still renders the valid blocks around it", () => {
    expect(() => render(<PageBuilder blocks={[hero, slider, pricing]} />)).not.toThrow();

    expect(headingTexts()).toEqual(["Hero title", "Pricing title"]);
    expect(screen.queryByText("SLIDE CAPTION")).toBeNull();
  });

  it("debe fallar (sin romper): shows a dev notice naming the type and warns once", () => {
    render(<PageBuilder blocks={[hero, slider]} />);

    expect(notices()).toHaveLength(1);
    expect(notices()[0].textContent).toBe('"slider" is not a known block type.');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"slider"');
  });

  it("debe fallar (sin romper): in production renders no notice, only the valid blocks", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<PageBuilder blocks={[hero, slider, pricing]} />);

    expect(notices()).toHaveLength(0);
    expect(headingTexts()).toEqual(["Hero title", "Pricing title"]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("debe fallar (sin romper): a page made only of unknown types renders an empty <main> in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(<PageBuilder blocks={[slider, { type: "carousel" }]} />);

    expect(container.querySelector("main")?.children).toHaveLength(0);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("debe fallar: type matching is exact — 'Hero' (capitalized) is not 'hero'", () => {
    render(<PageBuilder blocks={[{ type: "Hero", props: { title: "Capitalized" } }]} />);

    expect(screen.queryByText("Capitalized")).toBeNull();
    expect(notices()[0].textContent).toBe('"Hero" is not a known block type.');
  });
});

describe("PageBuilder — malformed blocks are treated as unknown", () => {
  it.each([
    ["null", null],
    ["a number", 42],
    ["a string", "hero"],
    ["an array", ["hero"]],
  ])("debe fallar (sin romper): block that is %s", (_, block) => {
    render(<PageBuilder blocks={[hero, block, cta]} />);

    expect(headingTexts()).toEqual(["Hero title", "CTA title"]);
    expect(notices()).toHaveLength(1);
    expect(notices()[0].textContent).toBe("Block #1 is not a known block type.");
  });

  it.each([
    ["missing", { props: { title: "x" } }],
    ["a number", { type: 1, props: { title: "x" } }],
    ["an object", { type: { name: "hero" }, props: { title: "x" } }],
    ["null", { type: null, props: { title: "x" } }],
  ])("debe fallar (sin romper): block whose type is %s", (_, block) => {
    render(<PageBuilder blocks={[hero, block]} />);

    expect(headingTexts()).toEqual(["Hero title"]);
    expect(notices()).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  // Con un objeto literal como registro, registry["toString"] encontraria
  // Object.prototype.toString y React intentaria renderizarlo.
  it.each(["toString", "constructor", "__proto__", "hasOwnProperty", "valueOf"])(
    "debe fallar (sin romper): type %s inherited from Object.prototype",
    (type) => {
      expect(() => render(<PageBuilder blocks={[hero, { type, props: { title: "x" } }]} />)).not.toThrow();

      expect(headingTexts()).toEqual(["Hero title"]);
      expect(notices()[0].textContent).toBe(`"${type}" is not a known block type.`);
    },
  );
});

describe("PageBuilder — known type with invalid props", () => {
  it.each([
    ["pricing without plans", { type: "pricing", props: { title: "P" } }],
    ["pricing plan with a non-string feature", { type: "pricing", props: { title: "P", plans: [{ name: "A", price: "$1", features: [1] }] } }],
    ["hero with an object as title", { type: "hero", props: { title: { text: "x" } } }],
    ["hero with a cta missing href", { type: "hero", props: { title: "H", cta: { label: "Go" } } }],
    ["features with items not an array", { type: "features", props: { title: "F", items: "a,b" } }],
    ["cta without title", { type: "cta", props: {} }],
    ["props null", { type: "hero", props: null }],
    ["props missing", { type: "hero" }],
    ["props a string", { type: "hero", props: "Hero title" }],
  ])("debe fallar (sin romper): %s", (_, block) => {
    expect(() => render(<PageBuilder blocks={[hero, block, cta]} />)).not.toThrow();

    expect(headingTexts()).toEqual(["Hero title", "CTA title"]);
    expect(notices()).toHaveLength(1);
    expect(notices()[0].textContent).toContain("has invalid props.");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("debe fallar (sin romper): in production the invalid block renders nothing", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<PageBuilder blocks={[hero, { type: "pricing", props: { title: "P" } }, cta]} />);

    expect(notices()).toHaveLength(0);
    expect(headingTexts()).toEqual(["Hero title", "CTA title"]);
  });
});

describe("PageBuilder — input that is not an array", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an object", { blocks: [hero] }],
    ["a string", "[]"],
  ])("debe fallar (sin romper): %s renders nothing and warns", (_, input) => {
    let container!: HTMLElement;
    expect(() => ({ container } = render(<PageBuilder blocks={input} />))).not.toThrow();

    expect(container.innerHTML).toBe("");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("debe pasar: an empty array renders an empty <main> without warnings", () => {
    const { container } = render(<PageBuilder blocks={[]} />);

    expect(container.querySelector("main")?.children).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });
});
