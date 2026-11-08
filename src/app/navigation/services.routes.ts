export type ServicesTab = 'explorar' | 'mapa' | 'publicar' | 'mis_ofertas';

export type ServicesRoute =
  | { screen: 'tab'; tab: ServicesTab }
  | { screen: 'detalle'; offerId: string; returnTab: ServicesTab }
  | { screen: 'editar'; offerId: string; fromDetail?: ServicesTab };
