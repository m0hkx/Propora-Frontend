import type { Conversation } from '../types';

// Inbox/chat has no backend resource yet, so the store seeds it from here and mutates it locally.
export const conversations: Conversation[] = [
  {
    id: 'c1',
    name: 'Amelia Hart',
    context: 'Ocean View · A-204',
    unread: 2,
    messages: [
      { id: 'c1m1', from: 'them', text: 'Hi! The kitchen faucet is still dripping after the visit. Could someone come back?', time: '10:12 AM' },
      { id: 'c1m2', from: 'me', text: 'Hi Amelia, sorry about that — I have flagged it as high priority with our plumber.', time: '10:20 AM' },
      { id: 'c1m3', from: 'them', text: 'Thank you! I am home after 4pm tomorrow if that helps.', time: '10:24 AM' },
    ],
  },
  {
    id: 'c2',
    name: 'K. Osei',
    context: 'Technician · HVAC',
    unread: 1,
    messages: [
      { id: 'c2m1', from: 'them', text: 'C-305 compressor looks fine — likely just low refrigerant. Topping up today.', time: '9:02 AM' },
    ],
  },
  {
    id: 'c3',
    name: 'Sofia Lind',
    context: 'Harbor Point · E-401',
    unread: 0,
    messages: [
      { id: 'c3m1', from: 'them', text: 'Thanks for the quick dishwasher fix!', time: 'Mon' },
      { id: 'c3m2', from: 'me', text: 'You are welcome, Sofia!', time: 'Mon' },
    ],
  },
];
