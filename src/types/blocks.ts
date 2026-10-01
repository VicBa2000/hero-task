// Props de cada componente de bloque. Asi se espera que vengan del CMS,
// pero el PageBuilder no lo da por hecho (ver CmsBlock).
export type Link = { label: string; href: string };

export type HeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cta?: Link;
};

export type FeaturesProps = {
  title: string;
  items: { title: string; description: string }[];
};

export type PricingPlan = {
  name: string;
  price: string;
  period?: string;
  features: string[];
  highlighted?: boolean;
};

export type PricingProps = {
  anchor?: string;
  title: string;
  plans: PricingPlan[];
};

export type CtaProps = {
  title: string;
  button?: Link;
};

// Un elemento del array de data.json: { id, type, props }.
// `type` y `props` son `unknown`: la respuesta del CMS no es confiable hasta
// que el PageBuilder reconoce el tipo.
export type CmsBlock = {
  id?: string;
  type: unknown;
  props?: unknown;
};
