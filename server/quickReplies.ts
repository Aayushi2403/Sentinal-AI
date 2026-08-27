import { QuickReply } from '../src/types';
import crypto from 'crypto';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch, query, limit } from 'firebase/firestore';

const qrCol = collection(db, 'quickReplies');

let qrSeeded = false;
async function seedQuickReplies() {
  if (qrSeeded) return;
  const snap = await getDocs(query(qrCol, limit(1)));
  if (snap.empty) {
    const batch = writeBatch(db);
    const quickReplies: QuickReply[] = [
      {
        id: 'qr-1',
        title: 'Greeting & Acknowledgment',
        content: 'Hi there,\n\nThank you for reaching out to us. I am looking into your request and will get back to you shortly.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'qr-2',
        title: 'Request More Information',
        content: 'Hello,\n\nCould you please provide some additional details regarding this issue? Specifically, any error messages or steps to reproduce would be very helpful.\n\nBest regards,',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'qr-3',
        title: 'Resolution & Closure',
        content: 'Hi,\n\nI wanted to let you know that we have resolved this issue. Please verify on your end and let us know if you need any further assistance.\n\nThank you,',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    for (const qr of quickReplies) {
      batch.set(doc(qrCol, qr.id), qr);
    }
    await batch.commit();
  }
  qrSeeded = true;
}

export async function getQuickReplies(): Promise<QuickReply[]> {
  await seedQuickReplies();
  const snap = await getDocs(qrCol);
  return snap.docs.map(doc => doc.data() as QuickReply).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createQuickReply(data: Omit<QuickReply, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuickReply> {
  await seedQuickReplies();
  const id = `qr-${crypto.randomUUID().slice(0,8)}`;
  const qr: QuickReply = {
    id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(qrCol, id), qr);
  return qr;
}

export async function updateQuickReply(id: string, data: Partial<QuickReply>): Promise<QuickReply | null> {
  await seedQuickReplies();
  const docRef = doc(qrCol, id);
  const d = await getDoc(docRef);
  if (!d.exists()) return null;
  const current = d.data() as QuickReply;
  const updated = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(docRef, updated);
  return updated;
}

export async function deleteQuickReply(id: string): Promise<boolean> {
  await seedQuickReplies();
  const docRef = doc(qrCol, id);
  const d = await getDoc(docRef);
  if (!d.exists()) return false;
  await deleteDoc(docRef);
  return true;
}
