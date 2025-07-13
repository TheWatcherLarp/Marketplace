import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 z-10">
      <div className="max-w-4xl mx-auto flex justify-end space-x-2">
        <Button asChild variant="outline">
          <Link to="/home">Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/character-inventory">Inventory</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/marketplace">Marketplace</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Info</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/branch-members">Branch Members</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;