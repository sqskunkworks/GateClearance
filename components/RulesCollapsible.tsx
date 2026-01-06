'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function RulesCollapsible() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
    <button
  type="button"
  onClick={() => setIsOpen(!isOpen)}
  className="flex items-center justify-between w-full text-left hover:bg-gray-100 transition-colors rounded-lg p-2 -m-2 cursor-pointer group"
>
  <h3 className="text-lg font-semibold text-gray-900 group-hover:underline">
    📋 Click here to read the full rules & guidelines
  </h3>
  {isOpen ? (
    <ChevronUp className="h-5 w-5 text-gray-600 flex-shrink-0" />
  ) : (
    <ChevronDown className="h-5 w-5 text-gray-600 flex-shrink-0" />
  )}
</button>

      {isOpen && (
        <div className="mt-4 space-y-4 text-sm text-gray-700">
          {/* Dress Code */}
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              👔 Dress Code
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Wear <strong>black clothing only</strong></li>
              <li>No blue, green, yellow, orange, or gray in any shade</li>
              <li>No denim, sweats, shorts, or sleeveless shirts</li>
              <li>No revealing or form-fitting attire</li>
              <li>Dress professionally or business casual</li>
              <li>No white T-shirts</li>
              <li><strong>When in doubt, wear black</strong> - it's always a safe choice</li>
            </ul>
          </div>

          {/* Devices & Items */}
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              📱 Devices & Personal Items
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>No phones, wallets, keys, or electronic devices inside (including smart watches)</li>
              <li>Leave these items in your car or check them at the East Gate if using public transport</li>
              <li>Only a clear plastic water bottle is allowed</li>
              <li>No bags, food, or drinks</li>
            </ul>
          </div>

          {/* Contact Exchange */}
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              💬 Contact Information Exchange
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Exchange of contact info must be approved by the Impact Team President (Kai Bannon) and your escort</li>
              <li>Do not accept contact details from incarcerated people without approval</li>
              <li>If approached, politely decline and ask Kai and your escort first</li>
            </ul>
          </div>

          {/* Written Materials */}
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              📄 Written Materials
            </h4>
            <ul className="list-disc pl-5 space-y-1">
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