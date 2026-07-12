import { initializeApp } from 'firebase/app'; import {getAuth,GoogleAuthProvider} from 'firebase/auth'; import {getFirestore} from 'firebase/firestore';
const app=initializeApp({apiKey:'AIzaSyCBT07zL_-IpUeBsI7WcZeVDhjH7frCPgc',authDomain:'short-video-collection-center.firebaseapp.com',projectId:'short-video-collection-center',storageBucket:'short-video-collection-center.firebasestorage.app',messagingSenderId:'527254233338',appId:'1:527254233338:web:6e0c5892db02b3b620e943'});
export const auth=getAuth(app),googleProvider=new GoogleAuthProvider(),db=getFirestore(app);
