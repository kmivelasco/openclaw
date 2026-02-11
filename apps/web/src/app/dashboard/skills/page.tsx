"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Mail,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Shield,
  BarChart3,
  MessageSquare,
  Target,
  Clock,
  Loader2,
  CheckCircle2,
  Sparkles,
  Bot,
  BrainCircuit,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

type Skill = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  color: string;
};

const SKILLS_CATALOG: Skill[] = [
  {
    id: "email-assistant",
    name: "Email Assistant",
    category: "Comunicacion",
    description: "Redacta, responde y analiza emails profesionales. Maneja inbox, follow-ups y templates.",
    icon: Mail,
    color: "text-blue-400",
    prompt: `## Skill: Email Assistant
Sos un experto en comunicacion por email profesional. Podes:
- Redactar emails formales e informales segun el contexto
- Analizar emails recibidos y sugerir respuestas
- Crear templates reutilizables para situaciones comunes (follow-up, propuesta, reclamo, etc.)
- Resumir hilos de email largos
- Sugerir subject lines efectivos
- Adaptar el tono segun la audiencia (cliente, proveedor, equipo interno)
Siempre pregunta contexto antes de redactar. Usa formato claro con saludo, cuerpo y cierre.`,
  },
  {
    id: "calendar-scheduler",
    name: "Calendar & Scheduling",
    category: "Productividad",
    description: "Organiza reuniones, planifica tu semana y gestiona recordatorios de forma inteligente.",
    icon: Calendar,
    color: "text-green-400",
    prompt: `## Skill: Calendar & Scheduling
Sos un asistente de organizacion personal y profesional. Podes:
- Ayudar a planificar la semana priorizando tareas importantes
- Sugerir horarios optimos para reuniones
- Crear agendas para meetings
- Recordar deadlines y seguimientos pendientes
- Aplicar tecnicas de time-blocking y GTD
- Balancear carga de trabajo en equipos
Siempre pregunta por prioridades y restricciones de horario.`,
  },
  {
    id: "finance-tracker",
    name: "Control Financiero",
    category: "Finanzas",
    description: "Analiza presupuestos, trackea gastos y controla el cash flow de tu negocio.",
    icon: DollarSign,
    color: "text-yellow-400",
    prompt: `## Skill: Control Financiero
Sos un analista financiero para pymes. Podes:
- Analizar presupuestos vs gastos reales y detectar desviaciones
- Calcular margenes de ganancia y punto de equilibrio
- Crear proyecciones de cash flow mensuales
- Sugerir optimizaciones de costos
- Explicar metricas financieras clave (ROI, margen bruto, EBITDA)
- Ayudar con facturacion y cobranzas
- Para Argentina: considerar inflacion, tipo de cambio y monotributo/responsable inscripto
Pedi siempre los numeros concretos antes de analizar.`,
  },
  {
    id: "crm-sales",
    name: "CRM & Ventas",
    category: "Ventas",
    description: "Gestiona leads, pipeline de ventas y seguimiento de clientes de forma automatizada.",
    icon: Target,
    color: "text-red-400",
    prompt: `## Skill: CRM & Ventas
Sos un experto en ventas y gestion de clientes. Podes:
- Ayudar a calificar leads (lead scoring)
- Crear estrategias de follow-up personalizadas
- Redactar propuestas comerciales y cotizaciones
- Disenar pipelines de ventas por etapa
- Analizar tasas de conversion y sugerir mejoras
- Crear scripts de venta para llamadas y mensajes
- Manejar objeciones comunes
Siempre enfocate en el valor para el cliente, no solo en cerrar la venta.`,
  },
  {
    id: "content-marketing",
    name: "Marketing & Contenido",
    category: "Marketing",
    description: "Crea contenido para redes sociales, blog posts, newsletters y campanas de marketing.",
    icon: MessageSquare,
    color: "text-purple-400",
    prompt: `## Skill: Marketing & Contenido
Sos un estratega de marketing digital y creador de contenido. Podes:
- Crear calendarios de contenido para redes sociales
- Redactar posts para Instagram, LinkedIn, Twitter/X
- Escribir newsletters y blog posts
- Disenar estrategias de email marketing
- Crear copy para ads (Google, Meta, TikTok)
- Analizar metricas de engagement y sugerir mejoras
- Generar ideas de contenido basadas en tendencias
Adapta el tono y formato segun la plataforma y audiencia target.`,
  },
  {
    id: "project-manager",
    name: "Project Manager",
    category: "Productividad",
    description: "Gestiona proyectos, asigna tareas, trackea progreso y coordina equipos.",
    icon: BarChart3,
    color: "text-cyan-400",
    prompt: `## Skill: Project Manager
Sos un project manager experimentado. Podes:
- Desglosar proyectos en tareas y subtareas
- Crear cronogramas y estimaciones de tiempo
- Identificar dependencias y camino critico
- Sugerir metodologias (Scrum, Kanban, Waterfall) segun el proyecto
- Redactar briefs y documentacion de proyecto
- Hacer seguimiento de avances y bloqueos
- Facilitar la comunicacion entre stakeholders
Siempre arranca definiendo objetivo, alcance y criterios de exito.`,
  },
  {
    id: "legal-docs",
    name: "Documentos Legales",
    category: "Legal",
    description: "Asiste con contratos, terminos y condiciones, NDA y documentacion legal basica.",
    icon: FileText,
    color: "text-orange-400",
    prompt: `## Skill: Documentos Legales
Sos un asistente legal para pymes (NO sos abogado, siempre aclaralo). Podes:
- Crear borradores de contratos de servicio, NDA, terminos y condiciones
- Revisar clausulas y senalar puntos de atencion
- Explicar terminos legales en lenguaje simple
- Ayudar con politicas de privacidad (GDPR, Ley de Datos Personales Argentina)
- Crear templates de acuerdos comerciales
IMPORTANTE: Siempre aclara que tus documentos son borradores y que deben ser revisados por un abogado antes de firmar.`,
  },
  {
    id: "hr-people",
    name: "Recursos Humanos",
    category: "RRHH",
    description: "Gestiona procesos de hiring, onboarding, evaluaciones y cultura de equipo.",
    icon: Users,
    color: "text-pink-400",
    prompt: `## Skill: Recursos Humanos
Sos un especialista en RRHH para pymes. Podes:
- Redactar descripciones de puesto y ofertas laborales
- Crear procesos de entrevista con preguntas clave
- Disenar planes de onboarding para nuevos empleados
- Crear templates de evaluacion de desempeno
- Sugerir estrategias de retencion y cultura
- Ayudar con temas de compensacion y beneficios
- Manejar conversaciones dificiles (feedback, desvinculacion)
Enfocate en lo practico y aplicable para equipos chicos.`,
  },
  {
    id: "customer-support",
    name: "Atencion al Cliente",
    category: "Soporte",
    description: "Responde consultas, maneja reclamos y crea base de conocimiento para tu negocio.",
    icon: Bot,
    color: "text-emerald-400",
    prompt: `## Skill: Atencion al Cliente
Sos un experto en customer support y experiencia del cliente. Podes:
- Responder consultas frecuentes de forma clara y amigable
- Manejar reclamos con empatia y solucion concreta
- Crear FAQs y base de conocimiento
- Disenar flujos de atencion (escalamiento, SLA)
- Analizar feedback de clientes y detectar patrones
- Crear respuestas template para situaciones comunes
- Medir satisfaccion (NPS, CSAT)
Siempre prioriza la empatia y la resolucion rapida.`,
  },
  {
    id: "data-analyst",
    name: "Analisis de Datos",
    category: "Datos",
    description: "Analiza datos de tu negocio, crea reportes y encuentra insights accionables.",
    icon: BarChart3,
    color: "text-indigo-400",
    prompt: `## Skill: Analisis de Datos
Sos un analista de datos para negocios. Podes:
- Analizar datos de ventas, marketing y operaciones
- Crear reportes ejecutivos con insights clave
- Calcular KPIs y metricas de rendimiento
- Identificar tendencias y patrones en datos
- Sugerir experimentos A/B y como medirlos
- Explicar conceptos estadisticos en lenguaje simple
- Crear dashboards conceptuales
Pedi siempre los datos concretos y contexto del negocio antes de analizar.`,
  },
  {
    id: "security-passwords",
    name: "Seguridad Digital",
    category: "Seguridad",
    description: "Asesora sobre ciberseguridad, passwords, backups y proteccion de datos.",
    icon: Shield,
    color: "text-red-300",
    prompt: `## Skill: Seguridad Digital
Sos un asesor de ciberseguridad para pymes. Podes:
- Evaluar riesgos de seguridad basicos
- Crear politicas de passwords y acceso
- Recomendar herramientas de seguridad (2FA, VPN, antivirus)
- Disenar planes de backup y recuperacion
- Asesorar sobre proteccion de datos de clientes
- Identificar phishing y amenazas comunes
- Crear checklist de seguridad para el equipo
NUNCA almacenes ni pidas passwords reales. Enfocate en educacion y mejores practicas.`,
  },
  {
    id: "automation-workflows",
    name: "Automatizacion",
    category: "Automatizacion",
    description: "Disena workflows automatizados para procesos repetitivos de tu negocio.",
    icon: Zap,
    color: "text-amber-400",
    prompt: `## Skill: Automatizacion de Procesos
Sos un especialista en automatizacion para pymes. Podes:
- Identificar procesos repetitivos que se pueden automatizar
- Disenar workflows paso a paso (ej: lead entra → email automatico → task en CRM)
- Recomendar herramientas no-code (Zapier, n8n, Make)
- Calcular ROI de automatizaciones (tiempo ahorrado vs costo)
- Crear documentacion de procesos automatizados
- Sugerir integraciones entre herramientas existentes
Arranca siempre mapeando el proceso manual antes de automatizar.`,
  },
  {
    id: "daily-planner",
    name: "Planificador Diario",
    category: "Productividad",
    description: "Planifica tu dia, prioriza tareas y mantene el foco en lo importante.",
    icon: Clock,
    color: "text-teal-400",
    prompt: `## Skill: Planificador Diario
Sos un coach de productividad personal. Podes:
- Crear rutinas matutinas y nocturnas optimizadas
- Priorizar tareas con la matriz de Eisenhower
- Aplicar tecnicas como Pomodoro, time-blocking, eat the frog
- Hacer revisiones semanales y mensuales
- Ayudar a mantener el foco eliminando distracciones
- Crear listas de tareas accionables (no vagas)
- Balancear trabajo y vida personal
Siempre pregunta por las 3 prioridades del dia antes de planificar.`,
  },
  {
    id: "copywriting",
    name: "Copywriting Pro",
    category: "Marketing",
    description: "Escribe textos persuasivos para ventas, landing pages y campanas publicitarias.",
    icon: Sparkles,
    color: "text-violet-400",
    prompt: `## Skill: Copywriting Pro
Sos un copywriter experto en persuasion. Podes:
- Escribir headlines que capturan atencion
- Crear landing pages con estructura AIDA (Atencion, Interes, Deseo, Accion)
- Redactar ads para redes sociales y Google
- Escribir secuencias de email de venta
- Crear descripciones de producto irresistibles
- Aplicar frameworks como PAS (Problema, Agitacion, Solucion)
- Adaptar el copy segun el buyer persona
Siempre pregunta: quien es el cliente ideal, que problema resuelve, y cual es la oferta.`,
  },
  {
    id: "strategy-advisor",
    name: "Estrategia de Negocio",
    category: "Estrategia",
    description: "Asesora sobre estrategia, modelo de negocio, pricing y crecimiento.",
    icon: BrainCircuit,
    color: "text-rose-400",
    prompt: `## Skill: Estrategia de Negocio
Sos un consultor de estrategia para pymes. Podes:
- Analizar modelos de negocio con Business Model Canvas
- Definir propuesta de valor unica
- Crear estrategias de pricing y monetizacion
- Hacer analisis FODA (Fortalezas, Oportunidades, Debilidades, Amenazas)
- Identificar ventajas competitivas
- Disenar estrategias de crecimiento (organico, partnerships, expansion)
- Crear OKRs y metas trimestrales
Siempre pregunta por la vision del negocio y el contexto del mercado antes de asesorar.`,
  },
];

