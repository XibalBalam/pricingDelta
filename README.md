# Pricing Delta - Calculadora de Precios Distribuidor

Aplicación interactiva para calcular precios personalizados de planes de DeltaTracking basados en volumen, periodicidad y complementos adicionales. Genera propuestas en PDF con números de cotización únicos.

## 🚀 Características

- **Calculadora Interactiva** - Ajusta cantidad de unidades y selecciona plan (mensual/anual)
- **Sistema de Tiering** - Planes automáticos según volumen (Essential, Profesional, Distribuidor)
- **Bonificaciones Anuales** - 10% de espacios gratis para planes anuales (1 por cada 10 unidades)
- **Add-ons Personalizables**
  - Logo personalizado
  - Dominio propio
  - Google Maps Premium
  - Historial de datos (3, 6, 12 meses)
- **Generación de PDF** - Propuestas con número único, logo y detalles de cotización
- **Comparativa** - Compara tu proveedor actual vs. DeltaTracking
- **Animaciones Avanzadas** - Transiciones fluidas, sistema de partículas, tema elite oscuro
- **Temas** - Modo claro (estándar) y tema elite (oscuro azul)

## 📋 Requisitos

- Node.js 18+
- npm 9+

## 🛠️ Instalación

```bash
npm install
```

## 💻 Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador. La aplicación recargará al editar archivos.

## 🏗️ Build Producción

```bash
npm run build
```

El resultado compilado estará en la carpeta `dist/`.

## 👀 Preview del Build

```bash
npm run preview
```

## 🧩 Estructura del Proyecto

```
src/
  ├── components/pricing/
  │   └── PricingCalculatorV2.tsx  # Componente principal calculadora
  ├── hooks/
  │   └── useDistributorPricing.ts # Lógica de cálculo de precios
  ├── lib/
  │   └── utils.ts                 # Utilidades (función cn)
  ├── App.tsx                      # Componente raíz
  ├── main.tsx                     # Entry point
  └── index.css                    # Estilos globales
```

## 📦 Stack Tecnológico

- **React 19** - Framework UI
- **TypeScript 5.9** - Type safety
- **Tailwind CSS 4** - Estilos utilities
- **Framer Motion 12** - Animaciones
- **jsPDF 4.2** - Generación de PDFs
- **Lucide React** - Iconos
- **Vite 7** - Build tool

## 💰 Lógica de Precios

### Bases Anuales
- Base por unidad: **$8.00**
- Logo personalizado: **$1.50**
- Dominio propio: **$1.50**
- Google Maps Premium: **$2.00**
- Historial 3M: **$2.00** / 6M: **$4.00** / 12M: **$6.00**

### Tiers Automáticos
| Volumen | Plan | Características Incluidas |
|---------|------|--------------------------|
| 10-49 | Inicio | — |
| 50-499 | Escala | Logo, Dominio |
| 500-999 | Distribuidor | Logo, Dominio, Historial 3M |
| 1000+ | Distribuidor | Logo, Dominio, Historial 6M |

### Bonificaciones (Solo Plan Anual)
- **10% de espacios extra** (1 por cada 10 unidades)
- Ejemplo: 100 unidades = 10 espacios bonus gratis

### Multiplicador Mensual
- Costo mensual = Costo anual × 1.2 (20% más caro)

## 📄 Licencia

Privado - DeltaTracking 2026
