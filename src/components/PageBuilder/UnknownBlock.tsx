import styles from "./PageBuilder.module.css";

type Props = { label: string; reason: string };

// Lo que se pinta en lugar de un bloque que no se puede renderizar (tipo
// desconocido o props invalidas). En desarrollo se ve un aviso para que el equipo
// lo note; en produccion no se pinta nada: el visitante no debe ver errores
// del CMS.
export default function UnknownBlock({ label, reason }: Props) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div role="note" className={styles.notice}>
      <strong>{label}</strong> {reason}
    </div>
  );
}
