import React, { useState, useEffect, useCallback } from 'react';
import { ImageFile, StyleOption, RedesignedRoom, Product } from './types';
import { GeminiService } from './services/geminiService';
import { useUserCredits } from './src/hooks/useUserCredits';
import { useFavorites } from './src/hooks/useFavorites';
import { useSharedDesigns } from './src/hooks/useSharedDesigns';
import { useCustomProductLinks } from './src/hooks/useCustomProductLinks';

import ImageUploader from './components/ImageUploader';
import FloorPlanGallery from './components/FloorPlanGallery';
import RoomSelector from './components/RoomSelector';
import StyleSelector from './components/StyleSelector';
import RoomCard from './components/RoomCard';
import ProductDetailModal from './components/ProductDetailModal';
import UserCredits from './components/UserCredits';
import PricingModal from './components/PricingModal';
import SavedView from './components/SavedView';
import CommunityFeed from './components/CommunityFeed';
import ToggleSwitch from './components/ToggleSwitch';
import Carousel from './components/Carousel';
import Slideshow from './components/Slideshow';
import HouseDisplayModal from './components/HouseDisplayModal';
import { ClipboardDocumentIcon } from './components/Icons';

const styles: StyleOption[] = [
  { id: 'modern', name: 'Modern', preview: '' },
  { id: 'scandinavian', name: 'Scandinavian', preview: '' },
  { id: 'industrial', name: 'Industrial', preview: '' },
  { id: 'bohemian', name: 'Bohemian', preview: '' },
  { id: 'mid-century-modern', name: 'Mid-Century Modern', preview: '' },
  { id: 'coastal', name: 'Coastal', preview: '' },
];

type View = 'designer' | 'saved' | 'community';
type InputMode = 'sketch' | 'text';

