/**
 * NotificationService - Daily reminder notifications
 * Only works on native platforms (iOS/Android)
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const NUDGE_MESSAGES = [
  'Future You has something to say',
  'Time for a check-in with your future self',
  'Your future self is waiting',
  'A quick chat could change your day',
  'What would Future You think about today?',
];

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  static async scheduleDailyReminder(hour: number, minute: number): Promise<void> {
    if (Platform.OS === 'web') return;

    await this.cancelAllReminders();

    const message = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Future You',
        body: message,
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  }

  static async cancelAllReminders(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static configure(): void {
    if (Platform.OS === 'web') return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
}
