import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tech-icon',
  templateUrl: './tech-icon.html',
  styleUrl: './tech-icon.scss'
})
export class TechIcon {
  @Input({ required: true }) name!: string;

  // Mapea cada tecnología a su clase de Devicon (con color de marca).
  // Las que no tienen logo de marca (SQL, WebSockets, IA) usan un SVG genérico.
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
    'Ionic': 'devicon-ionic-original colored',
    'Capacitor': 'devicon-capacitor-plain colored',
    'Node.js': 'devicon-nodejs-plain colored',
    'Git / GitHub': 'devicon-git-plain colored',
    'GitHub Actions': 'devicon-githubactions-plain colored',
    'Android Studio': 'devicon-androidstudio-plain colored',
    'Figma': 'devicon-figma-plain colored',
    'VS Code': 'devicon-vscode-plain colored',
    'Firebase': 'devicon-firebase-plain colored',
    'Charts.js': 'devicon-chartjs-plain colored',
    'Vite': 'devicon-vitejs-plain colored',
    'Express': 'devicon-express-original',
    'MongoDB': 'devicon-mongodb-plain colored',
    'Python': 'devicon-python-plain colored',
    'FastAPI': 'devicon-fastapi-plain colored',
    'Supabase': 'devicon-supabase-plain colored'
  };

  get iconClass(): string | null {
    return this.techIcons[this.name] ?? null;
  }
}
