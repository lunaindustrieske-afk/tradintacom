
import { customInitApp } from '@/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
customInitApp();

const db = getFirestore();

export const getDb = () => db;
