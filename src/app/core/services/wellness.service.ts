import { Injectable, signal, computed } from '@angular/core';
import {
  ServiceItem,
  BodyZone,
  ProcessStep,
  Testimonial,
  FaqItem,
  SocialPost,
  BenefitItem
} from '../models/wellness.model';

@Injectable({
  providedIn: 'root'
})
export class WellnessService {
  readonly businessPhone = '+57 314 2529565';
  readonly rawPhone = '573142529565';
  readonly defaultBookingMsg = 'Hola Danna 👋 Vi tu página web y quisiera conocer disponibilidad para una sesión.';

  // Services
  readonly services = signal<ServiceItem[]>([
    {
      id: 'masaje-relajante',
      number: '01',
      title: 'Masaje relajante',
      subtitle: 'Descanso profundo y calma mental',
      description: 'Reduce el estrés, libera tensión y disfruta un momento de descanso profundo.',
      duration: '60 - 75 min',
      benefits: ['Calma el sistema nervioso', 'Alivia la fatiga mental y muscular', 'Mejora la calidad del sueño'],
      idealFor: 'Estrés acumulado, sobrecarga mental, cansancio general',
      icon: 'sparkles',
      tag: 'Descanso Profundo',
      whatsappMsg: 'Hola Danna 👋 Quisiera conocer disponibilidad para agendar un Masaje Relajante.'
    },
    {
      id: 'masaje-descontracturante',
      number: '02',
      title: 'Masaje descontracturante',
      subtitle: 'Alivio focalizado de nudos y contracturas',
      description: 'Trabajo localizado para aliviar tensión muscular acumulada.',
      duration: '60 - 75 min',
      benefits: ['Deshace contracturas profundas', 'Aumenta la oxigenación muscular', 'Devuelve la flexibilidad'],
      idealFor: 'Dolores cervicales, tensión de oficina, rigidez en espalda',
      icon: 'zap',
      tag: 'Alivio Muscular',
      whatsappMsg: 'Hola Danna 👋 Quisiera consultar disponibilidad para un Masaje Descontracturante.'
    },
    {
      id: 'terapia-fisica',
      number: '03',
      title: 'Terapia física',
      subtitle: 'Rehabilitación, función y movimiento',
      description: 'Tratamientos enfocados en movilidad, recuperación y bienestar físico.',
      duration: '60 min',
      benefits: ['Recuperación de rango de movimiento', 'Técnicas manuales especializadas', 'Alivio de molestias articulares'],
      idealFor: 'Molestias crónicas, recuperación de movilidad, prevención de lesiones',
      icon: 'activity',
      tag: 'Movilidad & Función',
      whatsappMsg: 'Hola Danna 👋 Me gustaría consultar sobre una sesión de Terapia Física.'
    },
    {
      id: 'correccion-postural',
      number: '04',
      title: 'Corrección postural',
      subtitle: 'Alineación y ergonomía corporal',
      description: 'Mejora hábitos posturales y reduce molestias relacionadas con posiciones prolongadas.',
      duration: '60 min',
      benefits: ['Conciencia biomecánica corporal', 'Descompresión de cuello y lumbares', 'Pautas ergonómicas aplicables a tu día'],
      idealFor: 'Teletrabajo prolongado, encorvamiento, dolor al estar sentado',
      icon: 'shield-check',
      tag: 'Salud Postural',
      whatsappMsg: 'Hola Danna 👋 Quisiera agendar una valoración de Corrección Postural.'
    },
    {
      id: 'atencion-personalizada',
      number: '05',
      title: 'Atención personalizada',
      subtitle: 'Enfoque integral a tu medida',
      description: 'Cada sesión se adapta a tus necesidades y objetivos particulares tras una breve valoración inicial.',
      duration: '60 - 90 min',
      benefits: ['Combinación a medida de técnicas manuales', 'Enfoque en tu zona de mayor molestia', 'Recomendaciones prácticas para tu rutina'],
      idealFor: 'Casos combinados, dolor agudo puntual, bienestar preventivo',
      icon: 'heart-handshake',
      tag: 'A tu Medida',
      whatsappMsg: 'Hola Danna 👋 Me gustaría solicitar una sesión de Atención Personalizada según mi caso.'
    }
  ]);

