/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import { Student } from '../../types/student';

export const StudentsApi = {
  async getStudents(): Promise<Student[]> {
    return apiClient.getStudents();
  },

  async saveStudent(student: Student): Promise<Student> {
    return apiClient.saveStudent(student);
  },
};
