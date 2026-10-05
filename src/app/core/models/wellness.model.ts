export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  benefits: string[];
  idealFor: string;
  icon: string;
  tag: string;
  whatsappMsg: string;
}

export interface BodyZone {
  id: string;
  name: string;
  label: string;
  symptoms: string;
  causes: string;
  recommendation: string;
  suggestedService: string;
  takeawayTip: string;
  whatsappMsg: string;
  cx: number;
  cy: number;
}

export interface ProcessStep {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  detail: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  roleOrLocation: string;
  service: string;
  quote: string;
  rating: number;
  highlight: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  isOpen?: boolean;
}

export interface SocialPost {
  id: string;
  category: string;
  title: string;
  summary: string;
  keyAdvice: string;
  badge: string;
}

export interface BenefitItem {
  number: string;
  title: string;
  description: string;
  detail: string;
}
