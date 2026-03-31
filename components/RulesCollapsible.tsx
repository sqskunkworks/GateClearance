'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function RulesCollapsible() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#E6E1D8', border: '1px solid #CBB892' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left transition-colors rounded-lg p-2 -m-2 cursor-pointer group"
      >
        <h3 className="text-lg font-semibold group-hover:underline" style={{ color: '#1F2933' }}>
          📋 Click here to read the full rules & guidelines
        </h3>
        {isOpen
          ? <ChevronUp className="h-5 w-5 flex-shrink-0" style={{ color: '#1C3D5A' }} />
          : <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: '#1C3D5A' }} />
        }
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 text-sm" style={{ color: '#1F2933' }}>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#1F2933' }}>
              👔 Dress Code
            </h4>
            <ul className="list-disc pl-5 space-y-1" style={{ color: '#1C3D5A' }}>
              <li>Wear <strong>black clothing only</strong></li>
              <li>No blue, green, yellow, orange, or gray in any shade</li>
              <li>No denim, sweats, shorts, or sleeveless shirts</li>
              <li>No revealing or form-fitting attire</li>
              <li>Dress professionally or business casual</li>
              <li>No white T-shirts</li>
              <li><strong>When in doubt, wear black</strong> - it's always a safe choice</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#1F2933' }}>
              📱 Devices & Personal Items
            </h4>
            <ul className="list-disc pl-5 space-y-1" style={{ color: '#1C3D5A' }}>
              <li>No phones, wallets, keys, or electronic devices inside (including smart watches)</li>
              <li>Leave these items in your car or check them at the East Gate if using public transport</li>
              <li>Only a clear plastic water bottle is allowed</li>
              <li>No bags, food, or drinks</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#1F2933' }}>
              💬 Contact Information Exchange
            </h4>
            <ul className="list-disc pl-5 space-y-1" style={{ color: '#1C3D5A' }}>
              <li>Exchange of contact info must be approved by the Impact Team President (Kai Bannon) and your escort</li>
              <li>Do not accept contact details from incarcerated people without approval</li>
              <li>If approached, politely decline and ask Kai and your escort first</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#1F2933' }}>
              📄 Written Materials
            </h4>
            <ul className="list-disc pl-5 space-y-1" style={{ color: '#1C3D5A' }}>
              <li>No personal paperwork, business cards, or contact cards</li>
              <li>Only materials directly related to SkunkWorks are permitted</li>
              <li>Any exchange must have explicit approval from the Impact Team President and your escort</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}