  // Interactive Body Zones
  readonly bodyZones = signal<BodyZone[]>([
    {
      id: 'cuello',
      name: 'Cuello & Cervicales',
      label: 'Cuello',
      symptoms: 'Rigidez al girar la cabeza, pesadez en la nuca, dolores de cabeza tensionales.',
      causes: 'Horas continuas frente a pantallas, celular inclinado, tensión emocional acumulada.',
      recommendation: 'Masaje descontracturante cervical + tracción suave y liberación miofascial.',
      suggestedService: 'Masaje Descontracturante',
      takeawayTip: 'Ajusta la altura del monitor para que el borde superior esté al nivel de tus ojos.',
      whatsappMsg: 'Hola Danna 👋 Estuve en tu sitio web. Siento mucha tensión en el cuello y la nuca, quisiera consultar una cita.',
      cx: 150,
      cy: 78
    },
    {
      id: 'hombros',
      name: 'Hombros & Trapecios',
      label: 'Hombros',
      symptoms: 'Sensación de nudos duros, hombros elevados involuntariamente, fatiga al final del día.',
      causes: 'Estrés laboral sostenido, falta de apoyo en reposabrazos, sobrecarga con bolsos/mochilas.',
      recommendation: 'Terapia focalizada en trapecios, masaje profundo con calor y estiramientos dirigidos.',
      suggestedService: 'Masaje Descontracturante + Terapia Física',
      takeawayTip: 'Realiza pausas cada 50 minutos descendiendo hombros y respirando diafragmáticamente.',
      whatsappMsg: 'Hola Danna 👋 Siento contracturas y nudos fuertes en los hombros. ¿Tienes disponibilidad para atender mi caso?',
      cx: 110,
      cy: 105
    },
    {
      id: 'espalda-alta',
      name: 'Espalda Alta & Dorsales',
      label: 'Espalda Alta',
      symptoms: 'Quemazón entre omóplatos, sensación de opresión dorsal, dificultad para abrir el pecho.',
      causes: 'Postura encorvada al escribir, debilidad de la musculatura interescapular.',
      recommendation: 'Masaje descontracturante dorsal + apertura torácica y técnicas de movilización articular.',
      suggestedService: 'Corrección Postural & Terapia Física',
      takeawayTip: 'Entrelaza manos por detrás de la espalda y abre el pecho suavemente 3 veces al día.',
      whatsappMsg: 'Hola Danna 👋 Tengo una molestia constante en la espalda alta (entre los omóplatos). Quisiera agendar contigo.',
      cx: 150,
      cy: 135
    },
    {
      id: 'espalda-baja',
      name: 'Espalda Baja & Zona Lumbar',
      label: 'Espalda Baja',
      symptoms: 'Dolor sordo al levantarse de una silla, tensión lumbar, rigidez al inclinarse.',
      causes: 'Sedentarismo prolongado, falta de soporte ergonómico lumbar, tensión en glúteos y psoas.',
      recommendation: 'Descompresión lumbar con masaje relajante descontracturante + descarga de glúteos e isquiotibiales.',
      suggestedService: 'Masaje Descontracturante + Corrección Postural',
      takeawayTip: 'Evita cruzar las piernas mientras trabajas y usa un cojín lumbar de soporte.',
      whatsappMsg: 'Hola Danna 👋 Siento sobrecarga y dolor en la espalda baja/lumbar. ¿Podrías ayudarme con una sesión?',
      cx: 150,
      cy: 195
    },
    {
      id: 'piernas',
      name: 'Piernas, Caderas & Pies',
      label: 'Piernas',
      symptoms: 'Piernas pesadas, tensión en isquiotibiales, fatiga acumulada en pantorrillas y plantas.',
      causes: 'Estar de pie durante muchas horas, caminatas largas o calzado con poca amortiguación.',
      recommendation: 'Drenaje y descarga muscular de extremidades inferiores + movilización de fascia plantar.',
      suggestedService: 'Masaje Relajante & Descarga Muscular',
      takeawayTip: 'Eleva tus piernas contra la pared durante 10 minutos al llegar a casa.',
      whatsappMsg: 'Hola Danna 👋 Quisiera agendar una descarga muscular para piernas cansadas y sobrecargadas.',
      cx: 135,
      cy: 310
    },
    {
      id: 'brazos-manos',
      name: 'Brazos, Antebrazos & Manos',
      label: 'Brazos y Manos',
      symptoms: 'Tensión en muñecas, antebrazos rígidos por teclear o usar el mouse, hormigueo leve.',
      causes: 'Uso repetitivo de teclado y celular, flexión constante de codos y muñecas.',
      recommendation: 'Terapia miofascial en antebrazo y palma de las manos para liberar sobrecarga de tendones.',
      suggestedService: 'Atención Personalizada',
      takeawayTip: 'Estira suavemente los flexores de muñeca con el brazo extendido durante 20 segundos.',
      whatsappMsg: 'Hola Danna 👋 Tengo sobrecarga en antebrazos y muñecas por trabajo de computador. Quisiera una cita.',
      cx: 75,
      cy: 185
    }
  ]);

