
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { REGIONS } from '../lib/constants';
import { ScrollArea } from "@/components/ui/scroll-area";

interface RegionSelectorProps {
  selectedRegion: any;
  onRegionChange: (code: string) => void;
  className?: string;
}

const RegionSelector = ({ selectedRegion, onRegionChange, className = '' }: RegionSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRegions, setFilteredRegions] = useState(REGIONS);

  useEffect(() => {
    if (searchTerm) {
      const filtered = REGIONS.filter(region => 
        region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        region.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRegions(filtered);
    } else {
      setFilteredRegions(REGIONS);
    }
  }, [searchTerm]);

  return (
    <div className={`bg-[#232323] rounded-lg p-4 shadow-lg ${className}`}>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search country by name or code..."
          className="w-full bg-[#1a1a1a] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>
      
      <ScrollArea className="h-[300px] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredRegions.map((region) => (
            <button
              key={region.code}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                selectedRegion?.code === region.code ? 'bg-purple-500' : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
              }`}
              onClick={() => {
                onRegionChange(region.code);
                setSearchTerm('');
              }}
            >
              <span className="text-lg">{region.flag}</span>
              <span className="text-sm truncate">{region.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
      {filteredRegions.length === 0 && (
        <div className="text-center py-3 text-gray-400">
          No countries found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default RegionSelector;
