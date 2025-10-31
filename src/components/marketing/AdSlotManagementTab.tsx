
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, setDoc, getDoc } from 'firebase/firestore';
import { Save, Loader2, Edit, CircleHelp, Info } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { MARKETING_FEATURES } from '@/lib/marketing-features';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import Image from 'next/image';
import { Badge } from '../ui/badge';

type AdSlot = {
    id: string;
    name: string;
    type: 'product' | 'manufacturer';
    pinnedEntityId?: string;
    expiresAt?: any;
    updatedAt?: any;
    updatedBy?: string;
    description: string;
};

type Entity = {
    id: string;
    name: string;
    imageUrl?: string;
}

const AdSlotCard = ({ slot, onSave, isSaving }: { slot: AdSlot; onSave: (id: string, entityId: string) => void; isSaving: boolean; }) => {
    const [pinnedId, setPinnedId] = React.useState(slot.pinnedEntityId || '');
    const [entity, setEntity] = React.useState<Entity | null>(null);
    const [isLoadingEntity, setIsLoadingEntity] = React.useState(false);
    const [isAutomatic, setIsAutomatic] = React.useState(false);
    const firestore = useFirestore();

    React.useEffect(() => {
        const fetchEntity = async (id: string, type: 'product' | 'manufacturer') => {
            if (!firestore || !id) {
                setEntity(null);
                return;
            }
            setIsLoadingEntity(true);
            try {
                let docSnap;
                if (type === 'manufacturer') {
                    const manufRef = doc(firestore, 'manufacturers', id);
                    docSnap = await getDoc(manufRef);
                } else {
                    // This is less efficient for products, requires knowing manufacturer
                    // For admin panel, this is acceptable for now.
                    const q = query(collection(firestore, 'products'), where('id', '==', id));
                    const snapshot = await getDocs(q);
                    if(!snapshot.empty) {
                        docSnap = snapshot.docs[0];
                    }
                }
                if (docSnap && docSnap.exists()) {
                    const data = docSnap.data();
                    setEntity({ id: docSnap.id, name: data.name || data.shopName, imageUrl: data.imageUrl || data.logoUrl });
                } else {
                    setEntity(null);
                }
            } catch (error) {
                console.error("Error fetching entity:", error);
                setEntity(null);
            } finally {
                setIsLoadingEntity(false);
            }
        };

        const fetchAutomaticContent = async () => {
            if (slot.id.includes('product')) {
                const products = await getRankedProducts(null);
                const sponsored = products.filter(p => p.isSponsored);
                if (sponsored.length > 0) {
                    setEntity(sponsored[0]);
                    setIsAutomatic(true);
                }
            }
             // TODO: Add logic for manufacturer slots
        }

        if (slot.pinnedEntityId) {
            setIsAutomatic(false);
            fetchEntity(slot.pinnedEntityId, slot.type);
        } else {
            fetchAutomaticContent();
        }

    }, [slot, firestore]);
    
    const isManuallyPinned = !!slot.pinnedEntityId;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{slot.name}</CardTitle>
                <CardDescription>{slot.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 items-center gap-4">
                    <Input 
                        placeholder={slot.type === 'product' ? 'Product ID' : 'Manufacturer ID'}
                        value={pinnedId}
                        onChange={e => setPinnedId(e.target.value)}
                    />
                    <Button onClick={() => onSave(slot.id, pinnedId)} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Override
                    </Button>
                </div>
                 {isLoadingEntity ? (
                    <Skeleton className="h-20 w-full" />
                ) : entity ? (
                     <div className="p-3 rounded-md bg-muted/50 border border-dashed flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                             <Image src={entity.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'} alt={entity.name} width={40} height={40} className="rounded-md aspect-square object-cover"/>
                            <div>
                                <p className="text-xs text-muted-foreground">{slot.type.charAt(0).toUpperCase() + slot.type.slice(1)}</p>
                                <p className="font-semibold text-sm line-clamp-1">{entity.name}</p>
                            </div>
                        </div>
                        <Badge variant={isManuallyPinned ? 'destructive' : 'secondary'}>{isManuallyPinned ? 'Manual' : 'Automatic'}</Badge>
                     </div>
                ) : (
                    <div className="p-3 rounded-md bg-muted/50 border border-dashed flex items-center justify-center text-center">
                        <p className="text-xs text-muted-foreground">No item is currently pinned or automatically assigned.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function AdSlotManagementTab() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);
    
    // Create Ad Slots from Marketing Features config
    const adSlots: AdSlot[] = React.useMemo(() => {
        return MARKETING_FEATURES.flatMap(group => 
            group.features
                .filter(f => f.key.startsWith('product:homepage') || f.key.startsWith('shop:homepage') || f.key.startsWith('product:category_top'))
                .map(f => ({
                    id: f.key.replace(/:/g, '-'), // e.g. product-homepage-rotation
                    name: f.defaultText.split(':')[0],
                    type: f.key.startsWith('shop:') ? 'manufacturer' : 'product',
                    description: f.defaultText,
                }))
        );
    }, []);

    const { data: remoteSlots, isLoading } = useCollection<AdSlot>(query(collection(firestore, 'adSlots')));
    
    const mergedSlots = React.useMemo(() => {
        return adSlots.map(localSlot => {
            const remote = remoteSlots?.find(r => r.id === localSlot.id);
            return remote ? { ...localSlot, ...remote } : localSlot;
        })
    }, [adSlots, remoteSlots]);

    const handleSave = async (id: string, entityId: string) => {
        setIsSaving(true);
        try {
            const slotRef = doc(firestore, 'adSlots', id);
            await updateDocumentNonBlocking(slotRef, { pinnedEntityId: entityId }, { merge: true });
            toast({ title: "Ad Slot Updated", description: "The manual override has been saved." });
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to save ad slot: ' + error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Ad Slot Management</CardTitle>
                    <CardDescription>Manually override automatic ad placements for strategic promotions. Leave the ID blank to revert to automatic selection.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>How It Works</AlertTitle>
                        <AlertDescription>
                            Setting an ID here creates a **manual override**, ignoring all other ranking rules. Clearing the ID returns the slot to **automatic mode**, where it's populated by sellers with the highest-tier active marketing plans.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-6">
                {isLoading ? Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-64" />) 
                : mergedSlots.map(slot => (
                    <AdSlotCard key={slot.id} slot={slot} onSave={handleSave} isSaving={isSaving}/>
                ))}
            </div>
        </div>
    )
}
