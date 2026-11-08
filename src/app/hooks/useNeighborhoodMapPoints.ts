import { useEffect, useState } from 'react';
import type { OffersApi } from '../../features/services/data/offersApi';
import { loadMapOffers, type ServiceMapOffer } from '../../features/services/map/toMapOffers';
import { supabase } from '../../lib/supabase';
import {
  createEmergenciesApi,
  toEmergencyMapPoints,
  toResourceMapPoints,
} from '../../features/emergencies';

export function useNeighborhoodMapPoints(api: OffersApi, refreshKey: number) {
  const [mapOffers, setMapOffers] = useState<ServiceMapOffer[] | undefined>(undefined);
  useEffect(() => {
    let active = true;
    const emergenciesApi = createEmergenciesApi(supabase);
    Promise.all([
      loadMapOffers(api).catch(() => null),
      emergenciesApi.loadFeed().catch(() => null),
      emergenciesApi.loadSupport().catch(() => null),
    ]).then(([offers, feedRes, supportRes]) => {
      if (!active) return;
      if (!offers && (!feedRes || !feedRes.ok) && (!supportRes || !supportRes.ok)) {
        setMapOffers(undefined);
        return;
      }
      const combined: ServiceMapOffer[] = [...(offers ?? [])];
      if (feedRes?.ok) {
        const emergencyPoints = toEmergencyMapPoints(feedRes.data.items);
        for (const p of emergencyPoints) {
          if (p.kind !== 'emergencia') continue;
          combined.push({
            id: `emergencia:${p.id}`,
            nombre: p.nombre,
            descripcion: p.descripcion,
            categoria: 'emergencia',
            latitud: p.latitud,
            longitud: p.longitud,
            etiquetaEstado: p.estado === 'en_atencion' ? 'En atención vecinal' : 'Alerta activa',
          });
        }
      }
      if (supportRes?.ok) {
        const resourcePoints = toResourceMapPoints(supportRes.data.resources);
        for (const r of resourcePoints) {
          if (r.kind !== 'recurso') continue;
          combined.push({
            id: `recurso:${r.id}`,
            nombre: r.nombre,
            descripcion: r.descripcion,
            categoria: 'recurso',
            latitud: r.latitud,
            longitud: r.longitud,
            etiquetaEstado: r.disponible ? 'Recurso disponible' : 'No disponible',
          });
        }
      }
      setMapOffers(combined);
    });
    return () => {
      active = false;
    };
  }, [api, refreshKey]);
  return { mapOffers, setMapOffers };
}