  // Active selected body zone
  readonly selectedBodyZoneId = signal<string>('cuello');

  readonly activeBodyZone = computed(() => {
    const currentId = this.selectedBodyZoneId();
    return this.bodyZones().find(z => z.id === currentId) || this.bodyZones()[0];
  });

  // Benefits / Why Choose Danna
  readonly benefits = signal<BenefitItem[]>([
    {
      number: '01',
      title: 'Atención profesional',
      description: 'Formación y criterio terapéutico riguroso.',
      detail: 'Cada manipulación se realiza con base anatómica y técnica comprobada, garantizando un tratamiento seguro y efectivo.'
    },
    {
      number: '02',
      title: 'Tratamientos personalizados',
      description: 'Nunca aplicamos un protocolo genérico.',
      detail: 'Tu cuerpo es único: antes de empezar conversamos sobre tus actividades diarias, nivel de estrés y puntos críticos de tensión.'
    },
    {
      number: '03',
      title: 'En consultorio o a domicilio',
      description: 'Comodidad total en Bogotá.',
      detail: 'Elige visitarnos en nuestro espacio sereno en La Soledad (Teusaquillo) o recibir la sesión en tu hogar con camilla y ambiente profesional.'
    }
  ]);

  // Process Steps
  readonly processSteps = signal<ProcessStep[]>([
    {
      number: '01',
      title: 'Cuéntame qué necesitas',
      subtitle: 'Escucha activa & valoración',
      description: 'Iniciamos con una conversación breve y empática para entender tus molestias, rutina diaria y objetivos de bienestar.',
      detail: 'Identificamos si buscas relajación profunda, alivio de dolor puntual o rehabilitación de movilidad.',
      icon: 'message-circle'
    },
    {
      number: '02',
      title: 'Evaluamos tensión y movilidad',
      subtitle: 'Diagnóstico táctil y postural',
      description: 'Exploramos el estado muscular, arcos de movimiento y zonas de contractura o sobrecarga postural.',
      detail: 'Esto nos permite trazar la secuencia y presión exacta que tu cuerpo necesita en este momento.',
      icon: 'compass'
    },
    {
      number: '03',
      title: 'Realizamos tu tratamiento',
      subtitle: 'Sesión terapéutica dedicada',
      description: 'Aplicamos la combinación idónea de técnicas manuales, aceites esenciales de grado terapéutico y maniobras precisas.',
      detail: 'En un entorno cálido, silencioso y con música ambiental reconfortante que invita a desconectarse.',
      icon: 'sparkles'
    },
    {
      number: '04',
      title: 'Recomendaciones para cuidarte',
      subtitle: 'Bienestar continuo',
      description: 'Te llevas pautas sencillas de ergonomía, estiramientos y autocuidado para prolongar los beneficios de la sesión.',
      detail: 'El bienestar no termina al bajar de la camilla: te brindo herramientas prácticas para tu cotidianidad.',
      icon: 'check-circle'
    }
  ]);

