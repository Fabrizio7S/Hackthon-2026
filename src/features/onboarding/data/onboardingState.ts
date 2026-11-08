export type TourStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

/** Estado local por cuenta; no contiene correo, perfil ni datos de comunidad. */
export function createOnboardingState(storage: TourStorage, userId: string) {
  const key = `onboarding.v1:${userId}`;
  let interacted = false;
  let dismissed = false;

  return {
    async shouldStart() {
      const seen = await storage.getItem(key);
      // Una lectura atrasada nunca reabre un recorrido que se inició o cerró manualmente.
      return !interacted && seen !== 'seen';
    },
    start() {
      interacted = true;
    },
    get dismissed() {
      return dismissed;
    },
    async finish() {
      interacted = true;
      dismissed = true;
      await storage.setItem(key, 'seen');
    },
  };
}
