import { type Neighbor, type Review, type Publication } from '../model/types';

export const neighbors = { ana: 'Ana', carlos: 'Carlos', luz: 'Luz' };

export const neighborReviews: Record<Neighbor, Review[]> = {
  ana: [],
  carlos: [
    {
      author: 'María Quispe',
      targetOwnerKey: 'carlos',
      stars: 5,
      comment: 'Coordinamos rápido y el taladro estaba en buen estado.',
    },
    {
      author: 'Jorge Castillo',
      targetOwnerKey: 'carlos',
      stars: 4,
      comment: 'El préstamo salió bien. Tuvimos que cambiar la hora de entrega.',
    },
  ],
  luz: [
    {
      author: 'Elena Huamán',
      targetOwnerKey: 'luz',
      stars: 5,
      comment: 'Los esquejes estaban bien cuidados y Lucía me explicó cómo trasplantarlos.',
    },
    {
      author: 'Julio Paredes',
      targetOwnerKey: 'luz',
      stars: 5,
      comment: 'El intercambio fue fácil de coordinar y cumplió lo acordado.',
    },
  ],
};

export const publications: Publication[] = [
  {
    id: 'taladro',
    owner: 'carlos',
    ownerName: 'Carlos Salazar',
    kind: 'Préstamo',
    title: 'Taladro percutor',
    description: 'Ideal para pequeños arreglos en casa. Incluye un juego de brocas.',
    location: '0.5 km · Zona A',
    terms: 'Disponible hoy · hasta 2 días',
    symbol: '🛠️',
    color: '#e5eddf',
  },
  {
    id: 'plantas',
    owner: 'luz',
    ownerName: 'Lucía Fernández',
    kind: 'Intercambio',
    title: 'Esquejes de plantas',
    description:
      'Tengo esquejes de potus y menta. Los intercambio por semillas o macetas pequeñas.',
    location: '0.8 km · Zona B',
    terms: 'Coordinar punto de encuentro',
    symbol: '🪴',
    color: '#f2e9db',
  },
  {
    id: 'escalera',
    owner: 'ana',
    ownerName: 'Ana Torres',
    kind: 'Préstamo',
    title: 'Escalera plegable',
    description: 'Escalera ligera de tres peldaños para tareas en casa.',
    location: '0.3 km · Zona A',
    terms: 'Disponible el fin de semana',
    symbol: '🪜',
    color: '#e4ebf4',
  },
  {
    id: 'costura',
    owner: 'luz',
    ownerName: 'Lucía Fernández',
    kind: 'Préstamo',
    title: 'Kit de costura',
    description:
      'Presto una caja con agujas, hilos, tijeras y cinta métrica para arreglos sencillos.',
    location: '0.8 km · Zona B',
    terms: 'Disponible por la tarde · hasta 3 días',
    symbol: '🧵',
    color: '#f1e4e8',
  },
  {
    id: 'libros',
    owner: 'carlos',
    ownerName: 'Carlos Salazar',
    kind: 'Intercambio',
    title: 'Libros infantiles',
    description: 'Tengo cuentos ilustrados para cambiar por otros libros para niñas y niños.',
    location: '0.5 km · Zona A',
    terms: 'Coordinar por la tarde',
    symbol: '📚',
    color: '#e4ebf4',
  },
  {
    id: 'bomba',
    owner: 'carlos',
    ownerName: 'Carlos Salazar',
    kind: 'Préstamo',
    title: 'Bomba para bicicleta',
    description: 'Bomba de pie con manómetro. Sirve para válvulas finas y gruesas.',
    location: '0.5 km · Zona A',
    terms: 'Disponible hoy · préstamo por un día',
    symbol: '🚲',
    color: '#e5eddf',
  },
  {
    id: 'rompecabezas',
    owner: 'luz',
    ownerName: 'Lucía Fernández',
    kind: 'Intercambio',
    title: 'Rompecabezas de 500 piezas',
    description:
      'Rompecabezas completo de un paisaje. Lo cambio por un juego de mesa o por otro rompecabezas.',
    location: '0.8 km · Zona B',
    terms: 'Coordinar durante el fin de semana',
    symbol: '🧩',
    color: '#f2e9db',
  },
];
