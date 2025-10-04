import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from './StarRating';
import { Edit2, Trash2 } from 'lucide-react';

interface ReviewCardProps {
  id: string;
  userName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReviewCard({
  userName,
  rating,
  reviewText,
  createdAt,
  isOwner,
  onEdit,
  onDelete
}: ReviewCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold">{userName}</p>
            <StarRating rating={rating} readonly size={16} />
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{reviewText}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
