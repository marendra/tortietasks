import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
	apiKey: 'AIzaSyD0o-tP7QcU4STvVNC66pUrBQO6RlruHo4',
	authDomain: 'tortietask.firebaseapp.com',
	projectId: 'tortietask',
	storageBucket: 'tortietask.firebasestorage.app',
	messagingSenderId: '409123601533',
	appId: '1:409123601533:web:2c6db32f830cb70606c514',
	measurementId: 'G-WJ67CLRQ1T'
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');
