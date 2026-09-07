import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { TechIcon } from '../tech-icon/tech-icon';

interface SkillGroup {
  label: string;
  items: string[];
}

let modelViewerLoaded = false;

@Component({
  selector: 'app-skills',
  imports: [TechIcon],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Skills implements AfterViewInit, OnDestroy {
  private host = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  // <model-viewer> (~250KB) solo se carga cuando esta sección está a punto de
  // entrar en pantalla, en vez de bloquear el arranque de toda la página.
  ngAfterViewInit() {
    if (modelViewerLoaded) return;
    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          this.loadModelViewer();
          this.observer?.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private loadModelViewer() {
    if (modelViewerLoaded) return;
    modelViewerLoaded = true;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
    document.body.appendChild(script);
  }

  skillGroups: SkillGroup[] = [
    {
      label: 'Inteligencia Artificial',
      items: ['Claude Code', 'Open Code', 'Vertex AI', 'OpenAI', 'RAG', 'Agent Skills']
    },
    {
      label: 'Frontend',
      items: ['Angular', 'React', 'TypeScript', 'Ionic', 'Capacitor', 'SCSS / CSS3', 'RxJS', 'TanStack Query']
    },
    {
      label: 'Datos',
      items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Supabase', 'Firebase']
    },
    {
      label: 'Backend & Herramientas',
      items: ['Python', 'FastAPI', 'JWT', 'REST APIs', 'SQL', 'Git / GitHub', 'GitHub Actions', 'Android Studio', 'Figma', 'VS Code']
    }
  ];
}
