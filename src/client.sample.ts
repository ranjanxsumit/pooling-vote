// Optional: Sample Socket.IO client usage
// Run `npm run dev` first, then execute this script with `tsx src/client.sample.ts` if desired.
import { io } from 'socket.io-client';

const pollId = 'REPLACE_WITH_POLL_ID';
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('connected');
  socket.emit('poll:join', pollId);
});

socket.on('poll:results', (payload) => {
  console.log('results', payload);
});
