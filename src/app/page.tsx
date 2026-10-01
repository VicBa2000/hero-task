import PageBuilder from "@/components/PageBuilder/PageBuilder";
import data from "@/data/data.json";

// data.json simula la respuesta de un Headless CMS.
export default function Home() {
  return <PageBuilder blocks={data} />;
}
