import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/StarRating';
import { ReviewCard } from '@/components/ReviewCard';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function BookDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [book, setBook] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [userReview, setUserReview] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'book' | 'review'>('book');

  useEffect(() => {
    fetchBookDetails();
  }, [id, user]);

  const fetchBookDetails = async () => {
    if (!id) return;

    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('*, profiles!books_added_by_fkey(name)')
      .eq('id', id)
      .single();

    if (bookError) {
      console.error('Error fetching book:', bookError);
      return;
    }

    setBook(bookData);

    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*, profiles(name)')
      .eq('book_id', id)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return;
    }

    setReviews(reviewsData || []);

    if (user) {
      const existingReview = reviewsData?.find((r) => r.user_id === user.id);
      if (existingReview) {
        setUserReview(existingReview);
        setNewRating(existingReview.rating);
        setNewReview(existingReview.review_text);
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to submit a review',
        variant: 'destructive'
      });
      return;
    }

    if (newRating === 0 || !newReview.trim()) {
      toast({
        title: 'Invalid review',
        description: 'Please provide both a rating and review text',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (isEditing && userReview) {
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: newRating,
            review_text: newReview,
          })
          .eq('id', userReview.id);

        if (error) throw error;
        toast({ title: 'Review updated successfully' });
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert({
            book_id: id,
            user_id: user.id,
            rating: newRating,
            review_text: newReview,
          });

        if (error) throw error;
        toast({ title: 'Review submitted successfully' });
      }

      setIsEditing(false);
      setNewRating(0);
      setNewReview('');
      fetchBookDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', userReview.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({ title: 'Review deleted' });
    setUserReview(null);
    setNewRating(0);
    setNewReview('');
    setIsEditing(false);
    fetchBookDetails();
  };

  const handleDeleteBook = async () => {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({ title: 'Book deleted successfully' });
    navigate('/');
  };

  if (!book) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const isOwner = user?.id === book.added_by;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <div className="aspect-[2/3] bg-muted relative overflow-hidden">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <StarRating rating={Math.round(averageRating)} readonly />
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({reviews.length})
                </span>
              </div>
              {isOwner && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/edit-book/${id}`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setDeleteType('book');
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{book.author}</p>
            <div className="flex gap-2 mb-4">
              <Badge>{book.genre}</Badge>
              <Badge variant="outline">{book.published_year}</Badge>
            </div>
            <p className="text-muted-foreground mb-2">
              Added by {book.profiles?.name}
            </p>
            {book.description && (
              <p className="text-foreground leading-relaxed">{book.description}</p>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {userReview && !isEditing ? 'Your Review' : 'Write a Review'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(!userReview || isEditing) && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Rating</label>
                    <StarRating rating={newRating} onRatingChange={setNewRating} size={32} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Review</label>
                    <Textarea
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                      placeholder="Share your thoughts about this book..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSubmitReview}>
                      {isEditing ? 'Update Review' : 'Submit Review'}
                    </Button>
                    {isEditing && (
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </>
              )}
              {userReview && !isEditing && (
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(true)}>Edit Your Review</Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteType('review');
                      setShowDeleteDialog(true);
                    }}
                  >
                    Delete Your Review
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4">All Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    id={review.id}
                    userName={review.profiles?.name || 'Anonymous'}
                    rating={review.rating}
                    reviewText={review.review_text}
                    createdAt={review.created_at}
                    isOwner={user?.id === review.user_id}
                    onEdit={() => {
                      setUserReview(review);
                      setNewRating(review.rating);
                      setNewReview(review.review_text);
                      setIsEditing(true);
                    }}
                    onDelete={() => {
                      setUserReview(review);
                      setDeleteType('review');
                      setShowDeleteDialog(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'book'
                ? 'This will permanently delete this book and all its reviews.'
                : 'This will permanently delete your review.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteType === 'book' ? handleDeleteBook : handleDeleteReview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
