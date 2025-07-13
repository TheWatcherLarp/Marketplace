import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 z-10">
      <div className="max-w-4xl mx-auto flex justify-end">
        <Button asChild variant="outline">
          <Link to="/home">Home</Link>
        </Button>
      </div>
    </header>
  );
};

export default Header;