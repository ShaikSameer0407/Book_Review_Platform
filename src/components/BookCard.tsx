import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  genre: string;
  publishedYear: number;
  coverUrl?: string;
  averageRating?: number;
  reviewCount?: number;
}

export function BookCard({
  id,
  title,
  author,
  genre,
  publishedYear,
  coverUrl,
  averageRating = 0,
  reviewCount = 0
}: BookCardProps) {
  return (
    <Link to={`/book/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="aspect-[2/3] bg-muted relative overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="pt-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{author}</p>
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(averageRating)} readonly size={16} />
            <span className="text-xs text-muted-foreground">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-xs text-muted-foreground pt-0">
          <Badge variant="secondary">{genre}</Badge>
          <span>{publishedYear}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
