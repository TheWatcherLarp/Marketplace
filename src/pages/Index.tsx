import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  // The SessionContextProvider handles the primary routing logic (to login, create-character, or home).
  // This Index page serves as a brief loading screen before the redirection takes effect.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-gray-700 dark:text-gray-300 text-lg">Loading application...</p>
      <MadeWithDyad />
    </div>
  );
};

export default Index;