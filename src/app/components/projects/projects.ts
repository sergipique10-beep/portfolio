import { Component } from '@angular/core';
import { TechIcon } from '../tech-icon/tech-icon';

interface Project {
  name: string;
  description: string;
  tags: string[];
  mainTech: string;   // tecnología destacada (logo grande de la cabecera)
  accent: string;     // color de acento de la cabecera
  url: string;
}

@Component({
  selector: 'app-projects',
  imports: [TechIcon],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class Projects {
  projects: Project[] = [
    {
      name: 'FinalProject',
      description: 'Aplicación full-stack (MERN) con autenticación JWT, gestión de usuarios y subida de imágenes a la nube.',
      tags: ['React', 'Vite', 'Node.js', 'Express', 'MongoDB'],
      mainTech: 'React',
      accent: '#61DAFB',
      url: 'https://github.com/sergipique10-beep/FinalProject'
    },
    {
      name: 'CS Finance',
      description: 'Backend en Python/FastAPI para seguimiento y predicción de precios del mercado de skins, con WebSockets en tiempo real e IA/RAG.',
      tags: ['Python', 'FastAPI', 'WebSockets', 'Firebase'],
      mainTech: 'Python',
      accent: '#3776AB',
      url: 'https://github.com/sergipique10-beep/LoginCsFinance'
    },
    {
      name: 'TulApp',
      description: 'Aplicación web de gestión de tareas y productividad, construida con HTML y CSS puro, sin frameworks.',
      tags: ['HTML5', 'CSS'],
      mainTech: 'HTML5',
      accent: '#E34F26',
      url: 'https://github.com/sergipique10-beep/Tulapp2.0'
    },
    {
      name: 'WebSocket Chat',
      description: 'Chat en tiempo real con WebSockets. Frontend Angular y backend FastAPI con IA (OpenAI) y búsqueda vectorial para respuestas con RAG.',
      tags: ['Angular', 'FastAPI', 'WebSockets', 'Supabase', 'IA'],
      mainTech: 'Angular',
      accent: '#DD0031',
      url: 'https://github.com/sergipique10-beep/WebSocketChat'
    },
    {
      name: 'LOTR',
      description: 'Fan site interactivo de El Señor de los Anillos, hecho con Angular y renderizado en servidor (SSR) para SEO y carga rápida.',
      tags: ['Angular', 'TypeScript', 'RxJS'],
      mainTech: 'Angular',
      accent: '#C8A24B',
      url: 'https://github.com/sergipique10-beep/Angular-LOTR'
    },
    {
      name: 'Game4',
      description: 'Juego multijugador en tiempo real: cliente React (Vite) y servidor Express con WebSockets para la comunicación en directo.',
      tags: ['React', 'Vite', 'TypeScript', 'Express', 'WebSockets'],
      mainTech: 'TypeScript',
      accent: '#3178C6',
      url: 'https://github.com/sergipique10-beep/game4'
    }
  ];
}
