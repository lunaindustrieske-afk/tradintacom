
'use client';

import * as React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { kenyanCounties } from '@/lib/countries';
import { Slider } from '../ui/slider';

type FilterState = {
    category: string;
    verifiedOnly: boolean;
    minPrice: string;
    maxPrice: string;
    county: string;
    moq: string;
    moqRange: string;
    rating: string;
};

interface FilterSidebarProps {
    filters: FilterState;
    onFilterChange: (name: keyof FilterState, value: any) => void;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    activeTab: 'for-you' | 'following' | 'direct';
}

export function FilterSidebar({
    filters,
    onFilterChange,
    onApplyFilters,
    onResetFilters,
    activeTab,
}: FilterSidebarProps) {
    const isB2B = activeTab !== 'direct';

    return (
        <Card className="sticky top-24">
            <CardHeader>
                <h3 className="text-lg font-bold">Filters</h3>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                    <Checkbox id="verified-seller" checked={filters.verifiedOnly} onCheckedChange={(checked) => onFilterChange('verifiedOnly', !!checked)}/>
                    <Label htmlFor="verified-seller" className="font-semibold text-green-600 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> Verified Sellers Only
                    </Label>
                </div>
                <Separator />
                <div>
                    <Label className="font-semibold">Price Range (KES)</Label>
                    <div className="flex gap-2 mt-1">
                        <Input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => onFilterChange('minPrice', e.target.value)} />
                        <Input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => onFilterChange('maxPrice', e.target.value)} />
                    </div>
                </div>
                {isB2B ? (
                    <div>
                        <Label className="font-semibold">Minimum Order Qty (MOQ)</Label>
                        <div className="flex gap-2 mt-1">
                            <Input type="number" placeholder="e.g. 100" value={filters.moq} onChange={e => onFilterChange('moq', e.target.value)} />
                            <div className='flex items-center gap-1'>
                                <span className="text-sm text-muted-foreground">+/-</span>
                                <Input type="number" placeholder="5" className="w-16" value={filters.moqRange} onChange={(e) => onFilterChange('moqRange', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                         <Label className="font-semibold">Rating</Label>
                         <Select value={filters.rating} onValueChange={(value) => onFilterChange('rating', value)}>
                            <SelectTrigger><SelectValue placeholder="Any Rating" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any Rating</SelectItem>
                                <SelectItem value="4">4 stars & up</SelectItem>
                                <SelectItem value="3">3 stars & up</SelectItem>
                                <SelectItem value="2">2 stars & up</SelectItem>
                                <SelectItem value="1">1 star & up</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div>
                    <Label className="font-semibold">County</Label>
                    <div className="space-y-2 mt-1">
                        <Select value={filters.county} onValueChange={(value) => onFilterChange('county', value)}>
                            <SelectTrigger><SelectValue placeholder="Select County" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Counties</SelectItem>
                                {kenyanCounties.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
            <CardFooter className='flex flex-col gap-2'>
                <Button className="w-full" onClick={onApplyFilters}>Apply Filters</Button>
                <Button variant="outline" className="w-full" onClick={onResetFilters}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset Filters
                </Button>
            </CardFooter>
        </Card>
    );
}
