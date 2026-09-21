import { Component } from '@angular/core';
import { TechIcon } from '../tech-icon/tech-icon';

interface SkillGroup {
  label: string;
  items: string[];
  accent: string;
}

@Component({
  selector: 'app-skills',
  imports: [TechIcon],
  templateUrl: './skills.html',
  styleUrl: './skills.scss'
})
export class Skills {
  skillGroups: SkillGroup[] = [
    {
      label: 'Inteligencia Artificial',
      items: ['Claude Code', 'Open Code', 'Vertex AI', 'OpenAI', 'RAG', 'Agent Skills'],
      accent: '#d4af37'
    },
    {
      label: 'Frontend',
      items: ['Angular', 'React', 'TypeScript', 'Ionic', 'Capacitor', 'SCSS / CSS3', 'RxJS', 'TanStack Query'],
      accent: '#3b82f6'
    },
    {
      label: 'Datos',
      items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Supabase', 'Firebase'],
      accent: '#22c55e'
    },
    {
      label: 'Backend & Herramientas',
      items: ['Python', 'FastAPI', 'JWT', 'REST APIs', 'SQL', 'Git / GitHub', 'GitHub Actions', 'Android Studio', 'Figma', 'VS Code'],
      accent: '#8b5cf6'
    }
  ];
}
