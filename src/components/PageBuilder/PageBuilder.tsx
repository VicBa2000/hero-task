import UnknownBlock from "./UnknownBlock";
import { blockRegistry } from "./registry";

type Props = {
  // `unknown` a proposito: la respuesta del CMS no es confiable hasta que se
  // revisa aqui (puede no ser un array, o traer bloques nulos o sin `type`).
  blocks: unknown;
};

export default function PageBuilder({ blocks }: Props) {
  if (!Array.isArray(blocks)) {
    console.warn(`[PageBuilder] Expected an array of blocks, got ${blocks === null ? "null" : typeof blocks}.`);
    return null;
  }

  return (
    <main>
      {blocks.map((block: unknown, index) => {
        const fields = typeof block === "object" && block !== null ? (block as Record<string, unknown>) : {};
        const key = typeof fields.id === "string" ? fields.id : `block-${index}`;
        const label = typeof fields.type === "string" ? `"${fields.type}"` : `Block #${index}`;

        const definition = typeof fields.type === "string" ? blockRegistry.get(fields.type) : undefined;
        if (!definition) {
          console.warn(`[PageBuilder] Unknown block type ${label} (key: ${key}), skipped.`);
          return <UnknownBlock key={key} label={label} reason="is not a known block type." />;
        }

        if (!definition.isValid(fields.props)) {
          console.warn(`[PageBuilder] Block ${label} (key: ${key}) has invalid props, skipped.`);
          return <UnknownBlock key={key} label={label} reason="has invalid props." />;
        }

        const { component: Component } = definition;
        return <Component key={key} {...(fields.props as object)} />;
      })}
    </main>
  );
}
