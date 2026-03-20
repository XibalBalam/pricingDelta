import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Map as MapIcon, 
  Globe, 
  History, 
  Crown, 
  ShieldCheck,
  Download,
  Loader
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useDistributorPricing } from '../../hooks/useDistributorPricing';
import { cn } from '../../lib/utils';

// --- Subcomponents ---

const NumberTicker = ({ value, className }: { value: number; className?: string }) => {
  return (
    <span className={cn("inline-block font-mono tabular-nums tracking-tighter", className)}>
      ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
};


// --- Particle System ---
type Particle = {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
};

const ParticleSystem = ({ particles, onComplete }: { particles: Particle[], onComplete: (id: string) => void }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.startX, y: p.startY, opacity: 1, scale: 0.5 }}
            animate={{ 
              x: p.endX, 
              y: p.endY, 
              opacity: 0,
              scale: [0.5, 1.5, 0.2],
              rotate: 180
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onAnimationComplete={() => onComplete(p.id)}
            className="absolute w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]"
            style={{ color: p.color, backgroundColor: 'currentColor' }}
          >
             <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-full h-full"
             >
                ✨
             </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- Main Pricing Calculator V2 ---

const generateQuoteNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `DT-${timestamp}-${random}`.substring(0, 20);
};

const generatePDF = async (
  _logoUrl: string,
  quantity: number,
  _tier: string,
  tierName: string,
  isAnnual: boolean,
  addons: any,
  includedFeatures: string[],
  breakdown: any,
  totalCost: number,
  _currentServicePrice: any
): Promise<void> => {
  // Simulate PDF generation delay for visual feedback
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const colWidth = pageWidth - 2 * margin;
  let yPosition = 10;

  // Generate unique quote number
  const quoteNumber = generateQuoteNumber();
  const quoteDate = new Date().toLocaleDateString('es-ES');

  const checkPageBreak = (minHeight: number) => {
    if (yPosition + minHeight > pageHeight - 15) {
      doc.addPage();
      yPosition = 10;
    }
  };

  // ===== HEADER WITH LOGO AND TITLE =====
  doc.addImage('/Logo_claro.jpg', 'JPEG', margin, yPosition, 50, 14);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 93, 160);
  doc.text('PROPUESTA DE PRECIOS', margin + 55, yPosition + 7);
  
  yPosition += 20;

  // ===== BLUE DIVIDER =====
  doc.setDrawColor(0, 93, 160);
  doc.setLineWidth(2);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // ===== QUOTE INFO (3 COLUMNS) =====
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const colWidth3 = (colWidth - 4) / 3;
  const quoteInfoY = yPosition;

  // Column 1: Quote Number
  doc.setFont('helvetica', 'bold');
  doc.text('Nº Cotización:', margin, quoteInfoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 93, 160);
  doc.text(quoteNumber, margin, quoteInfoY + 5);
  
  // Column 2: Date
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', margin + colWidth3 + 2, quoteInfoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 93, 160);
  doc.text(quoteDate, margin + colWidth3 + 2, quoteInfoY + 5);
  
  // Column 3: Period
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('Período:', margin + (colWidth3 + 2) * 2, quoteInfoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 93, 160);
  doc.text(isAnnual ? 'Anual' : 'Mensual', margin + (colWidth3 + 2) * 2, quoteInfoY + 5);

  yPosition += 16;

  // ===== PLAN DETAILS SECTION =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 93, 160);
  doc.text('DETALLES DEL PLAN', margin, yPosition);
  yPosition += 8;

  // Plan details table
  doc.setFontSize(10);
  const planData = [
    ['Plan:', tierName],
    ['Unidades:', quantity.toString()],
    ['Precio / Unidad:', `$${(breakdown.base / quantity).toFixed(2)}`],
    ['Subtotal:', `$${breakdown.base.toFixed(2)}`]
  ];

  planData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(label, margin, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 93, 160);
    doc.text(value, pageWidth - margin - 50, yPosition, { align: 'left' });
    yPosition += 6;
  });

  // Bonus row - SOLO PARA PLAN ANUAL
  const bonusUnits = isAnnual ? Math.floor(quantity / 10) : 0;
  if (bonusUnits > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Bonificación:', margin, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 34);
    doc.text(`+${bonusUnits} espacios`, pageWidth - margin - 50, yPosition, { align: 'left' });
    yPosition += 6;
  }

  yPosition += 4;

  // ===== ADD-ONS SECTION =====
  checkPageBreak(30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 93, 160);
  doc.text('CARACTERÍSTICAS', margin, yPosition);
  yPosition += 8;

  // Build addon list
  const addonItems = [];
  if (includedFeatures.includes('logo') || addons.logo) {
    addonItems.push({ 
      label: 'Logo Personalizado', 
      status: includedFeatures.includes('logo') ? 'INCLUIDO' : '+$1.50/mes',
      color: includedFeatures.includes('logo') ? [34, 139, 34] : [0, 93, 160]
    });
  }
  if (includedFeatures.includes('domain') || addons.domain) {
    addonItems.push({ 
      label: 'Dominio Propio', 
      status: includedFeatures.includes('domain') ? 'INCLUIDO' : '+$1.50/mes',
      color: includedFeatures.includes('domain') ? [34, 139, 34] : [0, 93, 160]
    });
  }
  if (addons.maps) {
    addonItems.push({ label: 'Google Maps Premium', status: '+$2.00/mes', color: [0, 93, 160] });
  }
  if (addons.history > 0) {
    const historyPrice = addons.history === 3 ? '$2.00' : addons.history === 6 ? '$4.00' : '$6.00';
    addonItems.push({ label: `Historial ${addons.history}M`, status: `${historyPrice}/mes`, color: [0, 93, 160] });
  } else if (includedFeatures.some(f => f.startsWith('history-'))) {
    const months = includedFeatures.find(f => f.startsWith('history-'))?.split('-')[1];
    addonItems.push({ label: `Historial ${months}M`, status: 'INCLUIDO', color: [34, 139, 34] });
  }

  if (addonItems.length > 0) {
    doc.setFontSize(9);
    addonItems.forEach((item) => {
      checkPageBreak(5);
      
      // Label with bullet
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`• ${item.label}`, margin + 2, yPosition);
      
      // Status
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      doc.text(item.status, pageWidth - margin - 40, yPosition, { align: 'left' });
      
      yPosition += 6;
    });
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('• Plan con características estándar', margin + 2, yPosition);
    yPosition += 6;
  }

  yPosition += 6;

  // ===== TOTAL SECTION =====
  checkPageBreak(20);
  
  // Separator line
  doc.setDrawColor(0, 93, 160);
  doc.setLineWidth(1.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 93, 160);
  doc.text(`TOTAL ${isAnnual ? 'ANUAL' : 'MENSUAL'}:`, margin, yPosition);
  
  doc.setFontSize(20);
  doc.text(`$${totalCost.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });
  
  yPosition += 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Precio unitario: $${(totalCost / quantity).toFixed(2)}`, margin, yPosition);

  yPosition += 10;

  // ===== TERMS AND CONDITIONS =====
  checkPageBreak(40);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 93, 160);
  doc.text('TÉRMINOS Y CONDICIONES', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  const terms = [
    '• Validez: 30 días desde la fecha de emisión.',
    '• Pago: Mensual, trimestral o anual según negociación.',
    '• Activación: Tras confirmación de pago y firma de contrato.',
    '• Bonificaciones: Válidas durante la vigencia del contrato.',
    '• Soporte: 24/7 vía email y chat según el plan.',
    '• SLA: 99.5% disponibilidad garantizada.',
    '• Privacidad: Cumplimiento GDPR y normativas locales.'
  ];

  terms.forEach((term) => {
    checkPageBreak(4);
    const splitText = doc.splitTextToSize(term, colWidth - 4);
    doc.text(splitText, margin + 2, yPosition);
    yPosition += splitText.length * 3.5 + 1;
  });

  yPosition += 4;

  // ===== FOOTER =====
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('Para más información o aceptar, contáctenos', margin, yPosition);
  
  yPosition += 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 93, 160);
  doc.text('DeltaTracking', margin, yPosition);

  doc.save(`Propuesta_DeltaTracking_${quoteNumber}.pdf`);
};

