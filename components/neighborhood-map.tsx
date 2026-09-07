'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG needs SVG elements; native HTML img/button cannot replace svg/g. Keyboard handlers and labels are provided. */
import { useState } from 'react';
import { Minus, Plus, LocateFixed } from 'lucide-react';
import type { DispatchState } from '@/lib/domain';
export default function NeighborhoodMap({
  state,
  selected,
  onSelect,
}: {
  state: DispatchState;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  return (
    <div className="neighborhood-map">
      <div className="map-topline">
        <span>
          <i className="live-dot" /> WICKER PARK, CHICAGO
        </span>
        <span>Illustrative neighborhood</span>
      </div>
      <svg
        viewBox="0 0 900 540"
        className="map-svg"
        role="group"
        aria-label="Illustrative map of donation sites, recipients, drivers, and reserved routes"
      >
        <defs>
          <pattern
            id="blocks"
            width="76"
            height="68"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-8)"
          >
            <rect x="8" y="8" width="58" height="49" rx="6" fill="#e4e9e5" />
            <rect x="13" y="13" width="48" height="39" rx="3" fill="#edf0ec" />
          </pattern>
          <filter id="pin-shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity=".16" />
          </filter>
        </defs>
        <g
          transform={`translate(${450 * (1 - zoom)}, ${270 * (1 - zoom)}) scale(${zoom})`}
        >
          <rect width="900" height="540" fill="#f2f4ef" />
          <rect width="900" height="540" fill="url(#blocks)" />
          <path
            d="M-40 375 Q240 338 415 237 T940 60"
            fill="none"
            stroke="#fff"
            strokeWidth="23"
          />
          <path
            d="M-40 375 Q240 338 415 237 T940 60"
            fill="none"
            stroke="#e1d8c3"
            strokeWidth="2"
          />
          <path
            d="M-10 140 L920 140 M-10 407 L920 407 M330 -30 L330 580 M695 -30 L695 580"
            fill="none"
            stroke="white"
            strokeWidth="18"
          />
          <path
            d="M330 -30 L330 580 M-10 140 L920 140"
            fill="none"
            stroke="#dbded6"
            strokeWidth="1.5"
          />
          <rect
            x="368"
            y="311"
            width="114"
            height="72"
            rx="20"
            fill="#d1e0c6"
          />
          <path d="M380 350h87M423 320v54" stroke="#e8efdf" strokeWidth="5" />
          <text x="425" y="344" textAnchor="middle" className="park-label">
            WICKER PARK
          </text>
          <text x="420" y="132" className="street-label">
            W NORTH AVENUE
          </text>
          <text x="70" y="399" className="street-label">
            W DIVISION STREET
          </text>
          <text
            transform="translate(320,460) rotate(-90)"
            className="street-label"
          >
            N DAMEN AVENUE
          </text>
          <text
            transform="translate(684,340) rotate(-90)"
            className="street-label"
          >
            N ASHLAND AVENUE
          </text>
          <text
            x="546"
            y="205"
            transform="rotate(-28,546,205)"
            className="street-label"
          >
            N MILWAUKEE AVE
          </text>
          {state.assignments.map((a) => {
            const d = state.donations.find((d) => d.id === a.donationId)!;
            const r = state.recipients.find((r) => r.id === a.recipientId)!;
            const v = state.drivers.find((v) => v.id === a.driverId)!;
            const path = `M ${d.point.x * 9} ${d.point.y * 5.4} Q ${r.point.x * 9} ${d.point.y * 5.4} ${r.point.x * 9} ${r.point.y * 5.4}`;
            return (
              <g key={a.id}>
                <path d={path} fill="none" stroke="white" strokeWidth="7" />
                <path
                  className="route-line"
                  d={path}
                  fill="none"
                  stroke={v.color}
                  strokeWidth="3"
                  strokeDasharray="7 5"
                />
              </g>
            );
          })}
          {state.recipients.map((r) => (
            <g
              key={r.id}
              transform={`translate(${r.point.x * 9},${r.point.y * 5.4})`}
            >
              <rect
                x="-14"
                y="-14"
                width="28"
                height="28"
                rx="9"
                fill="#176b55"
                stroke="white"
                strokeWidth="3"
                filter="url(#pin-shadow)"
              />
              <path
                d="M-6 -2L0 -7L6 -2V6H-6Z"
                fill="none"
                stroke="white"
                strokeWidth="1.6"
              />
              <rect
                x="-65"
                y="21"
                width="130"
                height="23"
                rx="5"
                fill="white"
                fillOpacity=".95"
              />
              <text y="37" textAnchor="middle" className="map-label">
                {r.name}
              </text>
            </g>
          ))}
          {state.donations.map((d, i) => (
            <g
              key={d.id}
              role="button"
              tabIndex={0}
              aria-label={`${d.name}, ${d.portions} portions`}
              onClick={() => onSelect(d.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(d.id);
                }
              }}
              className={`donation-pin ${selected === d.id ? 'selected' : ''}`}
              transform={`translate(${d.point.x * 9},${d.point.y * 5.4})`}
            >
              <circle
                r="25"
                fill="#f5b645"
                fillOpacity={selected === d.id ? '.3' : '0'}
              />
              <circle
                r="16"
                fill={
                  state.assignments.some((a) => a.donationId === d.id)
                    ? '#176b55'
                    : '#f2ad3e'
                }
                stroke="white"
                strokeWidth="3"
                filter="url(#pin-shadow)"
              />
              <text
                textAnchor="middle"
                y="5"
                fill={
                  state.assignments.some((a) => a.donationId === d.id)
                    ? 'white'
                    : '#3c301b'
                }
                fontSize="13"
                fontWeight="700"
              >
                {String(i + 1).padStart(2, '0')}
              </text>
              <rect
                x="-59"
                y="23"
                width="118"
                height="24"
                rx="5"
                fill="white"
                fillOpacity=".96"
              />
              <text y="39" textAnchor="middle" className="map-label">
                {d.name}
              </text>
            </g>
          ))}
          {state.drivers.map((v) => (
            <g
              key={v.id}
              transform={`translate(${v.point.x * 9},${v.point.y * 5.4})`}
              opacity={v.available ? 1 : 0.4}
            >
              <circle r="13" fill="white" stroke={v.color} strokeWidth="2" />
              <text
                textAnchor="middle"
                y="4"
                fill={v.color}
                fontSize="9"
                fontWeight="800"
              >
                {v.initials}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <div className="map-legend">
        <span>
          <i className="legend-dot donation" />
          Donation
        </span>
        <span>
          <i className="legend-dot recipient" />
          Community partner
        </span>
        <span>
          <i className="legend-dot driver" />
          Driver
        </span>
      </div>
      <div className="map-controls">
        <button
          onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
          aria-label="Zoom in"
        >
          <Plus size={17} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.85, z - 0.15))}
          aria-label="Zoom out"
        >
          <Minus size={17} />
        </button>
        <button onClick={() => setZoom(1)} aria-label="Reset map view">
          <LocateFixed size={17} />
        </button>
      </div>
    </div>
  );
}
