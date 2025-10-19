export interface ImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export interface ImageFile {
  file: File;
  preview: string;
}

export interface StyleOption {
  id: string;
  name: string;
  preview: string;
}

export interface Product {
  name: string;
  description: string;
  purchaseUrl: string;
  imageUrl: string; // The cropped/isolated image of the product
  customPurchaseUrl?: string;
  sharedBy?: string;
}

export interface Color {
  hex: string;
  name: string;
}

export interface RedesignedRoom {
  id: string;
  roomName: string;
  imageUrl: string;
  products?: Product[];
  isLoadingProducts?: boolean;
  isFavorited?: boolean;
  likes?: number;
  reactions?: { [key: string]: number };
  colorPalette?: Color[];
  isLoadingPalette?: boolean;
}