const App: React.FC = () => {
    // User credits hook
    const { credits: userCredits, plan: userPlan, userId, deductCredits } = useUserCredits();
    
    // Database hooks
    const { favorites, toggleFavorite, isFavorited } = useFavorites(userId);
    const { sharedDesigns, shareDesign, likeDesign } = useSharedDesigns();
    const { saveCustomLink, getCustomLink } = useCustomProductLinks(userId);

    // Inputs
    const [sketchImage, setSketchImage] = useState<ImageFile | null>(null);
    const [textPrompt, setTextPrompt] = useState('');
    const [inputMode, setInputMode] = useState<InputMode>('sketch');
    const [floorPlans, setFloorPlans] = useState<string[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [rooms, setRooms] = useState<string[]>([]);
    const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [generateAllRooms, setGenerateAllRooms] = useState(false);

    // Outputs & State
    const [redesignedRooms, setRedesignedRooms] = useState<RedesignedRoom[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // App Features
    const [activeView, setActiveView] = useState<View>('designer');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProductRoomId, setSelectedProductRoomId] = useState<string | null>(null);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isSlideshowVisible, setIsSlideshowVisible] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [isShareLinkActive, setIsShareLinkActive] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');
    const [houseImageModalUrl, setHouseImageModalUrl] = useState<string | null>(null);

    const handleGenerateFloorPlans = useCallback(async () => {
        if (inputMode === 'sketch' && !sketchImage) return;
        if (inputMode === 'text' && !textPrompt.trim()) return;

        const cost = 1;
        if (userCredits < cost) {
            setIsPricingModalOpen(true);
            return;
        }

        setIsLoading(true);
        setLoadingStatus("Generating floor plans...");
        setError(null);
        setFloorPlans([]);
        setSelectedPlan(null);
        setRooms([]);
        setSelectedRooms([]);
        setRedesignedRooms([]);
        
        try {
            await deductCredits(cost);
            let plans: string[];
            if (inputMode === 'sketch' && sketchImage) {
                const imagePart = await GeminiService.fileToGenerativePart(sketchImage.file);
                plans = await GeminiService.generateFloorPlans(imagePart);
            } else {
                plans = await GeminiService.generateFloorPlanFromText(textPrompt);
            }
            setFloorPlans(plans);
            if (plans.length > 0) {
              setSelectedPlan(plans[0]);
            }
        } catch (e: any) {
            setError(e.message || "Failed to generate floor plans.");
        } finally {
            setIsLoading(false);
            setLoadingStatus('');
        }
    }, [userCredits, sketchImage, inputMode, textPrompt, deductCredits]);


    const handleGenerateRooms = async () => {
        if (!selectedPlan || selectedRooms.length === 0 || !selectedStyle) {
            setError("Please select a floor plan, at least one room, and a style.");
            return;
        }
        
        const cost = 2 * selectedRooms.length;
        if (userCredits < cost) {
            setIsPricingModalOpen(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        await deductCredits(cost);

        try {
            const planBlob = await fetch(selectedPlan).then(r => r.blob());
            const planFile = new File([planBlob], "plan.png", { type: "image/png" });
            const planPart = await GeminiService.fileToGenerativePart(planFile);
            const styleName = styles.find(s => s.id === selectedStyle)?.name || 'default';
            
            const newRooms: RedesignedRoom[] = [];

            for (let i = 0; i < selectedRooms.length; i++) {
                const roomName = selectedRooms[i];
                setLoadingStatus(`Redesigning ${roomName} (${i + 1} of ${selectedRooms.length})...`);
                const newImageUrl = await GeminiService.redesignRoom(planPart, roomName, styleName);
                const newRoom: RedesignedRoom = {
                    id: `${roomName}-${selectedStyle}-${Date.now()}`,
                    roomName: `${roomName} (${styleName})`,
                    imageUrl: newImageUrl,
                    likes: 0,
                    reactions: {},
                    isFavorited: isFavorited(`${roomName}-${selectedStyle}-${Date.now()}`)
                };
                newRooms.push(newRoom);
                setRedesignedRooms(prev => [newRoom, ...prev].slice(0, 10)); // Keep last 10
                
                // Auto-share to community feed
                if (userId) {
                    shareDesign(newRoom, userId);
                }
            }


        } catch (e: any) {
            setError(e.message || "An unknown error occurred during redesign.");
        } finally {
            setIsLoading(false);
            setLoadingStatus('');
        }
    };

    const handleRoomSelection = (room: string) => {
        if (generateAllRooms) return;
        setSelectedRooms([room]);
    };
    
    useEffect(() => {
        if (generateAllRooms) {
            setSelectedRooms(rooms);
        } else {
            if (rooms.length > 0) setSelectedRooms([rooms[0]]);
        }
    }, [generateAllRooms, rooms]);


    useEffect(() => {
        const extractRooms = async () => {
            if (!selectedPlan) return;
            setIsLoading(true);
            setLoadingStatus("Analyzing floor plan...");
            try {
                const planBlob = await fetch(selectedPlan).then(r => r.blob());
                const planFile = new File([planBlob], "plan.png", { type: "image/png" });
                const planPart = await GeminiService.fileToGenerativePart(planFile);
                const extracted = await GeminiService.extractRoomNamesFromPlan(planPart);
                setRooms(extracted);
                if(extracted.length > 0) setSelectedRooms([extracted[0]]);
            } catch (e: any) {
                setError("Could not read rooms from floor plan.");
                setRooms([]);
            } finally {
                setIsLoading(false);
                setLoadingStatus('');
            }
        };
        extractRooms();
    }, [selectedPlan]);
    
    const handleToggleFavorite = (roomToToggle: RedesignedRoom) => {
        toggleFavorite(roomToToggle);
        
        // Update local state to reflect the change immediately
        const updatedRoom = { ...roomToToggle, isFavorited: !roomToToggle.isFavorited };
        const updateState = (setter: React.Dispatch<React.SetStateAction<RedesignedRoom[]>>) => {
            setter(rooms => rooms.map(r => r.id === roomToToggle.id ? updatedRoom : r));
        }
        updateState(setRedesignedRooms);
    };
    
    const handleShareToFeed = (product: Product) => {
        setSelectedProduct(null);
        setActiveView('community');
    };
    
    const handleUpdateProductLink = async (product: Product, newUrl: string) => {
        if (!selectedProductRoomId || !userId) return;
        
        await saveCustomLink(selectedProductRoomId, product.name, newUrl);
        
        // Update product in all room states
        const updateProductInRoom = (room: RedesignedRoom): RedesignedRoom => {
            if (room.id === selectedProductRoomId && room.products) {
                return {
                    ...room,
                    products: room.products.map(p => 
                        p.name === product.name 
                            ? { ...p, customPurchaseUrl: newUrl }
                            : p
                    )
                };
            }
            return room;
        };
        
        setRedesignedRooms(rooms => rooms.map(updateProductInRoom));
    };

    const handleUpdateRoomInStates = (updatedRoom: RedesignedRoom) => {
         const update = (rooms: RedesignedRoom[]) => rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
         setRedesignedRooms(update);
    };

    const findProducts = async (room: RedesignedRoom) => {
        if (userCredits < 1) { setIsPricingModalOpen(true); return; }
        
        let roomToUpdate = { ...room, isLoadingProducts: true };
        handleUpdateRoomInStates(roomToUpdate);
        await deductCredits(1);

        try {
            const imageBlob = await fetch(room.imageUrl).then(r => r.blob());
            const imageFile = new File([imageBlob], "room.png", { type: "image/png" });
            const imagePart = await GeminiService.fileToGenerativePart(imageFile);
            const foundProducts = await GeminiService.findProductsInRoom(imagePart);
            
            // Apply custom links if they exist
            const productsWithCustomLinks = userId ? foundProducts.map(product => {
                const customUrl = getCustomLink(room.id, product.name);
                return customUrl ? { ...product, customPurchaseUrl: customUrl } : product;
            }) : foundProducts;
            
            roomToUpdate = { ...roomToUpdate, products: productsWithCustomLinks, isLoadingProducts: false };
        } catch (e: any) {
            setError(e.message || "Failed to find products.");
            roomToUpdate = { ...roomToUpdate, isLoadingProducts: false };
        } finally {
            handleUpdateRoomInStates(roomToUpdate);
        }
    };
    
    const handleProductSelect = (product: Product, roomId: string) => {
        setSelectedProduct(product);
        setSelectedProductRoomId(roomId);
    };
    
    const generatePalette = async (room: RedesignedRoom) => {
        if (userCredits < 1) { setIsPricingModalOpen(true); return; }
        
        let roomToUpdate = { ...room, isLoadingPalette: true };
        handleUpdateRoomInStates(roomToUpdate);
        await deductCredits(1);

        try {
            const imageBlob = await fetch(room.imageUrl).then(r => r.blob());
            const imageFile = new File([imageBlob], "room.png", { type: "image/png" });
            const imagePart = await GeminiService.fileToGenerativePart(imageFile);
            const palette = await GeminiService.generateColorPalette(imagePart);
            roomToUpdate = { ...roomToUpdate, colorPalette: palette, isLoadingPalette: false };
        } catch (e: any) {
            setError(e.message || "Failed to generate palette.");
            roomToUpdate = { ...roomToUpdate, isLoadingPalette: false };
        } finally {
            handleUpdateRoomInStates(roomToUpdate);
        }
    };

    const handleLike = (room: RedesignedRoom) => {
        if (!userId) return;
        likeDesign(room.id, userId);
    }
    
    const handleReact = (room: RedesignedRoom, emoji: string) => {
        // Reactions are handled locally for now
        const currentReactions = room.reactions || {};
        const updatedRoom = { 
            ...room, 
            reactions: {
                ...currentReactions,
                [emoji]: (currentReactions[emoji] || 0) + 1
            }
        };
        handleUpdateRoomInStates(updatedRoom);
    }
    
    const handleDownloadProject = () => {
        const links = [
            { name: 'floor-plan.png', url: selectedPlan },
            ...redesignedRooms.map((room, i) => ({ name: `room-${i+1}-${room.roomName.replace(/\s+/g, '-')}.png`, url: room.imageUrl }))
        ];

        links.forEach(linkInfo => {
            if (linkInfo.url) {
                const a = document.createElement('a');
                a.href = linkInfo.url;
                a.download = linkInfo.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    };
    
    const handleToggleShareLink = (isChecked: boolean) => {
        if (userPlan === 'Free' && isChecked) {
            setIsPricingModalOpen(true);
            return;
        }
        
        setIsShareLinkActive(isChecked);
        if (isChecked) {
            const uniqueId = Math.random().toString(36).substring(2, 10);
            setShareLink(`https://plantaia.com/share/${uniqueId}`);
        } else {
            setShareLink(null);
        }
    };

    const copyLinkToClipboard = () => {
        if (shareLink) {
            navigator.clipboard.writeText(shareLink);
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }
    };
    
    const handleGenerateHouse = async (room: RedesignedRoom): Promise<void> => {
        const cost = 2;
        if (userCredits < cost) {
            setIsPricingModalOpen(true);
            throw new Error("Insufficient credits");
        }

        await deductCredits(cost);
        setError(null);

        try {
            const imageBlob = await fetch(room.imageUrl).then(r => r.blob());
            const imageFile = new File([imageBlob], "room.png", { type: "image/png" });
            const imagePart = await GeminiService.fileToGenerativePart(imageFile);
            
            const styleMatch = room.roomName.match(/\(([^)]+)\)/);
            const styleName = styleMatch ? styleMatch[1] : 'default';

            const houseUrl = await GeminiService.generateHouseExterior(imagePart, styleName);
            setHouseImageModalUrl(houseUrl);
        } catch (e: any) {
            setError(e.message || "Failed to generate house exterior.");
            throw e;
        }
    };
    

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white border-b border-slate-200">
                <div className="px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-800">Room Designer</h1>
                    <UserCredits creditCount={userCredits} plan={userPlan} />
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Panel: Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                             <div className="flex border-b border-slate-200 mb-4">
                                <button onClick={() => setInputMode('sketch')} className={`flex-1 text-center py-2 font-semibold ${inputMode === 'sketch' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>1. Upload Sketch</button>
                                <button onClick={() => setInputMode('text')} className={`flex-1 text-center py-2 font-semibold ${inputMode === 'text' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>1. Use Text</button>
                            </div>
                            {inputMode === 'sketch' ? (
                                <ImageUploader image={sketchImage} onImageChange={setSketchImage} label="Drop floor plan sketch here" />
                            ) : (
                                <textarea
                                    value={textPrompt}
                                    onChange={(e) => setTextPrompt(e.target.value)}
                                    className="w-full h-40 p-3 border-2 border-dashed border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., 'A cozy 2-bedroom apartment with an open kitchen and a large balcony...'"
                                />
                            )}
                            <button onClick={handleGenerateFloorPlans} disabled={isLoading || (inputMode === 'sketch' && !sketchImage) || (inputMode === 'text' && !textPrompt)} className="w-full mt-4 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-slate-300">Generate Floor Plans (1 Credit)</button>
                        </div>

                        {floorPlans.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">2. Select a Plan</h2>
                                <FloorPlanGallery plans={floorPlans} selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} isLoading={isLoading && loadingStatus.includes('plan')} />
                            </div>
                        )}
                        
                        {rooms.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h2 className="text-xl font-bold text-slate-800 mb-2">3. Pick Rooms</h2>
                                <div className="mb-4"><ToggleSwitch label="Generate all rooms" onToggle={setGenerateAllRooms} /></div>
                                <RoomSelector rooms={rooms} activeRooms={selectedRooms} onSelectRoom={handleRoomSelection} disabled={generateAllRooms} />
                            </div>
                        )}

                        {selectedRooms.length > 0 && (
                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">4. Choose a Style</h2>
                                <StyleSelector styles={styles} selectedStyle={selectedStyle} onSelectStyle={setSelectedStyle} />
                            </div>
                        )}

                        <button
                            onClick={handleGenerateRooms}
                            disabled={!selectedPlan || selectedRooms.length === 0 || !selectedStyle || isLoading}
                            className="w-full bg-indigo-600 text-white font-semibold py-4 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all text-lg flex items-center justify-center shadow-lg"
                        >
                            {isLoading && loadingStatus.includes('Redesigning') ? loadingStatus : `Redesign ${selectedRooms.length} Room(s) (${2 * selectedRooms.length} Credits)`}
                        </button>
                        
                         {redesignedRooms.length > 0 && (
                             <div className="space-y-4">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h2 className="text-xl font-bold text-slate-800 mb-4">Create a Tour</h2>
                                     <button onClick={() => setIsSlideshowVisible(true)} className="w-full bg-teal-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-teal-600 transition-all text-md">
                                        Play Immersive Tour
                                    </button>
                                </div>
                                
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h2 className="text-xl font-bold text-slate-800 mb-2">Share Project</h2>
                                    <div className="mb-4">
                                        <ToggleSwitch 
                                            label="Enable commercial link" 
                                            onToggle={handleToggleShareLink} 
                                            isChecked={isShareLinkActive}
                                        />
                                        <p className="text-xs text-slate-500 mt-2">
                                            {userPlan === 'Free' ? 'Upgrade to a paid plan to enable sharing.' : 'Share a link to your project with clients or on social media.'}
                                        </p>
                                    </div>
                                    {shareLink && (
                                        <div className="flex items-center gap-2">
                                            <input type="text" readOnly value={shareLink} className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm" />
                                            <button onClick={copyLinkToClipboard} className="p-2 bg-slate-200 rounded-lg hover:bg-slate-300">
                                                <ClipboardDocumentIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                    {copySuccess && <p className="text-sm text-green-600 mt-2">{copySuccess}</p>}
                                </div>

                                <button onClick={handleDownloadProject} className="w-full bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-700 transition-all text-md">
                                    Download Project
                                </button>
                             </div>
                        )}
                    </div>

                    {/* Right Panel: Results */}
                    <div className="lg:col-span-2">
                        <div className="flex border-b border-slate-200 mb-6">
                            <button onClick={() => setActiveView('designer')} className={`px-4 py-2 font-semibold ${activeView === 'designer' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Designer</button>
                            <button onClick={() => setActiveView('saved')} className={`px-4 py-2 font-semibold ${activeView === 'saved' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Saved</button>
                            <button onClick={() => setActiveView('community')} className={`px-4 py-2 font-semibold ${activeView === 'community' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Community Feed</button>
                        </div>
                        
                        {activeView === 'designer' && (
                             <div className="space-y-8">
                                <Carousel 
                                    rooms={redesignedRooms}
                                    isLoading={isLoading && loadingStatus.includes('Redesigning')}
                                    onProductSelect={(product, roomId) => handleProductSelect(product, roomId)}
                                    onFindProducts={findProducts}
                                    onToggleFavorite={handleToggleFavorite}
                                    onRegenerate={() => handleGenerateRooms()}
                                    onGeneratePalette={generatePalette}
                                    onGenerateHouse={handleGenerateHouse}
                                />
                            </div>
                        )}

                        {activeView === 'saved' && (
                            <SavedView 
                                savedRooms={favorites} 
                                onProductSelect={(product) => handleProductSelect(product, '')} 
                                onToggleFavorite={handleToggleFavorite}
                                onFindProducts={findProducts}
                                onGeneratePalette={generatePalette}
                                onGenerateHouse={handleGenerateHouse}
                            />
                        )}
                        
                        {activeView === 'community' && (
                            <CommunityFeed 
                                feedItems={sharedDesigns} 
                                onProductSelect={(product) => handleProductSelect(product, '')} 
                                onToggleFavorite={handleToggleFavorite}
                                onFindProducts={findProducts}
                                onGeneratePalette={generatePalette}
                                onLike={handleLike}
                                onReact={handleReact}
                                onGenerateHouse={handleGenerateHouse}
                            />
                        )}

                    </div>
                </div>
            </main>

            {isSlideshowVisible && (
                <Slideshow rooms={redesignedRooms} onClose={() => setIsSlideshowVisible(false)} />
            )}

            <HouseDisplayModal 
                imageUrl={houseImageModalUrl} 
                onClose={() => setHouseImageModalUrl(null)} 
            />

                    <ProductDetailModal 
                        product={selectedProduct} 
                        onClose={() => {
                            setSelectedProduct(null);
                            setSelectedProductRoomId(null);
                        }} 
                        onShare={handleShareToFeed}
                        onUpdateLink={handleUpdateProductLink}
                    />
            
            <PricingModal
                isOpen={isPricingModalOpen}
                onClose={() => setIsPricingModalOpen(false)}
                currentPlan={userPlan}
                userId={userId}
            />
        </div>
    );
};

export default App;