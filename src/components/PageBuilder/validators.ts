import type { CtaProps, FeaturesProps, HeroProps, Link, PricingPlan, PricingProps } from "@/types/blocks";

// Validan las props que llegan del CMS ANTES de renderizar. Revisan todo lo
// que el componente usa: un campo que falta o con otro tipo (ej. un objeto
// donde va texto) haria fallar el render.
//
// Se valida aqui y no con un error boundary: los bloques son Server
// Components y un boundary no atrapa errores del render en el servidor
// (ver cambios.txt, paso 6).

type Fields = Record<string, unknown>;

const isObject = (value: unknown): value is Fields => typeof value === "object" && value !== null;
const isString = (value: unknown): value is string => typeof value === "string";
const isOptional = <T>(value: unknown, check: (v: unknown) => v is T): value is T | undefined =>
  value === undefined || check(value);
const isArrayOf = <T>(value: unknown, check: (v: unknown) => v is T): value is T[] =>
  Array.isArray(value) && value.every(check);

const isLink = (value: unknown): value is Link =>
  isObject(value) && isString(value.label) && isString(value.href);

export const isHeroProps = (props: unknown): props is HeroProps =>
  isObject(props) &&
  isString(props.title) &&
  isOptional(props.eyebrow, isString) &&
  isOptional(props.subtitle, isString) &&
  isOptional(props.cta, isLink);

const isFeatureItem = (value: unknown): value is FeaturesProps["items"][number] =>
  isObject(value) && isString(value.title) && isString(value.description);

export const isFeaturesProps = (props: unknown): props is FeaturesProps =>
  isObject(props) && isString(props.title) && isArrayOf(props.items, isFeatureItem);

const isPricingPlan = (value: unknown): value is PricingPlan =>
  isObject(value) &&
  isString(value.name) &&
  isString(value.price) &&
  isOptional(value.period, isString) &&
  isArrayOf(value.features, isString) &&
  isOptional(value.highlighted, (v): v is boolean => typeof v === "boolean");

export const isPricingProps = (props: unknown): props is PricingProps =>
  isObject(props) &&
  isString(props.title) &&
  isOptional(props.anchor, isString) &&
  isArrayOf(props.plans, isPricingPlan);

export const isCtaProps = (props: unknown): props is CtaProps =>
  isObject(props) && isString(props.title) && isOptional(props.button, isLink);
