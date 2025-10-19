import React from 'react';
import { Product } from '../types';

interface ProductGalleryProps {
  products: Product[];
  onSelect: (product: Product) => void;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ products, onSelect }) => {
  return (
    <div>
        <h4 className="text-sm font-semibold text-slate-600 mb-2 pl-1">Shop the look:</h4>
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1">
        {products.map((product) => (
            <div
            key={product.name}
            onClick={() => onSelect(product)}
            className="flex-shrink-0 w-24 h-24 bg-white p-1 rounded-lg cursor-pointer border-2 border-transparent hover:border-indigo-500 hover:scale-105 transition-all duration-200 shadow-sm"
            title={product.name}
            >
            <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-contain rounded-md" 
            />
            </div>
        ))}
        </div>
    </div>
  );
};

export default ProductGallery;
