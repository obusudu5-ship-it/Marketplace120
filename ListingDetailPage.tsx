import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listingsAPI, ordersAPI, reviewsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [listing, setListing] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingRes, reviewsRes] = await Promise.all([
          listingsAPI.getById(id!),
          reviewsAPI.getListingReviews(id!),
        ]);
        setListing(listingRes.data.listing);
        setReviews(reviewsRes.data.reviews);
      } catch (error) {
        toast.error('Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const orderRes = await ordersAPI.create(id!, quantity);
      navigate(`/checkout/${orderRes.data.order.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!listing) return <div className="text-center py-8">Listing not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Images */}
        <div className="md:col-span-2">
          {listing.images.length > 0 && (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{listing.title}</h1>

          <div className="flex items-center space-x-2">
            <span className="text-3xl font-bold text-blue-600">
              ${listing.price}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-yellow-400">★★★★★</span>
            <span>{listing.rating} ({listing.reviewCount} reviews)</span>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded"
              />
            </div>

            <button
              onClick={handlePurchase}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Buy Now
            </button>

            <button className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold">
              Message Seller
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
      </div>

      {/* Reviews */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {review.reviewer.firstName} {review.reviewer.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-yellow-400">★ {review.rating}</span>
              </div>
              <p className="mt-2 text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}