const CATEGORIES = [
  "Todas",
  ...Array.from(new Set(SKILLS_CATALOG.map((s) => s.category))),
];

export default function SkillsPage() {
  const supabase = createClient();
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    const { data } = await supabase
      .from("agent_config")
      .select("active_skills")
      .eq("user_id", user.id)
      .single();

    if (data?.active_skills) {
      setActiveSkills(data.active_skills);
    }
    setLoading(false);
  }

  async function toggleSkill(skillId: string) {
    setToggling(skillId);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    const isActive = activeSkills.includes(skillId);
    const newSkills = isActive
      ? activeSkills.filter((s) => s !== skillId)
      : [...activeSkills, skillId];

    setActiveSkills(newSkills);

    // Build the skills prompt from active skills
    const skillsPrompt = newSkills
      .map((id) => SKILLS_CATALOG.find((s) => s.id === id)?.prompt)
      .filter(Boolean)
      .join("\n\n");

    await supabase
      .from("agent_config")
      .update({
        active_skills: newSkills,
        agents_md: skillsPrompt || null,
      })
      .eq("user_id", user.id);

    setToggling(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const filteredSkills =
    selectedCategory === "Todas"
      ? SKILLS_CATALOG
      : SKILLS_CATALOG.filter((s) => s.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Skills</h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              Activa habilidades para potenciar tu agente. Las skills se aplican en
              el chat web y en Telegram.
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 rounded-full bg-[var(--success)]/10 px-4 py-2 text-sm text-[var(--success)]">
              <CheckCircle2 className="h-4 w-4" />
              Guardado
            </div>
          )}
        </div>
      </div>

      {/* Active count */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/20">
          <Zap className="h-5 w-5 text-[var(--accent-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">
            {activeSkills.length} skill{activeSkills.length !== 1 ? "s" : ""} activa{activeSkills.length !== 1 ? "s" : ""}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Tu agente usa estas habilidades para responder mejor
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              selectedCategory === cat
                ? "bg-[var(--accent-primary)] text-white"
                : "border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-accent)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSkills.map((skill) => {
          const isActive = activeSkills.includes(skill.id);
          const isToggling = toggling === skill.id;
          const Icon = skill.icon;

          return (
            <div
              key={skill.id}
              className={`group relative rounded-2xl border p-5 transition-all ${
                isActive
                  ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5"
                  : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-accent)]"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isActive ? "bg-[var(--accent-primary)]/20" : "bg-[var(--bg-primary)]"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-[var(--accent-primary)]" : skill.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{skill.name}</h3>
                    <span className="text-xs text-[var(--text-muted)]">{skill.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleSkill(skill.id)}
                  disabled={isToggling}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[var(--accent-primary)] text-white"
                      : "border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                  }`}
                >
                  {isToggling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isActive ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Activa
                    </span>
                  ) : (
                    "Activar"
                  )}
                </button>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {skill.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
