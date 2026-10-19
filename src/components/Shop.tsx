import React, { useState } from 'react';
import { ShoppingBag, Star, Check, Sparkles, Filter, ShieldCheck, Tag, PackageOpen } from 'lucide-react';
import { ShopItem } from '../types/botanical';
import { EmptyState } from './EmptyState';

export const Shop: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const items: ShopItem[] = [
    {
      id: 'item-1',
      name: 'Organic Liquid Rose & Bloom Booster',
      category: 'Fertilizers',
      price: 18.99,
      rating: 4.9,
      reviewsCount: 342,
      imageUrl: 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=600&q=80',
      description: 'Bio-active microbial extract formulated for hybrid tea roses and tropical ornamentals.',
      inStock: true
    },
    {
      id: 'item-2',
      name: 'Smart 3-in-1 Soil Moisture & pH Sensor',
      category: 'Smart Sensors',
      price: 29.50,
      rating: 4.8,
      reviewsCount: 819,
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      description: 'Precision electrode probe for testing deep root hydro-saturation and light levels instantly.',
      inStock: true
    },
    {
      id: 'item-3',
      name: 'Ergonomic Titanium Botanical Pruner',
      category: 'Tools',
      price: 24.99,
      rating: 4.9,
      reviewsCount: 512,
      imageUrl: 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=600&q=80',
      description: 'Ultra-sharp Japanese bypass blades for clean stem incisions that prevent bacterial ingress.',
      inStock: true
    },
    {
      id: 'item-4',
      name: 'Handcrafted Unglazed Terracotta Planter',
      category: 'Pots & Soil',
      price: 22.00,
      rating: 4.7,
      reviewsCount: 198,
      imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80',
      description: 'Porous clay pot with matching drainage saucer for superior root aeration and moisture balance.',
      inStock: true
    },
    {
      id: 'item-5',
      name: 'Premium Chunky Aroid Potting Medium',
      category: 'Pots & Soil',
      price: 16.50,
      rating: 4.9,
      reviewsCount: 420,
      imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
      description: 'Custom blend of pine bark, pumice, coco coir chunks, and activated horticultural charcoal.',
      inStock: true
    },
    {
      id: 'item-6',
      name: 'Ultra-Fine Continuous Botanical Mister',
      category: 'Tools',
      price: 14.99,
      rating: 4.8,
      reviewsCount: 650,
      imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
      description: 'Aerosol-free continuous 360° spray mechanism for gentle foliage hydration.',
      inStock: true
    }
  ];

  const categories = ['All', 'Fertilizers', 'Smart Sensors', 'Tools', 'Pots & Soil'];

  const filteredItems = selectedCategory === 'All' 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  const handleAddToCart = (item: ShopItem) => {
    setCartItems([...cartItems, item.id]);
    setSuccessToast(`Added "${item.name}" to cart!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            Curated Botanical Store
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white font-sans">
            Floravia Botanical Apothecary
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Professional organic fertilizers, calibrated moisture meters, and precision tools.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-4 py-2 bg-[#0b1f16] border border-emerald-500/15 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">{cartItems.length}</span>
            <span>Items in Cart</span>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-[#0b1f16] text-slate-300 hover:text-white border border-emerald-500/15 hover:border-emerald-500/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          variant="card"
          icon={PackageOpen}
          badge="Botanical Supply Store"
          title="No Products Found"
          description={`No botanical supplies match the "${selectedCategory}" category filter. Switch categories or check back soon for incoming stock.`}
          action={{
            label: "Show All Supplies",
            onClick: () => setSelectedCategory('All')
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isAdded = cartItems.includes(item.id);
            return (
              <div 
                key={item.id}
                className="bg-[#0b1f16] border border-emerald-500/15 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-emerald-500/40 transition-all group"
              >
                <div className="h-48 w-full bg-black/40 overflow-hidden relative">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-emerald-300 border border-white/10 uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-bold">{item.rating}</span>
                        <span className="text-slate-500 text-[10px]">({item.reviewsCount})</span>
                      </div>
                      <span className="text-base font-extrabold text-emerald-400">${item.price}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    }`}
                  >
                    {isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    <span>{isAdded ? 'Added to Cart' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#0d2117] border border-emerald-500/40 rounded-xl shadow-2xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
};
