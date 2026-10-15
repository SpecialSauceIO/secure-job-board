'use client'

import { useState, useEffect } from 'react'
import {
  US_STATES_AND_METROS,
  US_REMOTE_REGIONS,
  parseLocationString,
} from '@/constants/usLocations'

interface UsLocationSelectorProps {
  name?: string
  value?: string
  onChange?: (combinedLocation: string) => void
  workModel?: string
  required?: boolean
  allowRemoteOption?: boolean
}

export default function UsLocationSelector({
  name = 'location',
  value = '',
  onChange,
  workModel = 'hybrid',
  required = true,
  allowRemoteOption = true,
}: UsLocationSelectorProps) {
  const initialParsed = parseLocationString(value)

  const [selectedState, setSelectedState] = useState<string>(
    initialParsed.stateCode || (workModel === 'remote' && allowRemoteOption ? 'REMOTE_US' : '')
  )
  const [selectedMetro, setSelectedMetro] = useState<string>(
    initialParsed.metro ||
      (workModel === 'remote' && allowRemoteOption ? US_REMOTE_REGIONS[0] : '')
  )

  // Sync if parent updates `value` externally (e.g. AI Job Scanner or Edit Job load)
  useEffect(() => {
    if (value) {
      const parsed = parseLocationString(value)
      if (parsed.stateCode) {
        setSelectedState(parsed.stateCode)
        setSelectedMetro(parsed.metro)
      }
    }
  }, [value])

  // If employer toggles Work Model to 'remote' and hasn't picked a state yet, default to US Remote Regions
  useEffect(() => {
    if (workModel === 'remote' && !selectedState && allowRemoteOption) {
      setSelectedState('REMOTE_US')
      const defaultRemote = US_REMOTE_REGIONS[0]
      setSelectedMetro(defaultRemote)
      onChange?.(defaultRemote)
    } else if (workModel !== 'remote' && selectedState === 'REMOTE_US') {
      setSelectedState('')
      setSelectedMetro('')
      onChange?.('')
    }
  }, [workModel])

  const stateObj = US_STATES_AND_METROS.find((s) => s.code === selectedState)
  const metroOptions =
    selectedState === 'REMOTE_US'
      ? US_REMOTE_REGIONS
      : stateObj
      ? [...stateObj.metros, `Other / Statewide (${stateObj.code})`]
      : []

  const buildCombinedValue = (stCode: string, metroVal: string) => {
    if (!stCode || !metroVal) return ''
    if (stCode === 'REMOTE_US') return metroVal
    if (metroVal.endsWith(`(${stCode})`) || metroVal.endsWith(`, ${stCode}`)) {
      return metroVal
    }
    return `${metroVal}, ${stCode}`
  }

  const handleStateChange = (newStateCode: string) => {
    setSelectedState(newStateCode)

    if (!newStateCode) {
      setSelectedMetro('')
      onChange?.('')
      return
    }

    if (newStateCode === 'REMOTE_US') {
      const firstRemote = US_REMOTE_REGIONS[0]
      setSelectedMetro(firstRemote)
      onChange?.(firstRemote)
      return
    }

    const found = US_STATES_AND_METROS.find((s) => s.code === newStateCode)
    const firstMetro = found?.metros[0] || ''
    setSelectedMetro(firstMetro)
    onChange?.(buildCombinedValue(newStateCode, firstMetro))
  }

  const handleMetroChange = (newMetro: string) => {
    setSelectedMetro(newMetro)
    onChange?.(buildCombinedValue(selectedState, newMetro))
  }

  const combinedValue = buildCombinedValue(selectedState, selectedMetro)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <input type="hidden" name={name} value={combinedValue} />

      {/* 1. US State Dropdown */}
      <div>
        <label className="block text-sm font-bold text-slate-700">
          US State {allowRemoteOption && workModel === 'remote' ? '/ Remote Scope' : ''}
        </label>
        <select
          required={required}
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
        >
          <option value="">Select a US State...</option>
          {allowRemoteOption && (
            <option value="REMOTE_US">🇺🇸 US Remote (By Timezone / Nationwide)</option>
          )}
          {US_STATES_AND_METROS.map((st) => (
            <option key={st.code} value={st.code}>
              {st.name} ({st.code})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Major Metro / City Dropdown */}
      <div>
        <label className="block text-sm font-bold text-slate-700">
          {selectedState === 'REMOTE_US' ? 'US Remote Timezone / Region' : 'Major Metro Area / City'}
        </label>
        <select
          required={required}
          disabled={!selectedState}
          value={selectedMetro}
          onChange={(e) => handleMetroChange(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-400"
        >
          {!selectedState ? (
            <option value="">Select a state first...</option>
          ) : (
            metroOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  )
}