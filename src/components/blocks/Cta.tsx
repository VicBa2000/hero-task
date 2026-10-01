import type { CtaProps } from "@/types/blocks";
import styles from "./blocks.module.css";

export default function Cta({ title, button }: CtaProps) {
  return (
    <section className={`${styles.section} ${styles.cta}`}>
      <h2>{title}</h2>
      {button && (
        <a className={styles.button} href={button.href}>
          {button.label}
        </a>
      )}
    </section>
  );
}
