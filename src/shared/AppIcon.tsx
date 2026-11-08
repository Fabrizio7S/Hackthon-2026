import React from 'react';
import { View } from 'react-native';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';

export type IconName =
  | 'home'
  | 'map'
  | 'chain'
  | 'person'
  | 'people'
  | 'plus'
  | 'close'
  | 'alert'
  | 'services'
  | 'arrow'
  | 'siren'
  | 'pin'
  | 'search'
  | 'bell'
  | 'phone'
  | 'chat'
  | 'drop'
  | 'pulse'
  | 'bolt'
  | 'bowl'
  | 'support'
  | 'verified'
  | 'aid'
  | 'extinguisher'
  | 'key'
  | 'copy'
  | 'lock'
  | 'check'
  | 'back'
  | 'chevron'
  | 'bookmark'
  | 'heart'
  | 'box'
  | 'swap'
  | 'locate'
  | 'edit'
  | 'logout'
  | 'clock'
  | 'send'
  | 'bag'
  | 'refresh'
  | 'mail'
  | 'star'
  | 'camera'
  | 'filter'
  | 'eye'
  | 'accessibility';

function renderVectorIcon(name: IconName, size: number, color: string) {
  switch (name) {
    case 'home':
      return <Feather name="home" size={size} color={color} />;
    case 'map':
      return <Feather name="map" size={size} color={color} />;
    case 'chain':
      return <MaterialCommunityIcons name="link-variant" size={size} color={color} />;
    case 'person':
      return <Feather name="user" size={size} color={color} />;
    case 'people':
      return <Feather name="users" size={size} color={color} />;
    case 'plus':
      return <Feather name="plus" size={size} color={color} />;
    case 'close':
      return <Feather name="x" size={size} color={color} />;
    case 'alert':
      return <Feather name="alert-triangle" size={size} color={color} />;
    case 'services':
      return <Feather name="briefcase" size={size} color={color} />;
    case 'arrow':
      return <Feather name="arrow-right" size={size} color={color} />;
    case 'siren':
      return <MaterialCommunityIcons name="alarm-light-outline" size={size} color={color} />;
    case 'pin':
      return <Feather name="map-pin" size={size} color={color} />;
    case 'search':
      return <Feather name="search" size={size} color={color} />;
    case 'bell':
      return <Feather name="bell" size={size} color={color} />;
    case 'phone':
      return <Feather name="phone" size={size} color={color} />;
    case 'chat':
      return <Feather name="message-circle" size={size} color={color} />;
    case 'drop':
      return <Feather name="droplet" size={size} color={color} />;
    case 'pulse':
      return <Feather name="activity" size={size} color={color} />;
    case 'bolt':
      return <Feather name="zap" size={size} color={color} />;
    case 'bowl':
      return <MaterialCommunityIcons name="bowl-mix-outline" size={size} color={color} />;
    case 'support':
      return <MaterialCommunityIcons name="hand-heart-outline" size={size} color={color} />;
    case 'verified':
      return <Ionicons name="shield-checkmark-outline" size={size} color={color} />;
    case 'aid':
      return <MaterialCommunityIcons name="medical-bag" size={size} color={color} />;
    case 'extinguisher':
      return <MaterialCommunityIcons name="fire-extinguisher" size={size} color={color} />;
    case 'key':
      return <Feather name="key" size={size} color={color} />;
    case 'copy':
      return <Feather name="copy" size={size} color={color} />;
    case 'lock':
      return <Feather name="lock" size={size} color={color} />;
    case 'check':
      return <Feather name="check" size={size} color={color} />;
    case 'back':
      return <Feather name="arrow-left" size={size} color={color} />;
    case 'chevron':
      return <Feather name="chevron-right" size={size} color={color} />;
    case 'bookmark':
      return <Feather name="bookmark" size={size} color={color} />;
    case 'heart':
      return <Feather name="heart" size={size} color={color} />;
    case 'box':
      return <Feather name="box" size={size} color={color} />;
    case 'swap':
      return <MaterialCommunityIcons name="swap-horizontal" size={size} color={color} />;
    case 'locate':
      return <MaterialIcons name="my-location" size={size} color={color} />;
    case 'edit':
      return <Feather name="edit-2" size={size} color={color} />;
    case 'logout':
      return <Feather name="log-out" size={size} color={color} />;
    case 'clock':
      return <Feather name="clock" size={size} color={color} />;
    case 'send':
      return <Feather name="send" size={size} color={color} />;
    case 'bag':
      return <Feather name="shopping-bag" size={size} color={color} />;
    case 'refresh':
      return <Feather name="refresh-cw" size={size} color={color} />;
    case 'mail':
      return <Feather name="mail" size={size} color={color} />;
    case 'star':
      return <Feather name="star" size={size} color={color} />;
    case 'camera':
      return <Feather name="camera" size={size} color={color} />;
    case 'filter':
      return <Feather name="filter" size={size} color={color} />;
    case 'eye':
      return <Feather name="eye" size={size} color={color} />;
    case 'accessibility':
      return <MaterialIcons name="accessibility" size={size} color={color} />;
    default:
      return null;
  }
}

/**
 * Iconos vectoriales del sistema con @expo/vector-icons.
 * Compatible al 100% con Expo, iOS, Android y Web.
 */
export function AppIcon({
  name,
  size = 24,
  color = '#5F6E65',
  weight,
}: {
  name: IconName;
  size?: number;
  color?: string;
  weight?: number;
}) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {renderVectorIcon(name, size, color)}
    </View>
  );
}
