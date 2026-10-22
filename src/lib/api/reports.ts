/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import { BackendIntegrationStatus, DashboardSummaryResponse } from './types';

export const ReportsApi = {
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    return apiClient.getDashboardSummary();
  },

  async getIntegrationStatus(): Promise<BackendIntegrationStatus> {
    return apiClient.getIntegrationStatus();
  },
};
