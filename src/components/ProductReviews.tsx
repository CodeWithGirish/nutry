import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Edit,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string;
  comment: string;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
  user_name: string;
  user_email: string;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const ProductReviews = ({ productId, productName }: ProductReviewsProps) => {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: "",
    comment: "",
  });

  // Stats
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0], // 1-star to 5-star counts
  });

  const [userHasReviewed, setUserHasReviewed] = useState(false);

  // Mock reviews for development/testing when database is not available
  const createMockReviews = () => {
    const mockReviews: Review[] = [
      {
        id: "mock-1",
        user_id: "mock-user-1",
        product_id: productId,
        rating: 5,
        title: "Excellent quality!",
        comment:
          "Really fresh and tasty. Great packaging and fast delivery. Will definitely order again!",
        helpful_count: 12,
        verified_purchase: true,
        created_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        user_name: "John D.",
        user_email: "john@example.com",
      },
      {
        id: "mock-2",
        user_id: "mock-user-2",
        product_id: productId,
        rating: 4,
        title: "Good value for money",
        comment:
          "Good quality nuts, fresh and well packaged. Slightly expensive but worth it.",
        helpful_count: 8,
        verified_purchase: true,
        created_at: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        user_name: "Sarah M.",
        user_email: "sarah@example.com",
      },
      {
        id: "mock-3",
        user_id: "mock-user-3",
        product_id: productId,
        rating: 5,
        title: "Perfect for my family",
        comment: "My kids love these! Healthy snacking option and great taste.",
        helpful_count: 5,
        verified_purchase: false,
        created_at: new Date(
          Date.now() - 21 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        user_name: "Michael R.",
        user_email: "michael@example.com",
      },
    ];

    setReviews(mockReviews);
    calculateReviewStats(mockReviews);
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (user) {
      checkUserReview();
    }
  }, [user, productId, reviews]);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Fetch reviews first
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      // Get unique user IDs to fetch user details
      const userIds = [
        ...new Set((reviewsData || []).map((review) => review.user_id)),
      ];

      let usersData: any[] = [];
      if (userIds.length > 0) {
        try {
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

          if (userError) {
            console.warn(
              "Could not fetch user profiles:",
              userError.message || userError,
            );
            // Continue without user data - reviews will show as "Anonymous User"
          } else {
            usersData = userData || [];
          }
        } catch (userFetchError) {
          console.warn("Error fetching user profiles:", userFetchError);
          // Continue without user data
        }
      }

      // Create a map of user ID to user details
      const userMap = usersData.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      // Transform reviews to include user details
      const enrichedReviews = (reviewsData || []).map((review: any) => ({
        ...review,
        user_name: userMap[review.user_id]?.full_name || "Anonymous User",
        user_email: userMap[review.user_id]?.email || "",
      }));

      setReviews(enrichedReviews);
      calculateReviewStats(enrichedReviews);
    } catch (error: any) {
      console.error("Error fetching reviews:", error.message || error);
      // Use mock data if database is not available
      console.log("Using mock reviews due to database error");
      createMockReviews();
    } finally {
      setLoading(false);
    }
  };

  const checkUserReview = () => {
    if (!user) return;
    const userReview = reviews.find((review) => review.user_id === user.id);
    setUserHasReviewed(!!userReview);
  };

  const calculateReviewStats = (reviewList: Review[]) => {
    const totalReviews = reviewList.length;

    if (totalReviews === 0) {
      setReviewStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [0, 0, 0, 0, 0],
      });
      return;
    }

    const totalRating = reviewList.reduce(
      (sum, review) => sum + review.rating,
      0,
    );
    const averageRating = totalRating / totalReviews;

    // Count reviews for each star rating (1-5)
    const ratingDistribution = [0, 0, 0, 0, 0];
    reviewList.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating - 1]++;
      }
    });

    setReviewStats({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
    });
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to write a review",
        variant: "destructive",
      });
      return;
    }

    if (reviewForm.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast({
        title: "Review incomplete",
        description: "Please provide both a title and comment",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("product_reviews").insert({
        user_id: user.id,
        product_id: productId,
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
        helpful_count: 0,
        verified_purchase: false, // TODO: Check if user actually purchased this product
      });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      });

      // Reset form and refresh reviews
      setReviewForm({ rating: 0, title: "", comment: "" });
      setShowReviewForm(false);
      fetchReviews();
    } catch (error: any) {
      console.error("Error submitting review:", error.message || error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpfulVote = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote",
        variant: "destructive",
      });
      return;
    }

    try {
      // For now, just increment helpful_count
      // In a more complex system, you'd track individual votes
      const review = reviews.find((r) => r.id === reviewId);
      if (!review) return;

      const newCount = isHelpful
        ? review.helpful_count + 1
        : Math.max(0, review.helpful_count - 1);

      const { error } = await supabase
        .from("product_reviews")
        .update({ helpful_count: newCount })
        .eq("id", reviewId);

      if (error) throw error;

      // Update local state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpful_count: newCount } : r,
        ),
      );

      toast({
        title: "Vote recorded",
        description: "Thank you for your feedback!",
      });
    } catch (error: any) {
      console.error("Error updating helpful count:", error.message || error);
    }
  };

  const StarRating = ({
    rating,
    onRatingChange,
    readonly = false,
    size = "h-5 w-5",
  }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: string;
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} cursor-pointer transition-colors ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-400"
            }`}
            onClick={() => !readonly && onRatingChange?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Customer Reviews
            </CardTitle>
            {user && !userHasReviewed && (
              <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                <DialogTrigger asChild>
                  <Button className="bg-brand-600 hover:bg-brand-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Write a Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Rating *</Label>
                      <div className="mt-2">
                        <StarRating
                          rating={reviewForm.rating}
                          onRatingChange={(rating) =>
                            setReviewForm({ ...reviewForm, rating })
                          }
                          size="h-6 w-6"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="reviewTitle">Review Title *</Label>
                      <Input
                        id="reviewTitle"
                        value={reviewForm.title}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            title: e.target.value,
                          })
                        }
                        placeholder="Summarize your experience"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="reviewComment">Your Review *</Label>
                      <Textarea
                        id="reviewComment"
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            comment: e.target.value,
                          })
                        }
                        placeholder="Tell others about your experience with this product"
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    <Button
                      onClick={handleSubmitReview}
                      disabled={submitting}
                      className="w-full bg-brand-600 hover:bg-brand-700"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">
                  {reviewStats.averageRating}
                </div>
                <div>
                  <StarRating
                    rating={Math.round(reviewStats.averageRating)}
                    readonly
                  />
                  <p className="text-sm text-gray-600">
                    Based on {reviewStats.totalReviews} reviews
                  </p>
                </div>
              </div>

              {!user && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sign in to write a review and see all reviews
                  </AlertDescription>
                </Alert>
              )}

              {user && userHasReviewed && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    You have already reviewed this product. Thank you!
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${
                          reviewStats.totalReviews > 0
                            ? (reviewStats.ratingDistribution[rating - 1] /
                                reviewStats.totalReviews) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {reviewStats.ratingDistribution[rating - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-600 mb-4">
                Be the first to review {productName}
              </p>
              {user && !userHasReviewed && (
                <Button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  Write the first review
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium">{review.user_name}</p>
                        <div className="flex items-center gap-2">
                          <StarRating
                            rating={review.rating}
                            readonly
                            size="h-4 w-4"
                          />
                          <span className="text-sm text-gray-600">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.verified_purchase && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified Purchase
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{review.title}</h4>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Was this helpful?
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHelpfulVote(review.id, true)}
                        className="text-gray-600 hover:text-green-600"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Yes ({review.helpful_count})
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHelpfulVote(review.id, false)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        No
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
