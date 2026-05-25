import { useEffect, useRef } from 'react';
import io from '../lib/socket';

export default function useSocket() {
  const socketRef = useRef(io());
  return socketRef.current;
}
