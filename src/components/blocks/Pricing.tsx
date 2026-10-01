import type { PricingProps } from "@/types/blocks";
import styles from "./blocks.module.css";

export default function Pricing({ anchor, title, plans }: PricingProps) {
  return (
    <section id={anchor} className={styles.section}>
      <h2>{title}</h2>
      <ul className={styles.grid}>
        {plans.map((plan) => (
          <li
            key={plan.name}
            className={plan.highlighted ? `${styles.card} ${styles.highlighted}` : styles.card}
          >
            <h3>{plan.name}</h3>
            <p className={styles.price}>
              {plan.price}
              {plan.period && <span> / {plan.period}</span>}
            </p>
            <ul className={styles.checklist}>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
