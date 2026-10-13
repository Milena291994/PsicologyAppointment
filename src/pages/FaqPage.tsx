import React, { useMemo, useState } from "react";
import { ChevronDown, FileText, Mail, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FAQ_CATEGORIES } from "@/data/faqData";
import { APP_CONFIG } from "@/data/mockData";

const normalize = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export const FaqPage: React.FC = () => {
  const [query, setQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return FAQ_CATEGORIES;
    return FAQ_CATEGORIES.map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        normalize([item.question, ...item.answer].join(" ")).includes(q)
      ),
    })).filter((category) => category.items.length > 0);
  }, [query]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
          Preguntas y respuestas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resolvemos las dudas más comunes sobre reservas, pagos, confidencialidad y el tratamiento de tus datos.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar una pregunta (ej. reembolso, menores, datos)"
          className="pl-9"
          aria-label="Buscar en preguntas y respuestas"
        />
      </div>

      {filteredCategories.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No encontramos preguntas que coincidan con "{query}".
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <section key={category.id}>
              <h2 className="font-display text-base font-semibold text-foreground mb-3">{category.title}</h2>
              <Card className="divide-y divide-border overflow-hidden">
                {category.items.map((item) => (
                  <details key={item.id} className="group">
                    <summary className="flex items-center justify-between gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none text-sm font-medium text-foreground hover:bg-accent/50 transition-colors [&::-webkit-details-marker]:hidden">
                      <span>{item.question}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 sm:px-5 pb-4 space-y-2 text-sm text-muted-foreground leading-relaxed">
                      {item.answer.map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </details>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}

      <Card className="mt-8 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">¿No encontraste tu respuesta?</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consulta el documento completo o escríbenos a admin@psicologiaymente.com.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a href={APP_CONFIG.termsUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="w-4 h-4" />
              <span>Términos y Condiciones</span>
            </a>
          </Button>
          <Button asChild size="sm" className="gap-2">
            <a href="mailto:admin@psicologiaymente.com">
              <Mail className="w-4 h-4" />
              <span>Escribirnos</span>
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
};
