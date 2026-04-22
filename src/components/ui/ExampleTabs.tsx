'use client'

import { useState } from 'react'

export interface ExampleTab {
  label: string
  code?: string
  language?: string
  text?: string
}

interface Props {
  tabs: ExampleTab[]
  color?: string
}

export default function ExampleTabs({ tabs, color = '#3183F7' }: Props) {
  const [active, setActive] = useState(0)
  const tab = tabs[active]

  return (
    <div className="rounded-2xl overflow-hidden my-6" style={{ border: '1.5px solid #E8E8E8' }}>
      {/* Tab bar */}
      <div className="flex" style={{ background: '#F5F6F8', borderBottom: '1.5px solid #E8E8E8' }}>
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="px-4 py-2.5 text-xs font-semibold transition-all relative"
            style={{
              color: active === i ? color : '#9CA3AF',
              background: active === i ? '#fff' : 'transparent',
              borderRight: '1px solid #E8E8E8',
            }}
          >
            {t.label}
            {active === i && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ background: color }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: '#1C1C2E' }}>
        {tab.language && (
          <div className="px-5 pt-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#555' }}>
            {tab.language}
          </div>
        )}
        {tab.code && (
          <pre className="px-5 py-4 overflow-x-auto" style={{ margin: 0 }}>
            <code style={{ color: '#A3E8A3', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7 }}>
              {tab.code}
            </code>
          </pre>
        )}
        {tab.text && !tab.code && (
          <div className="px-5 py-4 text-sm leading-relaxed" style={{ color: '#A3E8A3', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7 }}>
            {tab.text}
          </div>
        )}
      </div>
    </div>
  )
}
