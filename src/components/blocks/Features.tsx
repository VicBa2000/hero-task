import type { FeaturesProps } from "@/types/blocks";
import styles from "./blocks.module.css";

export default function Features({ title, items }: FeaturesProps) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <ul className={styles.grid}>
        {items.map((item) => (
          <li key={item.title} className={styles.card}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
