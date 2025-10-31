
"use client"
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, FileText, CheckCircle, Clock } from "lucide-react";

const conversations = [
    {
        id: "CONV-001",
        title: "Quotation for 200 bags of Cement",
        contactName: "Constructa Ltd",
        contactRole: "Seller",
        lastMessage: "Yes, this is our best offer for bulk purchase.",
        lastMessageTimestamp: "2023-10-28",
        status: "Approved",
        statusIcon: <CheckCircle className="text-green-500" />,
        isUnread: false,
        messages: [
            { from: "user", text: "Is this the final price?" },
            { from: "contact", text: "Yes, this is our best offer for bulk purchase." }
        ]
    },
    {
        id: "CONV-002",
        title: "Order: 50 sacks of Baking Flour",
        contactName: "SuperBake Bakery",
        contactRole: "Seller",
        lastMessage: "When can you deliver?",
        lastMessageTimestamp: "2023-10-27",
        status: "Pending Payment",
        statusIcon: <Clock className="text-yellow-500" />,
        isUnread: true,
        messages: [
            { from: "user", text: "When can you deliver?" },
        ]
    },
    {
        id: "CONV-003",
        title: "Inquiry about Steel Beams",
        contactName: "Regional Distributors",
        contactRole: "Distributor",
        lastMessage: "We have a new shipment arriving next week.",
        lastMessageTimestamp: "2023-10-26",
        status: "Inquiry",
        statusIcon: <FileText className="text-blue-500" />,
        isUnread: false,
        messages: [
            { from: "user", text: "Do you have 10-inch steel beams in stock?"},
            { from: "contact", text: "We have a new shipment arriving next week." }
        ]
    }
];


export default function DashboardPage() {
    const [selectedConversation, setSelectedConversation] = React.useState(conversations[0]);

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'Seller': return 'secondary';
            case 'Distributor': return 'outline';
            default: return 'default';
        }
    }

    return (
        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            {/* Left Column: Conversation List */}
            <div className="md:col-span-1 flex flex-col">
                <Card className="flex flex-col h-full">
                    <CardHeader className="border-b">
                        <CardTitle>Tradinta Inbox</CardTitle>
                        <CardDescription>All your conversations in one place.</CardDescription>
                         <Input placeholder="Search conversations..." className="mt-2" />
                    </CardHeader>
                    <ScrollArea className="flex-grow">
                        <CardContent className="p-2 space-y-2">
                            {conversations.map(convo => (
                                <div key={convo.id} className={`p-3 rounded-lg cursor-pointer border ${selectedConversation.id === convo.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'}`} onClick={() => setSelectedConversation(convo)}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-sm truncate pr-2">{convo.contactName}</h3>
                                        {convo.isUnread && <Badge className="w-2 h-2 p-0 rounded-full bg-primary"></Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <Badge variant={getRoleBadgeVariant(convo.contactRole)}>{convo.contactRole}</Badge>
                                        <p className="text-xs text-muted-foreground">{convo.lastMessageTimestamp}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </ScrollArea>
                </Card>
            </div>

            {/* Right Column: Message and Details View */}
            <div className="md:col-span-2 flex flex-col">
                <Card className="flex-grow flex flex-col">
                    <CardHeader className="flex flex-row justify-between items-center border-b">
                        <div>
                            <CardTitle>{selectedConversation.title}</CardTitle>
                            <CardDescription>Conversation with {selectedConversation.contactName}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> View Details</Button>
                    </CardHeader>
                    <ScrollArea className="flex-grow p-6 space-y-4">
                        {selectedConversation.messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.from === 'contact' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`https://picsum.photos/seed/${selectedConversation.contactName}/32/32`} />
                                        <AvatarFallback>{selectedConversation.contactName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`max-w-xs p-3 rounded-lg ${msg.from === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                                 {msg.from === 'user' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="https://picsum.photos/seed/user/32/32" />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                    </ScrollArea>
                    <CardFooter className="border-t p-4">
                        <div className="flex w-full items-center gap-2">
                            <Input placeholder="Type your message..." />
                            <Button size="icon"><Send className="h-4 w-4" /></Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