export default function PricingCalculatorV2() {
  const {
    quantity, setQuantity,
    isAnnual, setIsAnnual,
    addons, setAddons,
    totalCost, breakdown, tier, includedFeatures
  } = useDistributorPricing();

  // Comparison State
  const [currentServicePrice, setCurrentServicePrice] = useState<{ monthly: number, annual: number, isManualAnnual?: boolean }>({ monthly: 0, annual: 0, isManualAnnual: false });

  // PDF Generation State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Animation State
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevAddons = useRef(addons);
  const prevIncluded = useRef(includedFeatures);

  const triggerParticle = (startInfo: string, color: string = '#ffffff') => {
      const startEl = document.getElementById(startInfo);
      const endEl = document.getElementById('summary-target');
      
      if (startEl && endEl) {
          const startRect = startEl.getBoundingClientRect();
          const endRect = endEl.getBoundingClientRect();
          
          const newParticle: Particle = {
              id: Math.random().toString(36),
              startX: startRect.left + startRect.width / 2,
              startY: startRect.top + startRect.height / 2,
              endX: endRect.left + endRect.width / 2, // Aim for the center-right of summary
              endY: endRect.top + endRect.height / 2,
              color: color
          };
          
          setParticles(prev => [...prev, newParticle]);
      }
  };

  useEffect(() => {
     // Check for new addons
     const currentAddons = addons;
     const currentIncluded = includedFeatures;
     const pAddons = prevAddons.current;
     const pIncluded = prevIncluded.current;
     
     const particleColor = tier === 'elite' ? '#ffffff' : '#005DA0';

     // Logo
     if ((currentAddons.logo && !pAddons.logo) || (currentIncluded.includes('logo') && !pIncluded.includes('logo'))) {
         triggerParticle('item-logo', particleColor);
     }
     // Domain
     if ((currentAddons.domain && !pAddons.domain) || (currentIncluded.includes('domain') && !pIncluded.includes('domain'))) {
         triggerParticle('item-domain', particleColor);
     }
     // Maps
     if (currentAddons.maps && !pAddons.maps) {
         triggerParticle('item-maps', particleColor);
     }
     // History
     if (currentAddons.history !== 0 && currentAddons.history !== pAddons.history) {
         triggerParticle(`item-history-${currentAddons.history}`, particleColor);
     }
      // History Included logic (approximate)
     if (currentIncluded.includes('history-3') && !pIncluded.includes('history-3')) triggerParticle('item-history-3', particleColor);
     if (currentIncluded.includes('history-6') && !pIncluded.includes('history-6')) triggerParticle('item-history-6', particleColor);
     
     prevAddons.current = currentAddons;
     prevIncluded.current = currentIncluded;

  }, [addons, includedFeatures, tier]);

  // Tier-based Background/Theme Logic
  const isElite = tier === 'elite';
  
  // Mapping for Display Names
  const tierName = tier === 'essential' 
    ? "Plan Inicio" 
    : tier === 'professional' 
      ? "Plan Escala" 
      : "Socio Distribuidor";

  return (
    <motion.div 
      animate={{
        backgroundColor: isElite ? '#005DA0' : '#ffffff',
      }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className={cn(
        "min-h-screen w-full font-sans transition-colors duration-700 selection:bg-brand-blue selection:text-white",
        isElite ? "text-white" : "text-slate-900" // FORCE TEXT COLOR
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-16">
        
        <ParticleSystem 
            particles={particles} 
            onComplete={(id) => setParticles(prev => prev.filter(p => p.id !== id))} 
        />

        {/* --- Main Layout Grid --- */}
        <div className="flex flex-col xl:flex-row gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Header + Slider + Addons */}
          <div className="w-full xl:flex-1 flex flex-col gap-8 lg:gap-12 order-1">

            {/* HEADER MOVED INSIDE LEFT COLUMN */}
            <header className="max-w-2xl">
              <div className="mb-8 h-12 flex items-center">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={isElite ? "elite" : "standard"}
                    src={isElite ? "/Logo_Negativo.png" : "/Logo_claro.jpg"}
                    alt="DeltaTracking"
                    className="h-12 w-auto object-contain"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </AnimatePresence>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-4"
              >
                 <span className={cn(
                    "px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full border",
                    isElite 
                      ? "bg-white/10 text-white border-white/20" 
                      : "bg-blue-100 text-brand-blue border-blue-200"
                  )}>
                    {tierName}
                  </span>
              </motion.div>
              <h1 className={cn("text-3xl md:text-5xl font-bold tracking-tight mb-4", isElite ? "text-white" : "text-brand-deep")}>
                Elige tu plan
              </h1>
              <p className={cn("text-base md:text-lg font-medium", isElite ? "text-blue-100" : "text-slate-600")}>
                Ajusta el volumen y personaliza tu plataforma.
              </p>
            </header>

            {/* ORDER 1: SLIDER CONFIGURATION */}
            <section className={cn("p-6 lg:p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden", 
                   isElite ? "bg-white/10 border-white/20" : "bg-white border-slate-200 shadow-sm"
            )}>
                  <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 relative z-10">
                      <div>
                          <label 
                              title="Ingresa la cantidad de unidades que necesitas. Mínimo 10 unidades. Afecta el plan automático y las bonificaciones."
                              className={cn("text-xs font-bold uppercase tracking-widest block mb-2 cursor-help", isElite ? "text-blue-200" : "text-brand-blue")}>
                              Volumen de Unidades
                          </label>
                          <div className="flex items-baseline gap-2">
                               <input 
                                  type="number" 
                                  placeholder="10+"
                                  title="Ingresa la cantidad de unidades. Mínimo 10."
                                  value={quantity}
                                  onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '') {
                                          setQuantity(0); // Allow clearing (logic handles invalid by clamping elsewhere or we just show 0)
                                      } else {
                                          const num = parseInt(val);
                                          setQuantity(isNaN(num) ? 0 : num); 
                                      }
                                  }}
                                  onBlur={() => {
                                      if (quantity < 10) setQuantity(10);
                                  }}
                                  className={cn(
                                      "text-5xl font-bold bg-transparent border-b-2 focus:outline-none w-48 font-mono tabular-nums leading-none transition-colors",
                                      isElite 
                                        ? "text-white border-white/30 focus:border-white" 
                                        : "text-slate-900 border-slate-200 focus:border-brand-blue"
                                  )}
                               />
                          </div>
                      </div>

                      {/* Comparison Inputs (Moved Here) */}
                      <div className="flex gap-4">
                          <div>
                              <label 
                                  title="Tu costo actual por unidad en plan mensual. Se usa para comparar ahorros."
                                  className={cn("text-[10px] uppercase font-bold tracking-wider mb-1 block text-right cursor-help", isElite ? "text-blue-200" : "text-slate-500")}>
                                  Tu Costo Mensual
                              </label>
                              <div className="relative">
                                  <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold", isElite ? "text-white" : "text-slate-400")}>$</span>
                                  <input 
                                      type="number" 
                                      placeholder="0.00"
                                      title="Tu costo actual por unidad en plan mensual. Ingresa para ver la comparación de ahorros."
                                      className={cn(
                                          "w-32 pl-6 pr-2 py-2 rounded-lg text-sm font-bold bg-transparent border-2 focus:outline-none transition-colors",
                                          isElite 
                                              ? "border-white/20 text-white placeholder-white/20 focus:border-white" 
                                              : "border-slate-200 text-slate-900 placeholder-slate-300 focus:border-brand-blue"
                                      )}
                                      value={currentServicePrice.monthly || ''}
                                      onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setCurrentServicePrice(prev => ({
                                              ...prev,
                                              monthly: val,
                                              annual: prev.isManualAnnual ? prev.annual : Number((val * 12).toFixed(2))
                                          }));
                                      }}
                                  />
                              </div>
                          </div>
                          <div>
                              <label 
                                  title="Tu costo actual por unidad en plan anual. Se calcula automáticamente pero puedes editarlo manualmente."
                                  className={cn("text-[10px] uppercase font-bold tracking-wider mb-1 block text-right cursor-help", isElite ? "text-blue-200" : "text-slate-500")}>
                                  Tu Costo Anual
                              </label>
                              <div className="relative">
                                  <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold", isElite ? "text-white" : "text-slate-400")}>$</span>
                                  <input 
                                      type="number" 
                                      placeholder="0.00"
                                      title="Tu costo actual por unidad en plan anual. Modifica para recalcular ahorros."
                                      className={cn(
                                          "w-32 pl-6 pr-2 py-2 rounded-lg text-sm font-bold bg-transparent border-2 focus:outline-none transition-colors",
                                          isElite 
                                              ? "border-white/20 text-white placeholder-white/20 focus:border-white" 
                                              : "border-slate-200 text-slate-900 placeholder-slate-300 focus:border-brand-blue"
                                      )}
                                      value={currentServicePrice.annual || ''}
                                      onChange={(e) => setCurrentServicePrice({
                                          ...currentServicePrice, 
                                          annual: Number(e.target.value),
                                          isManualAnnual: true
                                      })}
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
            </section>

            {/* ORDER 3: ADD-ONS (MOVED UP, NOW PART OF LEFT COLUMN FLOW) */}
            <section className="space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <h3 
                         title="Agrega características opcionales a tu plan: Logo, Dominio, Google Maps y Historial de datos."
                         className={cn("text-xl font-bold cursor-help", isElite ? "text-white" : "text-slate-900")}>
                         Add-ons & Branding
                     </h3>
                     
                     <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 dark:border-white/20 dark:bg-black/20 self-start sm:self-auto">
                        <button 
                            onClick={() => setIsAnnual(false)}
                            title="Plan con pago mensual. Más caro pero sin compromiso a largo plazo. Sin bonificaciones."
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                !isAnnual 
                                    ? (isElite ? "bg-white shadow-sm text-slate-900" : "bg-[#005DA0] text-white shadow-sm") 
                                    : (isElite ? "text-slate-600 dark:text-blue-100" : "text-black")
                            )}
                        >Mensual</button>
                        <button 
                            onClick={() => setIsAnnual(true)}
                            title="Plan con pago anual. Más barato y con 10% de espacios bonus (1 por cada 10 unidades). Recomendado."
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                isAnnual 
                                    ? (isElite ? "bg-white text-black shadow-sm" : "bg-[#005DA0] text-white shadow-sm") 
                                    : (isElite ? "text-slate-600 dark:text-blue-100" : "text-black")
                            )}
                        >Anual (-20%)</button>
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Brand Addons */}
                    <AddonCard 
                        label="Logo Personalizado"
                        description="Tu marca en el login y reportes."
                        icon={Crown}
                        price={1.50}
                        isIncluded={includedFeatures.includes('logo')}
                        isActive={addons.logo}
                        onToggle={() => setAddons({...addons, logo: !addons.logo})}
                        isElite={isElite}
                        id="item-logo"
                    />
                    <AddonCard 
                        label="Dominio Propio"
                        description="URL personalizada (tuexpreso.com)."
                        icon={Globe}
                        price={1.50}
                        isIncluded={includedFeatures.includes('domain')}
                        isActive={addons.domain}
                        onToggle={() => setAddons({...addons, domain: !addons.domain})}
                        isElite={isElite}
                        id="item-domain"
                    />
                    <AddonCard 
                        label="Google Maps Premium"
                        description="Capas de Google Maps Premium."
                        icon={MapIcon}
                        price={2.00}
                        isIncluded={false}
                        isActive={addons.maps}
                        onToggle={() => setAddons({...addons, maps: !addons.maps})}
                        isElite={isElite}
                        id="item-maps"
                    />
                    
                    {/* History Selector */}
                    <div className={cn(
                        "p-4 rounded-xl border flex flex-col justify-between transition-all min-h-[120px]",
                        isElite ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
                    )}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", isElite ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600")}>
                                    <History size={20} />
                                </div>
                                <div>
                                    <div className={cn("font-semibold text-sm", isElite ? "text-white" : "text-brand-deep")}>Historial</div>
                                    <div className={cn("text-xs", isElite ? "text-blue-200" : "text-slate-600 font-medium")}>Retención de data</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-auto">
                            {[3, 6, 12].map(m => {
                                const isActive = addons.history === m;
                                
                                // Check if this specific tier is included/free based on plan
                                let isFreeTier = false;
                                if (m === 3 && (includedFeatures.includes('history-3') || includedFeatures.includes('history-6'))) isFreeTier = true;
                                if (m === 6 && includedFeatures.includes('history-6')) isFreeTier = true;

                                // Calculate Display Price
                                let rawPrice = 0; 
                                if (m === 3) rawPrice = 2.00;
                                if (m === 6) rawPrice = 4.00;
                                if (m === 12) rawPrice = 6.00;

                                // Calculate discount
                                let discount = 0;
                                if (includedFeatures.includes('history-6')) discount = 4.00;
                                else if (includedFeatures.includes('history-3')) discount = 2.00;

                                let effectivePrice = Math.max(0, rawPrice - discount);
                                if (!isAnnual) effectivePrice = (effectivePrice / 12) * 1.2;

                                return (
                                    <button 
                                        key={m}
                                        id={`item-history-${m}`}
                                        onClick={() => setAddons({...addons, history: isActive ? 0 : m as any})}
                                        className={cn(
                                            "flex-1 flex flex-col items-center justify-center py-2 rounded-lg border font-medium transition-all relative min-h-[50px]",
                                            isActive 
                                                ? (isElite ? "bg-white/20 border-white text-white" : "bg-[#005DA0] border-[#005DA0] text-white shadow-md shadow-blue-900/20")
                                                : (isElite ? "bg-transparent border-white/10 text-blue-200 hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")
                                        )}
                                    >
                                        <span className="text-[10px] uppercase font-bold tracking-wider mb-0.5">{m} MESES</span>
                                        {isFreeTier ? (
                                            <span className={cn("text-xs font-black", isActive ? "text-white" : "text-[#005DA0] dark:text-blue-400")}>¡Gratis!</span>
                                        ) : (
                                            <span className={cn("text-xs font-mono", isActive ? "text-white/90" : "text-slate-500")}>
                                                ${effectivePrice.toFixed(2)}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Summary and Comparison */}
          <div className="w-full xl:flex-1 order-2 xl:sticky xl:top-8"> 
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
               {/* Comparison Card */}
               <div className={cn(
                  "rounded-2xl border-2 p-6 backdrop-blur-xl transition-all duration-500 flex flex-col gap-6 shadow-xl overflow-hidden min-h-[320px]",
                  isElite 
                      ? "bg-white/10 border-white/20 shadow-black/20" 
                      : "bg-white/80 border-slate-200 shadow-slate-200/50"
               )}>
                  <div>
                      <h2 className={cn("text-lg font-bold flex items-center gap-2", isElite ? "text-white" : "text-slate-900")}>
                          Servicio Actual
                      </h2>
                      <p className={cn("text-xs mt-1", isElite ? "text-blue-200" : "text-slate-500")}>Tu proveedor actual</p>
                   </div>
                   
                   <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-white/10">
                          <span className={cn("font-medium", isElite ? "text-blue-200" : "text-slate-600")}>Unidades</span>
                          <span className={cn("font-bold font-mono", isElite ? "text-white" : "text-slate-900")}>{quantity}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-white/10">
                          <span className={cn("font-medium", isElite ? "text-blue-200" : "text-slate-600")}>Costo Unitario</span>
                          <div className={cn("font-mono font-semibold", isElite ? "text-white" : "text-slate-900")}>
                             <NumberTicker value={isAnnual ? currentServicePrice.annual : currentServicePrice.monthly} />
                          </div>
                      </div>
                      <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-white/10 opacity-50">
                          <span className={cn("font-medium", isElite ? "text-blue-200" : "text-slate-600")}>Sin Add-ons</span>
                          <div className={cn("font-mono font-semibold", isElite ? "text-white" : "text-slate-900")}>
                             -
                          </div>
                      </div>
                  </div>

                  {/* Total Comparison */}
                  <div className={cn("mt-auto rounded-xl p-4 text-center transition-colors border", 
                      isElite ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  )}>
                      <div className={cn("text-xs font-bold uppercase tracking-widest mb-1", isElite ? "text-blue-200" : "text-slate-400")}>
                          Total {isAnnual ? "Anual" : "Mensual"}
                      </div>
                      
                      <div className="text-4xl lg:text-3xl font-black font-mono tracking-tighter mb-1">
                          <NumberTicker value={isAnnual ? currentServicePrice.annual * quantity : currentServicePrice.monthly * quantity} />
                      </div>
                      
                      <div className={cn("text-[10px]", isElite ? "text-blue-200" : "text-slate-400")}>
                           ${isAnnual ? currentServicePrice.annual.toFixed(2) : currentServicePrice.monthly.toFixed(2)} / unidad
                      </div>
                  </div>

                   <button disabled className={cn(
                      "w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm opacity-50 cursor-not-allowed",
                      isElite 
                          ? "bg-white/10 text-white" 
                          : "bg-slate-100 text-slate-400"
                  )}>
                      Versus Delta
                  </button>
               </div>

               {/* Summary Card */}
               <div className={cn(
                  "rounded-2xl border-2 p-6 backdrop-blur-xl transition-all duration-500 flex flex-col gap-6 shadow-2xl overflow-hidden min-h-[320px] relative",
                  isElite 
                      ? "bg-white/10 border-white/20 shadow-black/20" 
                      : "bg-white/80 border-brand-blue/10 shadow-brand-blue/5"
               )}>
                   {/* Decorative Top Border for Elite */}
                   {isElite && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/0 via-white to-white/0 animate-glow" />}

                   <div>
                      <h2 className={cn("text-lg font-bold flex items-center gap-2", isElite ? "text-white" : "text-slate-900")}>
                          <ShieldCheck size={20} className={isElite ? "text-white" : "text-brand-blue"} />
                          Propuesta DeltaTracking
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">Precios en USD</p>
                   </div>

                   {/* Line Items */}
                   <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-white/10">
                          <span className={cn("font-medium", isElite ? "text-blue-200" : "text-slate-600")}>Unidades</span>
                          <span className={cn("font-bold font-mono", isElite ? "text-white" : "text-brand-deep")}>{quantity}</span>
                      </div>
                      {isAnnual && (
                      <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-white/10">
                          <span className={cn("font-medium", isElite ? "text-blue-200" : "text-slate-600")}>Bonificación</span>
                          <span className={cn("font-bold font-mono", isElite ? "text-green-400" : "text-green-600")}>+{Math.floor(quantity / 10)} Espacios</span>
                      </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-white/10">
                          <span className={cn("font-medium", isElite ? "text-blue-200" : "text-slate-600")}>Plan ({tierName})</span>
                          <div className={cn("font-mono font-semibold", isElite ? "text-white" : "text-brand-deep")}>
                             <NumberTicker value={breakdown.base} />
                          </div>
                      </div>
                      <div id="summary-target" className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-white/10 relative">
                          <span className={cn("font-medium", isElite ? "text-blue-200" : "text-slate-600")}>Add-ons</span>
                          <div className={cn("font-mono font-semibold", isElite ? "text-white" : "text-green-600 dark:text-green-400")}>
                             +<NumberTicker value={breakdown.addons} />
                          </div>
                      </div>
                  </div>

                  {/* Total */}
                  <div className={cn("mt-auto rounded-xl p-4 text-center transition-colors border", 
                      isElite ? "bg-black/20 border-white/10" : "bg-blue-50/50 border-brand-blue/10"
                  )}>
                      <div className={cn("text-xs font-bold uppercase tracking-widest mb-1", isElite ? "text-blue-200" : "text-brand-blue/60")}>
                          Total {isAnnual ? "Anual" : "Mensual"}
                      </div>
                      
                      <div className={cn("text-4xl lg:text-3xl font-black font-mono tracking-tighter mb-1", 
                          isElite ? "text-white" : "text-brand-blue"
                      )}>
                          <NumberTicker value={totalCost} />
                      </div>
                      
                      <div className={cn("text-[10px]", isElite ? "text-blue-200" : "text-brand-blue/40")}>
                           ${(totalCost/quantity).toFixed(2)} / unidad
                      </div>
                  </div>

                  <button 
                      onClick={async () => {
                          setIsGeneratingPDF(true);
                          try {
                              await generatePDF(
                                  "/Logo_claro.jpg",
                                  quantity,
                                  tier,
                                  tierName,
                                  isAnnual,
                                  addons,
                                  includedFeatures,
                                  breakdown,
                                  totalCost,
                                  currentServicePrice
                              );
                          } finally {
                              setIsGeneratingPDF(false);
                          }
                      }}
                      disabled={isGeneratingPDF}
                      className={cn(
                      "w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 group transition-all text-sm disabled:opacity-75",
                      isElite 
                          ? "bg-white text-black shadow-lg hover:bg-slate-50 disabled:hover:bg-white" 
                          : "bg-[#005DA0] text-white hover:bg-blue-700 hover:shadow-lg disabled:hover:bg-[#005DA0]"
                  )}>
                      {isGeneratingPDF ? (
                          <>
                              Generando...
                              <Loader size={16} className="animate-spin" />
                          </>
                      ) : (
                          <>
                              Descargar Propuesta
                              <Download size={16} className="group-hover:scale-110 transition-transform" />
                          </>
                      )}
                  </button>
               </div>
               </div>

                {/* Savings Calculation (Centered Below) */}
                   {(isAnnual ? currentServicePrice.annual : currentServicePrice.monthly) > 0 && (() => {
                       const userUnitCost = isAnnual ? currentServicePrice.annual : currentServicePrice.monthly;
                       const userTotal = userUnitCost * quantity;
                       const bonusUnits = isAnnual ? Math.floor(quantity / 10) : 0;
                       const bonusValue = bonusUnits * userUnitCost;
                       
                       // Calculate RAW difference first: User - Delta
                       const rawDiff = userTotal - totalCost;
                       const finalAdvantage = rawDiff + bonusValue;
                       const isSaving = finalAdvantage > 0;
                       
                       // Determine if the CASH difference is a saving or cost
                       const isCashSaving = rawDiff > 0;
                       
                       return (
                           <div className={cn(
                               "mt-2 p-4 rounded-xl border flex flex-col justify-between items-center gap-2 text-center shadow-lg",
                               isSaving 
                                   ? (isElite ? "bg-green-500/20 border-green-500/50 text-white" : "bg-green-50 border-green-200 text-green-800")
                                   : (isElite ? "bg-red-500/20 border-red-500/50 text-white" : "bg-red-50 border-red-200 text-red-800")
                           )}>
                               {/* Row 1: Cash Difference */}
                               <div className="flex justify-between items-center w-full gap-4">
                                   <div className="text-xs font-bold uppercase tracking-wide opacity-90">
                                       {isCashSaving ? "Diferencia a favor" : "Diferencia en pago"}
                                   </div>
                                   <div className="font-mono font-black text-2xl">
                                       <NumberTicker value={Math.abs(rawDiff)} />
                                       <span className="text-[10px] font-medium ml-1 opacity-70">/ {isAnnual ? 'año' : 'mes'}</span>
                                   </div>
                               </div>
                               
                               {/* Row 2: Bonus Value */}
                               {bonusUnits > 0 && (
                                    <div className={cn(
                                        "w-full pt-2 mt-1 border-t text-xs flex justify-between items-center",
                                        isSaving 
                                            ? (isElite ? "border-green-500/30 text-green-100" : "border-green-200 text-green-800")
                                            : (isElite ? "border-red-500/30 text-red-100" : "border-red-200 text-red-800")
                                    )}>
                                        <span>
                                            Aprovechando los <span className={cn("font-extrabold mx-0.5 px-1 py-0.5 rounded text-[10px]", isElite ? "bg-white text-black" : "bg-[#005DA0] text-white")}>{bonusUnits} espacios</span> de bonificación
                                        </span>
                                        <span className="font-bold">+<NumberTicker value={bonusValue} /></span>
                                    </div>
                               )}

                               {/* Row 3: Total Effective Benefit */}
                               <div className={cn(
                                   "w-full pt-3 mt-2 border-t-2 flex justify-between items-center font-black",
                                   isSaving 
                                       ? (isElite ? "border-green-500/30" : "border-green-200")
                                       : (isElite ? "border-red-500/30" : "border-red-200")
                               )}>
                                   <div className="text-lg uppercase tracking-widest">
                                       {isSaving ? "Ahorro Total" : "Diferencia Total"}
                                   </div>
                                   <div className="font-mono text-4xl">
                                       <NumberTicker value={Math.abs(finalAdvantage)} />
                                   </div>
                               </div>
                           </div>
                       );
                   })()}

          </div>

          
        </div>
      </div>
    </motion.div>
  );
}

// --- Helper Component: AddonCard V2 ---
const AddonCard = ({ 
    label, icon: Icon, price, isIncluded, isActive, onToggle, isElite, description, id 
}: { 
    label: string, icon: any, price: number, isIncluded: boolean, isActive: boolean, onToggle: () => void, isElite: boolean, description?: string, id?: string 
}) => {
    
    // Function that runs on click. If included, it does nothing as it's locked.
    const handleClick = () => {
        if (!isIncluded) onToggle();
    };

    return (
        <div 
            id={id}
            onClick={handleClick}
            className={cn(
                "relative group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none overflow-hidden",
                // Included State (Highest Priority Visuals)
                isIncluded 
                    ? (isElite ? "bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-[#005DA0] border-[#005DA0] shadow-md shadow-blue-900/20")
                    : isActive 
                        ? (isElite ? "bg-white/10 border-white" : "bg-[#005DA0] border-[#005DA0] shadow-md shadow-blue-900/20") 
                        : (isElite ? "bg-transparent border-white/10 hover:bg-white/5" : "bg-white border-slate-300 hover:border-brand-blue/40 hover:shadow-sm"),
                // Disabled/Locked state opacity
                isIncluded && "cursor-default"
            )}
        >
            {/* INCLUIDO Badge - Top Left Corner */}
             {isIncluded && (
                <div className={cn(
                    "absolute top-0 left-0 px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-br-lg z-20",
                    isElite ? "bg-black text-white" : "bg-black text-white"
                )}>
                    Incluido
                </div>
             )}

            {/* Left Side: Icon + Label */}
            <div className={cn("flex items-center gap-3 z-10 w-full transition-opacity", isIncluded ? "pt-2" : "")}>
                <div className={cn(
                    "p-2 rounded-lg transition-colors shrink-0",
                    isIncluded 
                        ? (isElite ? "bg-black text-white" : "bg-white text-black") 
                        : isActive 
                            ? (isElite ? "bg-white text-black" : "bg-white text-black") 
                            : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-blue-200"
                )}>
                    <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                         <div className={cn("font-medium text-sm truncate", isElite ? "text-white" : (isActive || isIncluded ? "text-white" : "text-brand-deep"))}>{label}</div>
                     </div>
                     <div className={cn("text-xs leading-tight mt-0.5 pr-2", isElite ? "text-blue-200" : (isActive || isIncluded ? "text-blue-100" : "text-slate-600 font-medium"))}>{description || "Mejora opcional"}</div>
                </div>
            </div>

            {/* Right Side: Price + Checkbox/Lock */}
            <div className={cn("text-right z-10 flex flex-col items-end gap-1 shrink-0", isIncluded ? "pt-2" : "")}>
                 {/* Price Display */}
                 <div className="flex items-center gap-2">
                    <span className={cn(
                        "font-mono text-sm font-semibold",
                        isIncluded ? (isElite ? "text-white" : "text-white") : (isElite || isActive ? "text-white" : "text-slate-900")
                    )}>
                        {isIncluded ? <span className="text-[10px] font-bold opacity-90">GRATIS</span> : `$${price.toFixed(2)}`}
                    </span>
                 </div>

                {/* State Indicator */}
                <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center transition-all",
                    isIncluded ? (isElite ? "bg-black text-white" : "bg-white text-black") :
                    isActive 
                        ? (isElite ? "bg-white text-black" : "bg-white text-black") 
                        : "border border-slate-300 dark:border-white/20"
                )}>
                    {isIncluded ? (
                        <Check size={12} strokeWidth={3} />
                    ) : (
                        isActive && <Check size={12} strokeWidth={3} />
                    )}
                </div>
            </div>

            {/* Subtle glow for Elite + Active */}
            {isElite && isActive && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />}
            {isElite && isIncluded && <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />}
        </div>
    );
};
