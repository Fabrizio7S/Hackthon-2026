export const neighbors = { ana: 'Ana', carlos: 'Carlos', luz: 'Luz' };
export type Neighbor = keyof typeof neighbors;

export type Publication = {
  id: string;
  owner: Neighbor;
  kind: 'Préstamo' | 'Intercambio';
  title: string;
  description: string;
  location: string;
  terms: string;
  symbol: string;
  color: string;
};

export const publications: Publication[] = [
  {
    id: 'taladro', owner: 'carlos', kind: 'Préstamo', title: 'Taladro percutor',
    description: 'Ideal para pequeños arreglos en casa. Incluye un juego de brocas.',
    location: '0.5 km · Zona A', terms: 'Disponible hoy · hasta 2 días', symbol: '🛠️', color: '#e5eddf',
  },
  {
    id: 'plantas', owner: 'luz', kind: 'Intercambio', title: 'Esquejes de plantas',
    description: 'Tengo esquejes de potus y menta. Los intercambio por semillas o macetas pequeñas.',
    location: '0.8 km · Zona B', terms: 'Coordinar punto de encuentro', symbol: '🪴', color: '#f2e9db',
  },
  {
    id: 'escalera', owner: 'ana', kind: 'Préstamo', title: 'Escalera plegable',
    description: 'Escalera ligera de tres peldaños para tareas en casa.',
    location: '0.3 km · Zona A', terms: 'Disponible el fin de semana', symbol: '🪜', color: '#e4ebf4',
  },
  {
    id: 'costura', owner: 'luz', kind: 'Préstamo', title: 'Kit de costura',
    description: 'Presto una caja con agujas, hilos, tijeras y cinta métrica para arreglos sencillos.',
    location: '0.8 km · Zona B', terms: 'Disponible por la tarde · hasta 3 días', symbol: '🧵', color: '#f1e4e8',
  },
  {
    id: 'libros', owner: 'carlos', kind: 'Intercambio', title: 'Libros infantiles',
    description: 'Tengo cuentos ilustrados para cambiar por otros libros para niñas y niños.',
    location: '0.5 km · Zona A', terms: 'Coordinar por la tarde', symbol: '📚', color: '#e4ebf4',
  },
  {
    id: 'bomba', owner: 'carlos', kind: 'Préstamo', title: 'Bomba para bicicleta',
    description: 'Bomba de pie con manómetro. Sirve para válvulas finas y gruesas.',
    location: '0.5 km · Zona A', terms: 'Disponible hoy · préstamo por un día', symbol: '🚲', color: '#e5eddf',
  },
  {
    id: 'rompecabezas', owner: 'luz', kind: 'Intercambio', title: 'Rompecabezas de 500 piezas',
    description: 'Rompecabezas completo de un paisaje. Lo cambio por un juego de mesa o por otro rompecabezas.',
    location: '0.8 km · Zona B', terms: 'Coordinar durante el fin de semana', symbol: '🧩', color: '#f2e9db',
  },
];

export type RequestStatus = 'pending' | 'accepted' | 'finished' | 'closed';
export type FavorRequest = { publicationId: string; requester: Neighbor; status: RequestStatus };
export type RequestAction = {
  type: 'request' | 'accept' | 'finish';
  actor: Neighbor;
  publicationId: string;
  requester: Neighbor;
};

export const requestLabels: Record<RequestStatus, string> = {
  pending: 'Pendiente de aceptación',
  accepted: 'En coordinación',
  finished: 'Terminada',
  closed: 'Solicitud cerrada',
};

export function publicationStatus(requests: FavorRequest[], publicationId: string) {
  const relevant = requests.filter((request) => request.publicationId === publicationId);
  if (relevant.some((request) => request.status === 'finished')) return 'Terminada';
  if (relevant.some((request) => request.status === 'accepted')) return 'En coordinación';
  return 'Disponible';
}

export function updateRequests(requests: FavorRequest[], action: RequestAction): FavorRequest[] {
  const { type, actor, publicationId, requester } = action;
  const publication = publications.find((item) => item.id === publicationId);
  if (!publication) return requests;

  const current = requests.find((item) => item.publicationId === publicationId && item.requester === requester);
  const available = publicationStatus(requests, publicationId) === 'Disponible';

  if (type === 'request') {
    if (!available || current || actor !== requester || actor === publication.owner) return requests;
    return [...requests, { publicationId, requester, status: 'pending' }];
  }

  if (type === 'accept' && actor === publication.owner && current?.status === 'pending' && available) {
    return requests.map((item) => {
      if (item.publicationId !== publicationId || item.status !== 'pending') return item;
      return { ...item, status: item === current ? 'accepted' : 'closed' };
    });
  }

  if (type === 'finish' && actor === requester && current?.status === 'accepted') {
    return requests.map((item) => item === current ? { ...item, status: 'finished' } : item);
  }

  return requests;
}
