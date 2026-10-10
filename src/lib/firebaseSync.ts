import { doc, setDoc, deleteDoc, onSnapshot, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { useStore } from '../store/index';

const COLLECTIONS = [
  'users',
  'workOrders',
  'inventory',
  'custodies',
  'employees',
  'transactions',
  'attendanceRecords',
  'customRoles',
  'systemPermissions',
  'preventiveTasks',
  'facilities'
] as const;

let isSyncingFromFirebase = false;

const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const result: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = sanitizeForFirestore(obj[key]);
    }
  }
  return result;
};

export function initFirebaseSync() {
  const initializedCollections = new Set<string>();

  // Listen to Firestore
  COLLECTIONS.forEach((colName) => {
    onSnapshot(collection(db, colName), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      
      const isInitial = !initializedCollections.has(colName);
      if (isInitial) {
        initializedCollections.add(colName);
        if (data.length === 0) {
          // If Firebase is empty on first load, push local state to Firebase
          const localData = (useStore.getState() as any)[colName] as any[];
          if (localData && localData.length > 0) {
            localData.forEach(item => {
              setDoc(doc(db, colName, String(item.id)), sanitizeForFirestore(item)).catch(console.error);
            });
          }
          return; // Skip setting local state to empty
        }
      }

      isSyncingFromFirebase = true;
      useStore.setState({ [colName]: data });
      // Reset after a short tick
      setTimeout(() => {
        isSyncingFromFirebase = false;
      }, 50);
    });
  });

  // Listen to Zustand
  useStore.subscribe((state, prevState) => {
    if (isSyncingFromFirebase) return;

    COLLECTIONS.forEach((colName) => {
      const currentList = state[colName] as any[];
      const prevList = (prevState as any)[colName] as any[];

      if (currentList !== prevList) {
        // Find added or updated
        currentList.forEach(item => {
          const prevItem = prevList.find(p => p.id === item.id);
          if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
            setDoc(doc(db, colName, String(item.id)), sanitizeForFirestore(item)).catch(console.error);
          }
        });

        // Find deleted
        prevList.forEach(prevItem => {
          if (!currentList.find(i => i.id === prevItem.id)) {
            deleteDoc(doc(db, colName, String(prevItem.id))).catch(console.error);
          }
        });
      }
    });
  });
}
