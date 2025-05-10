
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export interface GenreType {
  id: number;
  name: string;
}

interface GenreSelectorProps {
  genres: GenreType[];
  selectedGenre: GenreType;
  onGenreChange: (genre: GenreType) => void;
  label?: string;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({ 
  genres, 
  selectedGenre, 
  onGenreChange,
  label = "Genre" 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#232323] rounded-md border border-gray-700 hover:bg-[#2a2a2a] min-w-[120px] text-sm">
        <span>{selectedGenre.name}</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56 max-h-[300px]">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[250px]">
          {genres.map((genre) => (
            <DropdownMenuItem
              key={genre.id}
              className={`cursor-pointer ${selectedGenre.id === genre.id ? 'bg-purple-500/20' : ''}`}
              onClick={() => onGenreChange(genre)}
            >
              {genre.name}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GenreSelector;
