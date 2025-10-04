import { Navbar } from '@/components/Navbar';
import BookList from './BookList';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <BookList />
    </div>
  );
};

export default Index;