  // Testimonials
  readonly testimonials = signal<Testimonial[]>([
    {
      id: '1',
      name: 'Carolina Moreno',
      roleOrLocation: 'Teusaquillo · Diseñadora UI',
      service: 'Masaje Descontracturante',
      quote: 'Excelente atención. Salí mucho más relajada y con recomendaciones muy útiles. El ambiente que crea Danna te desconecta por completo de la prisa de Bogotá.',
      rating: 5,
      highlight: 'Alivio notable desde la primera sesión'
    },
    {
      id: '2',
      name: 'Andrés Gómez',
      roleOrLocation: 'Chapinero · Desarrollador de Software',
      service: 'Corrección Postural & Terapia Física',
      quote: 'Me ayudó muchísimo con la tensión de espalda que tenía por trabajar todo el día frente al computador. Sus explicaciones sobre cómo sentarme mejor fueron clave.',
      rating: 5,
      highlight: 'Adiós al dolor entre los omóplatos'
    },
    {
      id: '3',
      name: 'Valentina Restrepo',
      roleOrLocation: 'La Soledad · Docente Universitaria',
      service: 'Masaje Relajante',
      quote: 'Una experiencia muy profesional y tranquila. Danna tiene unas manos mágicas y una energía muy reconfortante. Ya es parte de mi rutina mensual de autocuidado.',
      rating: 5,
      highlight: 'Paz absoluta y profesionalismo'
    },
    {
      id: '4',
      name: 'Mauricio Salamanca',
      roleOrLocation: 'Santa Bárbara · Consultor',
      service: 'Atención a Domicilio',
      quote: 'El servicio a domicilio fue impecable. Danna llegó puntual con su camilla profesional, sábanas higiénicas y aromaterapia. No tuve que lidiar con el tráfico.',
      rating: 5,
      highlight: 'Comodidad total sin salir de casa'
    }
  ]);

  // FAQs
  readonly faqs = signal<FaqItem[]>([
    {
      id: 'faq-1',
      question: '¿Qué tipo de masaje necesito?',
      answer: 'Depende de cómo se sienta tu cuerpo: si buscas desconectarte del estrés mental, dormir mejor y relajarte, el masaje relajante es ideal. Si sientes nudos específicos, dolor cervical, pesadez en hombros o dolor lumbar por trabajo, te recomiendo el masaje descontracturante o la corrección postural. En cualquier caso, al iniciar la sesión hacemos una valoración breve para ajustar la técnica.'
    },
    {
      id: 'faq-2',
      question: '¿Cuánto dura una sesión?',
      answer: 'Las sesiones estándar tienen una duración de 60 a 75 minutos. También disponemos de sesiones completas de 90 minutos para casos que requieren tratamiento integral en cuerpo completo y foco descontracturante.'
    },
    {
      id: 'faq-3',
      question: '¿Atiendes a domicilio?',
      answer: '¡Sí, totalmente! Brindo atención a domicilio en Bogotá. Llevo conmigo camilla profesional portátil acolchada, sábanas y toallas higienizadas, aceites naturales hipoalergénicos y aromaterapia suave para transformar cualquier rincón de tu hogar en un santuario de descanso.'
    },
    {
      id: 'faq-4',
      question: '¿En qué zonas de Bogotá atiendes?',
      answer: 'Para el consultorio presencial estamos ubicados en La Soledad, Teusaquillo (a una cuadra del Park Way). Para servicio a domicilio cubrimos Teusaquillo, Chapinero, Parkway, Salitre, Usaquén, Chico, Santa Bárbara, Cedritos, Pontevedra y zonas aledañas en Bogotá.'
    },
    {
      id: 'faq-5',
      question: '¿Dónde está ubicado el consultorio?',
      answer: 'Nuestro consultorio privado está situado en el tradicional y verde barrio La Soledad, localidad de Teusaquillo, Bogotá. Está a solo unos pasos del emblemático Park Way, en un entorno silencioso, seguro y con fácil acceso en transporte público o vehículo particular.'
    },
    {
      id: 'faq-6',
      question: '¿Cómo puedo reservar?',
      answer: 'Reservar es muy sencillo y directo a través de WhatsApp (+57 314 2529565). Al hacer clic en los botones de la página, se abrirá un chat directo con un mensaje sugerido donde coordinaremos fecha, hora y preferencia (consultorio o domicilio).'
    },
    {
      id: 'faq-7',
      question: '¿Qué debo usar durante una sesión?',
      answer: 'Para tu mayor comodidad, se recomienda ropa holgada y fácil de retirar si es necesario. Durante la sesión estarás siempre cubierto/a con toallas limpias y sábanas térmicas, dejando descubierta únicamente la zona muscular específica que se está trabajando, garantizando tu total privacidad y confort.'
    }
  ]);

