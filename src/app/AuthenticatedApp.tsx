import { AccountScreen } from './screens/AccountScreen';
import { Pressable, Text, View } from 'react-native';
import { NamePrompt } from '../features/profile/components/NamePrompt';
import { CommunityPanel } from '../features/community/components/CommunityPanel';
import { FavorsScreen } from '../features/favors/screens/FavorsScreen';
import { EmergenciesScreen } from '../features/emergencies';
import { ServicesFlowScreen } from './flows/ServicesFlowScreen';
import { colors } from '../shared/theme';
import { AppIcon } from '../shared/ui/AppIcon';
import { OnboardingTour, TOUR_STEPS } from '../features/onboarding/components/OnboardingTour';
import { TourTarget, TourTargetsProvider } from '../shared/ui/tour/TourTargets';
import { NeighborhoodShell } from './layout/NeighborhoodShell';
import { NeighborhoodHome } from './screens/HomeScreen';
import { styles } from '../features/auth/styles/auth.styles';
import type { AppViewModel } from './navigation/SessionRouter';

export function AuthenticatedApp({ model }: { model: AppViewModel }) {
  const {
    identity,
    communityVersion,
    section,
    hasCommunity,
    communityName,
    communityRole,
    emergencyTab,
    emergencyNonce,
    createIntent,
    createNonce,
    offersApi,
    onboarding,
    handleMembership,
    openEmergencies,
    navigateSection,
    openCreate,
    client,
  } = model;
  return (
    <TourTargetsProvider
      targets={onboarding.step === null ? [] : TOUR_STEPS[onboarding.step].targets}
    >
      <NeighborhoodShell
        onCreate={openCreate}
        section={section}
        communityName={communityName}
        onNavigate={navigateSection}
        tour={
          onboarding.step !== null ? (
            <OnboardingTour
              step={onboarding.step}
              onMove={onboarding.move}
              onFinish={onboarding.finish}
              onEmergency={() => openEmergencies('alertas')}
            />
          ) : onboarding.error ? (
            <View style={{ padding: 12, gap: 8, backgroundColor: colors.warningSurface }}>
              <Text accessibilityRole="alert" style={{ color: colors.warningInk }}>
                {onboarding.error === 'save'
                  ? 'No se pudo guardar que ya viste el tutorial en este dispositivo.'
                  : 'No se pudo consultar tu recorrido guardado. Puedes abrirlo desde Inicio.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={styles.buttonOutline}
                onPress={onboarding.error === 'save' ? onboarding.finish : onboarding.start}
              >
                <Text style={styles.buttonOutlineText}>
                  {onboarding.error === 'save' ? 'Reintentar guardado' : 'Ver recorrido de ayuda'}
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      >
        {section === 'inicio' ? (
          <NeighborhoodHome
            communityName={communityName}
            role={communityRole}
            onNavigate={navigateSection}
            onShowTutorial={onboarding.start}
          >
            <NamePrompt
              key={`name:${identity.user.id}:${communityVersion}`}
              client={client}
              userId={identity.user.id}
              onComplete={() => navigateSection('comunidad')}
            />
            <CommunityPanel
              key={identity.user.id}
              client={client}
              userId={identity.user.id}
              refreshVersion={communityVersion}
              onMembershipResolved={handleMembership}
            />
          </NeighborhoodHome>
        ) : section !== 'comunidad' && section !== 'emergencias' && hasCommunity === false ? (
          <View style={styles.centerContainer}>
            <TourTarget id="community-required" style={styles.card}>
              <View style={styles.gateArch}>
                <AppIcon name="people" size={30} color={colors.primary} />
              </View>
              <Text style={styles.authTitle} accessibilityRole="header">
                Únete a una comunidad primero
              </Text>
              <Text style={styles.mutedText}>
                Para explorar y publicar servicios, productos y favores de tus vecinos, primero
                debes pertenecer a una comunidad de tu cuadra.
              </Text>
              <Pressable style={styles.buttonPrimary} onPress={() => navigateSection('comunidad')}>
                <Text style={styles.buttonPrimaryText}>Unirme a una comunidad</Text>
              </Pressable>
            </TourTarget>
          </View>
        ) : section === 'servicios' ? (
          <ServicesFlowScreen
            key={`services:${identity.user.id}:${createNonce}`}
            api={offersApi}
            initialTab={createIntent === 'service' ? 'publicar' : 'explorar'}
            onOpenEmergencies={(tab) => openEmergencies(tab ?? 'alertas')}
          />
        ) : section === 'mapa' ? (
          <ServicesFlowScreen
            key={`map:${identity.user.id}`}
            api={offersApi}
            initialTab="mapa"
            onOpenEmergencies={(tab) => openEmergencies(tab ?? 'alertas')}
          />
        ) : section === 'favores' ? (
          <FavorsScreen
            key={`favors:${identity.user.id}:${createNonce}`}
            client={client}
            initialCreating={createIntent === 'favor'}
          />
        ) : section === 'emergencias' ? (
          <EmergenciesScreen
            key={`emergencies:${identity.user.id}:${emergencyNonce}`}
            client={client}
            userId={identity.user.id}
            initialTab={emergencyTab}
            guidedTab={
              onboarding.step !== null ? TOUR_STEPS[onboarding.step].emergencyTab : undefined
            }
            onTabChange={onboarding.interrupt}
            onOpenServices={() => navigateSection('servicios')}
            onGoToCommunity={() => navigateSection('comunidad')}
          />
        ) : (
          <AccountScreen model={model} />
        )}
      </NeighborhoodShell>
    </TourTargetsProvider>
  );
}
