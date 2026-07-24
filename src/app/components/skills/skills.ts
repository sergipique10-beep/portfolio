import { Component } from '@angular/core';
import { TechIcon } from '../tech-icon/tech-icon';

interface SkillGroup {
  label: string;
  items: string[];
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
      items: ['Claude Code', 'Open Code']
    },
    {
      label: 'Frontend',
      items: ['Angular', 'React', 'TypeScript', 'JavaScript', 'HTML5', 'SCSS / CSS3', 'RxJS']
    },
    {
      label: 'Backend & Herramientas',
      items: ['Node.js', 'REST APIs', 'SQL', 'Git / GitHub', 'Figma', 'VS Code']
    }
  ];
}
