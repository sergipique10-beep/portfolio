import { Component } from '@angular/core';
import { TechIcon } from '../tech-icon/tech-icon';
import { CsFinanceSpotlight } from '../cs-finance-spotlight/cs-finance-spotlight';

interface Project {
  name: string;
  description: string;
  tags: string[];
  mainTech: string;   // tecnología destacada (logo grande de la cabecera)
  accent: string;     // color de acento de la cabecera
  url: string;
  demoUrl?: string;   // app deployada en vivo (si existe)
}

@Component({
  selector: 'app-projects',
  imports: [TechIcon, CsFinanceSpotlight],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class Projects {
  projects: Project[] = [
    {
      name: 'DevHub',
      description: 'Plataforma tipo LinkedIn + Fiverr para developers: perfiles profesionales, marketplace de servicios, propuestas y portfolio. Resuelve la fragmentación entre red profesional y venta de servicios freelance en una sola herramienta.',
      tags: ['React', 'Vite', 'Node.js', 'Express', 'MongoDB'],
      mainTech: 'React',
      accent: '#61DAFB',
      url: 'https://github.com/sergipique10-beep/DevHub',
      demoUrl: 'https://devhub-1-mrp7.onrender.com'
    },
    {
      name: 'Jarvis',
      description: 'Asistente personal de IA con voz y memoria propia: orquesta la API de Claude con tool-calling para ejecutar acciones reales bajo un modelo de permisos por riesgo, con memoria persistente en Supabase y un orbe 3D como interfaz visual.',
      tags: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Claude', 'Supabase'],
      mainTech: 'Claude',
      accent: '#D97757',
      url: 'https://github.com/sergipique10-beep/Starky---Jarvis-Service/tree/feature/module-1-conversational-core',
      demoUrl: 'https://jarvis-service-xj3w.onrender.com/'
    },
    {
      name: 'TulApp',
      description: 'App social que conecta a personas mayores de zonas rurales con voluntarios jóvenes para acercarles servicios digitales. Frontend Angular + Ionic + Capacitor (login con Firebase) y backend FastAPI + PostgreSQL con Supabase.',
      tags: ['Angular', 'Ionic', 'Capacitor', 'Firebase', 'Supabase', 'Python', 'FastAPI'],
      mainTech: 'Angular',
      accent: '#DD0031',
      url: 'https://github.com/Fundacion-Esplai-CC/TulApp'
    },
    {
      name: 'Game4',
      description: 'Juego multijugador en tiempo real: cliente React (Vite) y servidor Express con WebSockets para la comunicación en directo.',
      tags: ['React', 'Vite', 'TypeScript', 'Express', 'WebSockets'],
      mainTech: 'TypeScript',
      accent: '#3178C6',
      url: 'https://github.com/sergipique10-beep/game4',
      demoUrl: 'https://game4-z9x3.onrender.com/'
    }
  ];
}
