import type { HeroProps } from "@/types/blocks";
import styles from "./blocks.module.css";

export default function Hero({ eyebrow, title, subtitle, cta }: HeroProps) {
  return (
    <section className={styles.hero}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1>{title}</h1>
      {subtitle && <p className={styles.lead}>{subtitle}</p>}
      {cta && (
        <a className={styles.button} href={cta.href}>
          {cta.label}
        </a>
      )}
    </section>
  );
}
