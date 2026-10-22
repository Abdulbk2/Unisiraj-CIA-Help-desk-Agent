/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import {
  SpreadsheetPreviewResponse,
  ColumnMappingConfig,
  SpreadsheetValidationResponse,
  SpreadsheetConfirmResponse,
} from './types';

export const ImportsApi = {
  async previewFile(file: File): Promise<SpreadsheetPreviewResponse> {
    return apiClient.previewSpreadsheet(file);
  },

  async validateRecords(
    mapping: ColumnMappingConfig,
    rows: Array<Record<string, string>>
  ): Promise<SpreadsheetValidationResponse> {
    return apiClient.validateSpreadsheet(mapping, rows);
  },

  async confirmImport(
    validated: SpreadsheetValidationResponse
  ): Promise<SpreadsheetConfirmResponse> {
    return apiClient.confirmSpreadsheetImport(validated);
  },
};
