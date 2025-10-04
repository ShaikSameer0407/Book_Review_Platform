import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookCard } from '@/components/BookCard';
import { ReviewCard } from '@/components/ReviewCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userBooks, setUserBooks] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    // Fetch user's books
    const { data: booksData } = await supabase
      .from('books')
      .select(`
        *,
        reviews (rating)
      `)
      .eq('added_by', user.id)
      .order('created_at', { ascending: false });

    const booksWithRatings = booksData?.map((book: any) => {
      const ratings = book.reviews?.map((r: any) => r.rating) || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : 0;
      
      return {
        ...book,
        averageRating: avgRating,
        reviewCount: ratings.length
      };
    }) || [];

    setUserBooks(booksWithRatings);

    // Fetch user's reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select(`
        *,
        books (title)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setUserReviews(reviewsData || []);
  };

  if (!profile) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">{profile.name}'s Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{userBooks.length}</p>
              <p className="text-sm text-muted-foreground">Books Added</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">{userReviews.length}</p>
              <p className="text-sm text-muted-foreground">Reviews Written</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">
                {userReviews.length > 0
                  ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
                  : '0.0'}
              </p>
              <p className="text-sm text-muted-foreground">Avg Rating Given</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="books">My Books</TabsTrigger>
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="mt-6">
          {userBooks.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              You haven't added any books yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userBooks.map((book) => (
                <BookCard
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author}
                  genre={book.genre}
                  publishedYear={book.published_year}
                  coverUrl={book.cover_url}
                  averageRating={book.averageRating}
                  reviewCount={book.reviewCount}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          {userReviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              You haven't written any reviews yet.
            </p>
          ) : (
            <div className="space-y-4">
              {userReviews.map((review) => (
                <div key={review.id}>
                  <p className="text-sm font-medium mb-2">
                    Review for: <span className="text-primary">{review.books?.title}</span>
                  </p>
                  <ReviewCard
                    id={review.id}
                    userName={profile.name}
                    rating={review.rating}
                    reviewText={review.review_text}
                    createdAt={review.created_at}
                    isOwner={true}
                    onEdit={() => navigate(`/book/${review.book_id}`)}
                    onDelete={() => navigate(`/book/${review.book_id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
