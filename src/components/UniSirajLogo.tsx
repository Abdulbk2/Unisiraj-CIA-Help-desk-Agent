/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  variant?: 'full' | 'compact' | 'sidebar' | 'header' | 'icon-only' | 'university' | 'agent';
  className?: string;
  theme?: 'light' | 'dark';
}

/**
 * Official Logos for UniSIRAJ Architecture:
 * - Sidebar / University: UniSIRAJ Official University Logo (/images/unisiraj-official-university.png)
 * - Top Left Header / Agent: CIA Helpdesk Agent Logo (/images/cia-helpdesk-agent-official.png)
 * - Emblem only: Diamond pattern (/images/unisiraj-emblem-only.png)
 */
export const UniSirajLogo: React.FC<LogoProps> = ({
  variant = 'header',
  className = '',
}) => {
  // Sidebar / University variant: UniSIRAJ Official University Logo
  if (variant === 'compact' || variant === 'sidebar' || variant === 'university') {
    return (
      <div
        className={`flex items-center justify-center p-2 rounded-xl bg-white border border-[#E4E7EC] shadow-2xs ${className}`}
      >
        <img
          src="/images/unisiraj-official-university.png"
          alt="UniSIRAJ - Universiti Islam Antarabangsa Tuanku Syed Sirajuddin"
          className="w-full h-auto max-h-20 sm:max-h-24 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (variant === 'icon-only') {
    return (
      <div
        className={`inline-flex items-center justify-center bg-white p-1 rounded-lg border border-gray-100 shadow-2xs ${className}`}
      >
        <img
          src="/images/unisiraj-emblem-only.png"
          alt="UniSIRAJ Emblem"
          className="h-8 w-8 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Header / Agent variant: CIA Helpdesk Agent Logo
  return (
    <div
      className={`inline-flex items-center justify-center bg-white p-1 sm:p-1.5 rounded-xl border border-gray-100/80 shadow-2xs ${className}`}
    >
      <img
        src="/images/cia-helpdesk-agent-official.png"
        alt="CIA Helpdesk Agent - Visa Compliance & Renewal Support"
        className="h-10 sm:h-12 md:h-14 w-auto object-contain max-w-[260px] sm:max-w-[320px]"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
