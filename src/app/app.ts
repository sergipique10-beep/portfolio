import { Component, signal, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

interface Project {
  name: string;
  description: string;
  tags: string[];
  url: string;
}

interface SkillGroup {
  label: string;
  items: string[];
}

@Component({
  selector: 'app-root',
  imports: [NgTemplateOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit, OnDestroy {
  menuOpen = signal(false);
  navScrolled = signal(false);

  private observer?: IntersectionObserver;

  projects: Project[] = [
    {
      name: 'Mercedes',
      description: 'Plataforma web para gestión de concesionarios y catálogo de vehículos con interfaz moderna y filtros avanzados.',
      tags: ['Angular', 'TypeScript', 'SCSS'],
      url: 'https://github.com/sergipique10-beep/ProyectoMercedesSP'
    },
    {
      name: 'LOTR',
      description: 'Fan site interactivo de El Señor de los Anillos con catálogo de personajes, lugares y lore del universo de Tolkien.',
      tags: ['Angular', 'API REST', 'CSS'],
      url: 'https://github.com/sergipique10-beep/Angular-LOTR'
    },
    {
      name: 'Tulapp',
      description: 'Aplicación de gestión de tareas y productividad personal con seguimiento de objetivos y estadísticas.',
      tags: ['Angular', 'TypeScript', 'Firebase'],
      url: 'https://github.com/sergipique10-beep/Tulapp2.0'
    },
    {
      name: 'CsFinance',
      description: 'Dashboard de análisis financiero con visualización de datos, gestión de carteras y seguimiento de mercados.',
      tags: ['React', 'Charts.js', 'API REST'],
      url: 'https://github.com/sergipique10-beep/LoginCsFinance'
    }
  ];

  skillGroups: SkillGroup[] = [
    {
      label: 'Frontend',
      items: ['Angular', 'React', 'TypeScript', 'JavaScript', 'HTML5', 'SCSS / CSS3', 'RxJS']
    },
    {
      label: 'Backend & Herramientas',
      items: ['Node.js', 'REST APIs', 'SQL', 'Git / GitHub', 'Figma', 'VS Code']
    }
  ];

  traits = ['Metódico', 'Organizado', 'Proactivo'];

  // Mapea cada tecnología a su clase de Devicon (con color de marca).
  // Las que no tienen logo de marca (SQL, API REST) usan un SVG genérico.
  private techIcons: Record<string, string> = {
    'Angular': 'devicon-angular-plain colored',
    'React': 'devicon-react-original colored',
    'TypeScript': 'devicon-typescript-plain colored',
    'JavaScript': 'devicon-javascript-plain colored',
    'HTML5': 'devicon-html5-plain colored',
    'CSS': 'devicon-css3-plain colored',
    'SCSS': 'devicon-sass-original colored',
    'SCSS / CSS3': 'devicon-sass-original colored',
    'RxJS': 'devicon-rxjs-plain colored',
    'Node.js': 'devicon-nodejs-plain colored',
    'Git / GitHub': 'devicon-git-plain colored',
    'Figma': 'devicon-figma-plain colored',
    'VS Code': 'devicon-vscode-plain colored',
    'Firebase': 'devicon-firebase-plain colored',
    'Charts.js': 'devicon-chartjs-plain colored'
  };

  techIcon(name: string): string | null {
    return this.techIcons[name] ?? null;
  }

  @HostListener('window:scroll')
  onScroll() {
    this.navScrolled.set(window.scrollY > 60);
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.anim').forEach(el => this.observer!.observe(el));
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.menuOpen.set(false);
  }
}
