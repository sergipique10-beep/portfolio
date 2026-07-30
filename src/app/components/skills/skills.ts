import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TechIcon } from '../tech-icon/tech-icon';

interface SkillGroup {
  label: string;
  items: string[];
}

@Component({
  selector: 'app-skills',
  imports: [TechIcon],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Skills {
  skillGroups: SkillGroup[] = [
    {
      label: 'Inteligencia Artificial',
      items: ['Claude Code', 'Open Code']
    },
    {
      label: 'Frontend',
      items: ['Angular', 'React', 'TypeScript', 'Ionic', 'Capacitor', 'SCSS / CSS3', 'RxJS', 'TanStack Query']
    },
    {
      label: 'Backend & Herramientas',
      items: ['Python', 'FastAPI', 'JWT', 'REST APIs', 'SQL', 'Git / GitHub', 'GitHub Actions', 'Android Studio', 'Figma', 'VS Code']
    }
  ];
}
