/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APP_CONFIG = {
  institutionName: 'Universiti Islam Antarabangsa Tuanku Syed Sirajuddin',
  institutionAbbr: 'UniSIRAJ',
  departmentName: 'Centre for International Affairs (CIA)',
  systemTitle: 'UniSIRAJ CIA Helpdesk Agent',
  eventTitle: 'UniSID 2026 International Innovation, Invention & Design',
  advisor: 'Madam Ros Syammimi binti Hamid',
  version: '2.4.0',
  defaultBackendUrl: import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : ''),
  defaultMode: 'LIVE_FASTAPI' as 'LIVE_FASTAPI',
  complianceTiers: {
    tier1: { days: 90, label: 'Tier 1 (90-Day Early Reminder)' },
    tier2: { days: 60, label: 'Tier 2 (60-Day Renewal Follow-up)' },
    tier3: { days: 30, label: 'Tier 3 (30-Day Critical Notice)' },
  },
  sunnahValues: {
    amanah: "Amanah (Trustworthiness) - Safeguarding international students' welfare (Qur'an 4:58)",
    itqan: 'Itqan (Excellence) - Continuous, automated auditing to eliminate human oversight (al-Bayhaqi)',
    facilitation: 'Facilitation - "Make things easy and do not make them difficult" (Sahih al-Bukhari 69)',
  },
  sdgs: ['SDG 4: Quality Education (4.3)', 'SDG 8: Decent Work (8.2)', 'SDG 16: Strong Institutions (16.6)'],
};