  // Social / Editorial Pillars
  readonly socialPosts = signal<SocialPost[]>([
    {
      id: 'sp-1',
      category: 'Postura',
      title: 'El error más común al sentarte frente a la laptop',
      summary: 'Descansar los codos en el aire y adelantar el mentón sobrecarga los trapecios hasta 4 veces su peso.',
      keyAdvice: 'Acerca la silla al escritorio y apoya los antebrazos en 90°.',
      badge: 'Ergonomía'
    },
    {
      id: 'sp-2',
      category: 'Estrés',
      title: 'Por qué el estrés se aloja en tu cuello y mandíbula',
      summary: 'Ante el cortisol, el cuerpo adopta inconscientemente la postura de defensa, encogiendo hombros.',
      keyAdvice: 'Exhala largo por la boca y separa ligeramente los dientes durante el día.',
      badge: 'Calma'
    },
    {
      id: 'sp-3',
      category: 'Movilidad',
      title: 'Micro-movilidad cada 50 minutos',
      summary: 'No necesitas una rutina de gimnasio: 2 minutos de rotación torácica devuelven flujo sanguíneo a tu columna.',
      keyAdvice: 'Gira el torso suavemente mirando hacia atrás a cada lado.',
      badge: 'Movimiento'
    },
    {
      id: 'sp-4',
      category: 'Descanso',
      title: 'El impacto de la tensión muscular en el insomnio',
      summary: 'Cuando la musculatura paravertebral sigue en contracción, el sistema simpático no permite sueño profundo.',
      keyAdvice: 'Un masaje regular restablece el ciclo parasimpático restaurador.',
      badge: 'Sueño Reparador'
    },
    {
      id: 'sp-5',
      category: 'Tensión muscular',
      title: '¿Contracción o contractura?',
      summary: 'Aprende a diferenciar el cansancio pasajero de una contractura fija que requiere liberación miofascial.',
      keyAdvice: 'Si el nudo persiste más de 4 días, acude a valoración manual.',
      badge: 'Salud Muscular'
    },
    {
      id: 'sp-6',
      category: 'Autocuidado',
      title: 'Pausar no es perder tiempo: es sostener tu bienestar',
      summary: 'Tu cuerpo es tu vehículo diario para crear, trabajar y vivir. Escucharlo a tiempo previene lesiones.',
      keyAdvice: 'Dedica al menos una sesión mensual exclusivamente a cuidar de ti.',
      badge: 'Filosofía'
    }
  ]);

  selectBodyZone(id: string): void {
    this.selectedBodyZoneId.set(id);
  }

  getWhatsAppUrl(customMessage?: string): string {
    const text = customMessage || this.defaultBookingMsg;
    return `https://wa.me/${this.rawPhone}?text=${encodeURIComponent(text)}`;
  }
}
