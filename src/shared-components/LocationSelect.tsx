"use client";

import { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { getIndiaData, getStates, getCities, IndiaData, StateOption, CityOption } from "@/lib/indiaData";
import { Label } from "@/shared-components/ui/label";

interface LocationSelectProps {
  onStateChange: (stateName: string, stateCode: string) => void;
  onCityChange: (cityName: string) => void;
  stateError?: string;
  cityError?: string;
  disabled?: boolean;
}

export function LocationSelect({ onStateChange, onCityChange, stateError, cityError, disabled }: LocationSelectProps) {
  const [data, setData] = useState<IndiaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedStateCode, setSelectedStateCode] = useState<string>("");
  const [selectedCityName, setSelectedCityName] = useState<string>("");

  useEffect(() => {
    getIndiaData().then(fetchedData => {
      setData(fetchedData);
      setIsLoading(false);
    });
  }, []);

  const stateOptions = useMemo(() => {
    return data ? getStates(data) : [];
  }, [data]);

  const cityOptions = useMemo(() => {
    return data && selectedStateCode ? getCities(data, selectedStateCode) : [];
  }, [data, selectedStateCode]);

  const handleStateSelect = (option: StateOption | null) => {
    const code = option?.value || "";
    const name = option?.label || "";
    setSelectedStateCode(code);
    setSelectedCityName(""); // Reset city when state changes
    onStateChange(name, code);
    onCityChange("");
  };

  const handleCitySelect = (option: CityOption | null) => {
    const name = option?.value || "";
    setSelectedCityName(name);
    onCityChange(name);
  };

  const selectedStateOption = stateOptions.find(o => o.value === selectedStateCode) || null;
  const selectedCityOption = cityOptions.find(o => o.value === selectedCityName) || null;

  // Common react-select styles adapted for dark mode
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '40px',
      fontSize: '0.875rem',
      borderRadius: '0.5rem',
      backgroundColor: 'var(--rsl-bg, white)',
      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : base.boxShadow,
      '&:hover': { borderColor: state.isDisabled ? '#e5e7eb' : '#3b82f6' },
      opacity: state.isDisabled ? 0.6 : 1,
      cursor: state.isDisabled ? 'not-allowed' : 'default',
    }),
    menu: (base: any) => ({ ...base, zIndex: 50, fontSize: '0.875rem', borderRadius: '0.5rem' }),
    menuList: (base: any) => ({ ...base, maxHeight: '200px' }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : undefined,
      color: state.isSelected ? 'white' : '#111827',
    }),
    singleValue: (base: any) => ({ ...base, color: 'inherit' }),
    input: (base: any) => ({ ...base, color: 'inherit' }),
    placeholder: (base: any) => ({ ...base, color: '#9ca3af' }),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="state" className="text-sm font-medium">State *</Label>
        <Select
          inputId="state"
          instanceId="state-select"
          isLoading={isLoading}
          isDisabled={disabled || isLoading}
          options={stateOptions}
          value={selectedStateOption}
          onChange={(option: any) => handleStateSelect(option as StateOption | null)}
          placeholder={isLoading ? "Loading states..." : "Search state..."}
          noOptionsMessage={() => "No states found"}
          classNamePrefix="rsl"
          className="text-sm dark:text-gray-900"
          styles={selectStyles}
        />
        {stateError && (
          <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {stateError}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="city" className="text-sm font-medium">City *</Label>
        <Select
          inputId="city"
          instanceId="city-select"
          isLoading={isLoading}
          isDisabled={disabled || !selectedStateCode || isLoading}
          options={cityOptions}
          value={selectedCityOption}
          onChange={(option: any) => handleCitySelect(option as CityOption | null)}
          placeholder={!selectedStateCode ? "Select state first" : "Search city..."}
          noOptionsMessage={() => !selectedStateCode ? "Select a state first" : "No cities found"}
          classNamePrefix="rsl"
          className="text-sm dark:text-gray-900"
          styles={selectStyles}
        />
        {cityError && (
          <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {cityError}
          </p>
        )}
      </div>
    </div>
  );
}
