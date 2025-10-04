import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  author: z.string().min(1, 'Author is required').max(100),
  description: z.string().max(2000).optional(),
  genre: z.string().min(1, 'Genre is required').max(50),
  published_year: z.number().min(1000).max(new Date().getFullYear()),
  cover_url: z.string().url('Invalid URL').optional().or(z.literal(''))
});

export default function AddEditBook() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    published_year: new Date().getFullYear(),
    cover_url: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isEditing) {
      fetchBook();
    }
  }, [user, isEditing, id]);

  const fetchBook = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching book:', error);
      toast({
        title: 'Error',
        description: 'Failed to load book',
        variant: 'destructive'
      });
      return;
    }

    if (data.added_by !== user?.id) {
      toast({
        title: 'Unauthorized',
        description: 'You can only edit your own books',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    setFormData({
      title: data.title,
      author: data.author,
      description: data.description || '',
      genre: data.genre,
      published_year: data.published_year,
      cover_url: data.cover_url || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validated = bookSchema.parse({
        ...formData,
        published_year: Number(formData.published_year),
        cover_url: formData.cover_url || undefined
      });

      if (isEditing) {
        const { error } = await supabase
          .from('books')
          .update(validated)
          .eq('id', id);

        if (error) throw error;
        toast({ title: 'Book updated successfully' });
        navigate(`/book/${id}`);
      } else {
        const { data, error } = await supabase
          .from('books')
          .insert([{
            title: validated.title,
            author: validated.author,
            description: validated.description || null,
            genre: validated.genre,
            published_year: validated.published_year,
            cover_url: validated.cover_url || null,
            added_by: user!.id
          }])
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Book added successfully' });
        navigate(`/book/${data.id}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save book',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Book' : 'Add New Book'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
              {errors.author && <p className="text-sm text-destructive">{errors.author}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre *</Label>
                <Input
                  id="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                />
                {errors.genre && <p className="text-sm text-destructive">{errors.genre}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="published_year">Published Year *</Label>
                <Input
                  id="published_year"
                  type="number"
                  value={formData.published_year}
                  onChange={(e) => setFormData({ ...formData, published_year: parseInt(e.target.value) })}
                />
                {errors.published_year && <p className="text-sm text-destructive">{errors.published_year}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_url">Cover Image URL (optional)</Label>
              <Input
                id="cover_url"
                type="url"
                value={formData.cover_url}
                onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                placeholder="https://example.com/cover.jpg"
              />
              {errors.cover_url && <p className="text-sm text-destructive">{errors.cover_url}</p>}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Update Book' : 'Add Book'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
