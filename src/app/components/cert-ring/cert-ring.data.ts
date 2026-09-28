export interface Certification {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialUrl: string;
  /** URL de una imagen o de un .svg */
  logo: string;
  /** Imagen del certificado, opcional, que se muestra en el panel central */
  image?: string;
  skills: string[];
}

const monogram = (text: string, color: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="64" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="700" fill="${color}">${text}</text></svg>`
  );

// ⚠️ DATOS FICTICIOS DE EJEMPLO: solo para demos y tests, no son certificaciones reales.
export const SAMPLE_CERTIFICATIONS: Certification[] = [
  { id: 'ejemplo-1', title: '[EJEMPLO] Cloud Foundations', issuer: 'Academia Ficticia', date: 'Ene 2026', credentialUrl: 'https://example.com/credencial/1', logo: monogram('CF', '#3b5bdb'), skills: ['Cloud', 'Redes'] },
  { id: 'ejemplo-2', title: '[EJEMPLO] TypeScript Avanzado', issuer: 'Academia Ficticia', date: 'Feb 2026', credentialUrl: 'https://example.com/credencial/2', logo: monogram('TS', '#1971c2'), skills: ['TypeScript', 'Genéricos'] },
  { id: 'ejemplo-3', title: '[EJEMPLO] Diseño de APIs', issuer: 'Instituto Inventado', date: 'Mar 2026', credentialUrl: 'https://example.com/credencial/3', logo: monogram('API', '#0c8599'), skills: ['REST', 'OpenAPI'] },
  { id: 'ejemplo-4', title: '[EJEMPLO] Bases de datos', issuer: 'Instituto Inventado', date: 'Abr 2026', credentialUrl: 'https://example.com/credencial/4', logo: monogram('DB', '#2f9e44'), skills: ['SQL', 'Modelado'] },
  { id: 'ejemplo-5', title: '[EJEMPLO] Accesibilidad web', issuer: 'Escuela de Prueba', date: 'May 2026', credentialUrl: 'https://example.com/credencial/5', logo: monogram('A11Y', '#e8590c'), skills: ['WCAG', 'ARIA'] },
  { id: 'ejemplo-6', title: '[EJEMPLO] Testing en frontend', issuer: 'Escuela de Prueba', date: 'Jun 2026', credentialUrl: 'https://example.com/credencial/6', logo: monogram('QA', '#c2255c'), skills: ['Vitest', 'E2E'] }
];
