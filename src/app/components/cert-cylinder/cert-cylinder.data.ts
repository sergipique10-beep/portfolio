export interface CylinderCert {
  id: string;
  title: string;
  issuer: string;
  year: string;
  category: string;
  /** URL de una imagen o de un .svg */
  logo: string;
  /** Color de acento de la tarjeta cuando está al frente */
  color: string;
  credentialUrl: string;
  /** Imagen del certificado, opcional, en la parte superior de la tarjeta */
  image?: string;
}

const monogram = (text: string, color: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="64" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="36" font-weight="700" fill="${color}">${text}</text></svg>`
  );

const sample = (n: number, title: string, category: string, mark: string, color: string): CylinderCert => ({
  id: `ejemplo-${n}`,
  title: `[EJEMPLO] ${title}`,
  issuer: n % 2 ? 'Academia Ficticia' : 'Instituto Inventado',
  year: String(2020 + (n % 7)),
  category,
  logo: monogram(mark, color),
  color,
  credentialUrl: `https://example.com/credencial/${n}`
});

// ⚠️ DATOS FICTICIOS DE EJEMPLO: solo para demos y tests, no son certificaciones reales.
export const SAMPLE_CYLINDER_CERTS: CylinderCert[] = [
  sample(1, 'Cloud Foundations', 'Cloud', 'CF', '#4c6ef5'),
  sample(2, 'TypeScript Avanzado', 'Frontend', 'TS', '#228be6'),
  sample(3, 'Diseño de APIs', 'Backend', 'API', '#15aabf'),
  sample(4, 'Bases de datos', 'Datos', 'DB', '#40c057'),
  sample(5, 'Accesibilidad web', 'Frontend', 'A11Y', '#fd7e14'),
  sample(6, 'Testing en frontend', 'Calidad', 'QA', '#e64980'),
  sample(7, 'Seguridad web', 'Seguridad', 'SEC', '#fa5252'),
  sample(8, 'Kubernetes básico', 'Cloud', 'K8S', '#339af0'),
  sample(9, 'Machine Learning', 'IA', 'ML', '#be4bdb'),
  sample(10, 'Git profesional', 'Herramientas', 'GIT', '#f76707'),
  sample(11, 'Diseño de interfaces', 'Diseño', 'UI', '#7950f2'),
  sample(12, 'Node.js en producción', 'Backend', 'NODE', '#37b24d'),
  sample(13, 'Rendimiento web', 'Frontend', 'PERF', '#1098ad'),
  sample(14, 'Arquitectura de software', 'Arquitectura', 'ARQ', '#f59f00')
];
