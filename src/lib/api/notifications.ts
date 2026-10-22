/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import {
  WhatsAppEligibleItem,
  SendWhatsAppPayload,
  SendWhatsAppResponse,
  NotificationLogItem,
} from './types';

export const NotificationsApi = {
  async getEligibleList(): Promise<WhatsAppEligibleItem[]> {
    return apiClient.getWhatsAppEligible();
  },

  async sendWhatsApp(payload: SendWhatsAppPayload): Promise<SendWhatsAppResponse> {
    return apiClient.sendWhatsAppMessage(payload);
  },

  async getHistory(): Promise<NotificationLogItem[]> {
    return apiClient.getNotificationHistory();
  },
};
