import type { NeighborhoodSection } from '../../shared/navigation/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type EmergenciesTab } from '../../features/emergencies';
import { createOffersApi } from '../../features/services';
import type { CommunityRole } from '../../shared/identity/contracts';
import { TOUR_STEPS } from '../../features/onboarding/components/OnboardingTour';
import { useOnboardingTour } from '../../features/onboarding/hooks/useOnboardingTour';
import { type CreateAction } from '../../shared/navigation/contracts';

export function useNeighborhoodNavigation(client: SupabaseClient, userId: string | null) {
  const [communityVersion, setCommunityVersion] = useState(0);

  const [section, setSection] = useState<NeighborhoodSection>('inicio');

  const [hasCommunity, setHasCommunity] = useState<boolean | null>(null);

  const [communityName, setCommunityName] = useState<string | null>(null);

  const [communityRole, setCommunityRole] = useState<CommunityRole | null>(null);

  const [emergencyTab, setEmergencyTab] = useState<EmergenciesTab>('alertas');

  const [emergencyNonce, setEmergencyNonce] = useState(0);

  const [createIntent, setCreateIntent] = useState<CreateAction | null>(null);

  const [createNonce, setCreateNonce] = useState(0);

  const offersApi = useMemo(() => createOffersApi(client), [client]);

  const onboarding = useOnboardingTour(userId);

  useEffect(() => {
    if (onboarding.step === null) return;
    setCreateIntent(null);
    const step = TOUR_STEPS[onboarding.step];
    setSection(step.section);
    if (step.emergencyTab) setEmergencyTab(step.emergencyTab);
  }, [onboarding.step]);

  const handleMembership = useCallback(
    (isMember: boolean, name: string | null, role?: CommunityRole | null) => {
      setHasCommunity(isMember);
      setCommunityName(name);
      setCommunityRole(role ?? null);
    },
    [],
  );

  function openEmergencies(tab: EmergenciesTab) {
    onboarding.interrupt();
    setEmergencyTab(tab);
    setEmergencyNonce((value) => value + 1);
    setSection('emergencias');
  }

  function navigateSection(next: NeighborhoodSection) {
    onboarding.interrupt();
    setCreateIntent(null);
    if (next === 'emergencias') openEmergencies('alertas');
    else setSection(next);
  }

  function openCreate(action: CreateAction) {
    onboarding.interrupt();
    setCreateIntent(action);
    setCreateNonce((value) => value + 1);
    if (action === 'emergency') openEmergencies('reportar');
    else setSection(action === 'service' ? 'servicios' : 'favores');
  }
  return {
    client,
    communityVersion,
    setCommunityVersion,
    section,
    setSection,
    hasCommunity,
    setHasCommunity,
    communityName,
    setCommunityName,
    communityRole,
    setCommunityRole,
    emergencyTab,
    setEmergencyTab,
    emergencyNonce,
    setEmergencyNonce,
    createIntent,
    setCreateIntent,
    createNonce,
    setCreateNonce,
    offersApi,
    onboarding,
    handleMembership,
    openEmergencies,
    navigateSection,
    openCreate,
  };
}
