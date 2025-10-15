'use client'

import { useState } from 'react'
import { Plus, Folder, History, Settings, ChevronRight, ChevronDown } from 'lucide-react'
import Collections from './Collections'
import Environments from './Environments'

interface SidebarProps {
  onNewRequest: () => void
}

export default function Sidebar({ onNewRequest }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    collections: true,
    history: true,
    environments: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="w-64 bg-[#1e1e1e] border-r border-[#3c3c3c] text-gray-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#3c3c3c]">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">COLLECTIONS</h2>
          <p className="text-xs text-gray-500 mt-1">+ New Collection</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Collections */}
        <div className="border-b border-[#3c3c3c]">
          <button
            onClick={() => toggleSection('collections')}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[#2a2a2a] transition-colors group"
          >
            <div className="flex items-center space-x-2">
              <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.collections ? 'rotate-90' : ''}`} />
              <Folder className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
              <span className="text-sm font-medium text-gray-400">Collections</span>
            </div>
          </button>
          {expandedSections.collections && (
            <div className="px-4 pb-2">
              <Collections />
              <div className="text-sm text-gray-500 py-4 text-center">
                <p>No collections yet</p>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="border-b border-[#3c3c3c]">
          <button
            onClick={() => toggleSection('history')}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[#2a2a2a] transition-colors group"
          >
            <div className="flex items-center space-x-2">
              <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.history ? 'rotate-90' : ''}`} />
              <History className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
              <span className="text-sm font-medium text-gray-400">History</span>
            </div>
          </button>
          {expandedSections.history && (
            <div className="px-4 pb-2">
              <div className="text-sm text-gray-500 py-4 text-center">
                <p>No recent requests</p>
              </div>
            </div>
          )}
        </div>

        {/* Environments */}
        <div className="border-b border-[#3c3c3c]">
          <button
            onClick={() => toggleSection('environments')}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[#2a2a2a] transition-colors group"
          >
            <div className="flex items-center space-x-2">
              <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.environments ? 'rotate-90' : ''}`} />
              <Settings className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
              <span className="text-sm font-medium text-gray-400">Environments</span>
            </div>
          </button>
          {expandedSections.environments && (
            <div className="px-2 pb-2">
              <Environments />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
