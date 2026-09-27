# Portal de Citas Psicológicas • Psicología y Mente 🌿
### Diseñado con el Sistema de Diseño **shadcn/ui** y **Sonner**

Demostración interactiva de Frontend para el agendamiento y pago de sesiones de atención psicológica, diseñado bajo **estándares internacionales de UI/UX en salud mental y telepsicología** utilizando la estética y componentes de **shadcn/ui**.

---

## 🎨 Sistema de Diseño: shadcn/ui

El proyecto ha sido estructurado respetando las especificaciones, tokens y componentes oficiales de **shadcn/ui**:

1. **Tokens HSL oficiales:**
   - `--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`.
   - Paleta cromática adaptada a **salud mental**: verde salvia clínico (`--primary: 154 47% 28%`), fondos orgánicos suaves y contrastes accesibles WCAG AA.
2. **Componentes shadcn/ui implementados:**
   - **`<Card>`**, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>`
   - **`<Button>`** (variantes `default`, `outline`, `secondary`, `ghost`, `icon`)
   - **`<Badge>`** (variantes `default`, `secondary`, `outline`)
   - **`<Input>`**, `<Label>`, `<Select>`
   - **`<Calendar>`** (vistas mensuales, navegación, selección de días con estados interactivos)
   - **`<Tabs>`**, `<TabsList>`, `<TabsTrigger>` (utilizados en el selector de modalidad Videoconsulta / Presencial)
   - **`<Dialog>`** (modal oficial de Payphone y modal de Pausa Consciente)
   - **`<Sonner>`** (`<Toaster />` apilable con física de capas 3D y notificaciones contextuales)
   - **`<Separator>`** (líneas divisorias sutiles)

---

## 🔄 Flujo del Paciente (Demostración)

1. **Paso 1: Selección de Fecha y Fechas Tentativas**
   * Calendario interactivo estilo **shadcn `<Calendar />`** con selector de mes.
   * Tarjetas de **Fechas tentativas recomendadas** (*"Más cercana"*, *"Recomendada"*, *"Alternativa"*) para agendamiento ágil con un solo clic.
   * Selector de modalidad con **shadcn `<Tabs />`**: **Videoconsulta (Online)** o **Presencial**.

2. **Paso 2: Selección de Horario**
   * Turnos organizados amigablemente en **Mañana** (08:30 AM a 11:30 AM) y **Tarde** (02:00 PM a 06:00 PM).
   * Indicador de tiempo de sesión clínica (50 minutos dedicados).

3. **Paso 3: Identificación y Datos Personales (Acceso Doble)**
   * **Búsqueda Previa de Paciente:** Barra con shadcn `<Input>` para buscar por Cédula, DNI o Correo. Si el paciente ya existe, autocompleta sus datos de inmediato y muestra una tarjeta de bienvenida.
     * *Incluye botones de prueba rápida para 3 pacientes de ejemplo:* **Camila Vega**, **Mateo Rivas** y **Lucía Cordero**.
   * **Formulario de Nuevo Paciente:** Formulario estructurado para registro por primera vez.
   * **Consentimiento Informado:** Casilla de aceptación ética y confidencialidad médica.

4. **Paso 4: Agendar y Pagar con Payphone**
   * Desglose financiero transparente ($45.00 USD, IVA 0% de salud).
   * Botón destacado con la identidad de **Payphone**: *"Agendar y Pagar con Payphone"*.
   * Modal interactivo estilo **shadcn `<Dialog />`**:
     * **Enlace web directo a Payphone** (`https://payphone.app/`).
     * **Simulación de Pago Aprobado**, que conduce a la pantalla de éxito con código de reserva (`CS-XXXXXX`), confirmación por WhatsApp y recomendaciones para la sesión.

---

## 🔔 Notificaciones con Sonner

Integración de **Sonner** (`toast.success`, `toast.error`, `toast.warning`, `toast.info`):
- Notificaciones apilables en la esquina inferior derecha.
- Cero alertas invasivas del navegador (`alert()`).
- Feedback instantáneo al seleccionar fechas, horas, buscar pacientes y procesar pagos.

---

## 🚀 Cómo Probar el Demo

No requiere configuración previa ni instalación de Node.js:

1. Abre la carpeta del proyecto: `c:\Users\pc\Desktop\PsicologyAppointment`
2. Haz doble clic en el archivo [**`index.html`**](index.html) para abrirlo en cualquier navegador web.

---

## ⚙️ Personalización

Para modificar el enlace de cobro de Payphone o los datos del especialista:
📁 **[`js/data.js`](js/data.js)**
