/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import { AgentQueryRequest, AgentQueryResponse } from './types';

export const AgentApi = {
  async queryAgent(request: AgentQueryRequest): Promise<AgentQueryResponse> {
    return apiClient.queryAgent(request.query);
  },
};
