import type { ComponentType } from "react";
import Cta from "@/components/blocks/Cta";
import Features from "@/components/blocks/Features";
import Hero from "@/components/blocks/Hero";
import Pricing from "@/components/blocks/Pricing";
import { isCtaProps, isFeaturesProps, isHeroProps, isPricingProps } from "./validators";

// Un tipo de bloque: su componente y la funcion que valida sus props.
// `isValid` y `component` comparten el tipo P: TypeScript rechaza un
// validador que garantice MENOS de lo que el componente necesita (ej.
// isHeroProps para Pricing, falta `plans`). Uno que garantice de mas lo
// acepta (tipado estructural), pero eso no rompe el render.
type BlockDefinition<P> = {
  component: ComponentType<P>;
  isValid: (props: unknown) => props is P;
};

const define = <P>(definition: BlockDefinition<P>) => definition as BlockDefinition<unknown>;

// Tipo de bloque del CMS -> definicion. Para soportar un bloque nuevo basta
// con agregarlo aqui; el PageBuilder no cambia.
//
// Es un Map y no un objeto literal a proposito: con `registry[type]`, un CMS
// que mande "toString" o "constructor" encontraria funciones heredadas de
// Object.prototype y React intentaria renderizarlas como componente.
export const blockRegistry = new Map<string, BlockDefinition<unknown>>([
  ["hero", define({ component: Hero, isValid: isHeroProps })],
  ["features", define({ component: Features, isValid: isFeaturesProps })],
  ["pricing", define({ component: Pricing, isValid: isPricingProps })],
  ["cta", define({ component: Cta, isValid: isCtaProps })],
]);
