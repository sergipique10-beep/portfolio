import { Component } from '@angular/core';

interface Certification {
  title: string;
  issuer: string;
  date: string;
  desc: string;
  image: string | null;
  link: string;
  accent?: string;
}

@Component({
  selector: 'app-certifications',
  templateUrl: './certifications.html',
  styleUrl: './certifications.scss'
})
export class Certifications {
  certifications: Certification[] = [
    {
      title: 'Microsoft Certified: Azure AI Fundamentals',
      issuer: 'Microsoft',
      date: '',
      desc: 'Conocimientos fundamentales de machine learning (ML) e inteligencia artificial (IA) y los servicios relacionados de Microsoft Azure.',
      image: '/certs/azure-ai-fundamentals.png',
      link: 'https://www.credly.com/badges/211e0bd7-603b-436e-b647-827b9ee32ec6'
    },
    {
      title: 'APIs con NodeJS & ExpressJS',
      issuer: 'thePower Business School',
      date: 'Jul 2026',
      desc: 'Formación práctica en construcción de APIs REST con Node.js y Express.',
      image: '/certs/thepower-badge.png',
      link: 'https://verified.sertifier.com/es/verify/80342133869419/',
      accent: '#22c55e'
    },
    {
      title: 'ReactJS',
      issuer: 'thePower Business School',
      date: 'Ago 2026',
      desc: 'Formación práctica en desarrollo de interfaces con React.',
      image: '/certs/thepower-badge.png',
      link: 'https://verified.sertifier.com/es/verify/97562952237869/',
      accent: '#22c55e'
    },
    {
      title: 'Introduction to agent skills',
      issuer: 'Anthropic',
      date: 'Jun 2026',
      desc: 'Certificado de finalización del curso, emitido por Anthropic.',
      image: null,
      link: '/certs/anthropic-agent-skills.pdf',
      accent: '#D97757'
    },
    {
      title: "Claude with Google Cloud's Vertex AI",
      issuer: 'Anthropic',
      date: 'Jun 2026',
      desc: 'Certificado de finalización del curso, emitido por Anthropic.',
      image: null,
      link: '/certs/anthropic-vertex-ai.pdf',
      accent: '#D97757'
    },
    {
      title: 'Claude Code in Action',
      issuer: 'Anthropic',
      date: 'Jun 2026',
      desc: 'Certificado de finalización del curso, emitido por Anthropic.',
      image: null,
      link: '/certs/anthropic-claude-code-in-action.pdf',
      accent: '#D97757'
    },
    {
      title: 'Claude Code 101',
      issuer: 'Anthropic',
      date: 'Jun 2026',
      desc: 'Certificado de finalización del curso, emitido por Anthropic.',
      image: null,
      link: '/certs/anthropic-claude-code-101.pdf',
      accent: '#D97757'
    },
    {
      title: 'Claude 101',
      issuer: 'Anthropic',
      date: 'Jun 2026',
      desc: 'Certificado de finalización del curso, emitido por Anthropic.',
      image: null,
      link: '/certs/anthropic-claude-101.pdf',
      accent: '#D97757'
    },
    {
      title: 'Building with the Claude API',
      issuer: 'Anthropic',
      date: 'Jun 2026',
      desc: 'Certificado de finalización del curso, emitido por Anthropic.',
      image: null,
      link: '/certs/anthropic-claude-api.pdf',
      accent: '#D97757'
    }
  ];
}
