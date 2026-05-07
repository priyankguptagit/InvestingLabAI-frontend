import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  PriceUpdate,
  PortfolioUpdate,
  TradeExecutedEvent,
  AIAlertEvent,
  MarketStatusEvent,
} from '@/lib/types/trading.types';

import { BACKEND_URL as SOCKET_URL } from '@/lib/constants';

interface UseTradingWebSocketOptions {
  autoConnect?: boolean;
  onPriceUpdate?: (data: PriceUpdate) => void;
  onPortfolioUpdate?: (data: PortfolioUpdate) => void;
  onTradeExecuted?: (data: TradeExecutedEvent) => void;
  onAIAlert?: (data: AIAlertEvent) => void;
  onMarketStatus?: (data: MarketStatusEvent) => void;
}

export const useTradingWebSocket = (options: UseTradingWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    onPriceUpdate,
    onPortfolioUpdate,
    onTradeExecuted,
    onAIAlert,
    onMarketStatus,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in (using non-sensitive metadata only)
  const isAuthenticated = useCallback(() => {
    return !!(
      localStorage.getItem('praedico_auth_session_type') ||
      localStorage.getItem('user') ||
      localStorage.getItem('organization') ||
      localStorage.getItem('coordinator')
    );
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!isAuthenticated()) {
      setError('Not authenticated');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to trading WebSocket...');

    const socket = io(SOCKET_URL, {
      // Use withCredentials so the browser sends the HttpOnly accessToken cookie.
      // The backend's socket auth guard reads req.cookies.accessToken from the
      // handshake — no token in localStorage required.
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔴 WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ WebSocket connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    // Trading events
    socket.on('price:update', (data: PriceUpdate) => {
      onPriceUpdate?.(data);
    });

    socket.on('portfolio:update', (data: PortfolioUpdate) => {
      onPortfolioUpdate?.(data);
    });

    socket.on('trade:executed', (data: TradeExecutedEvent) => {
      onTradeExecuted?.(data);
    });

    socket.on('ai:alert', (data: AIAlertEvent) => {
      onAIAlert?.(data);
    });

    socket.on('market:status', (data: MarketStatusEvent) => {
      onMarketStatus?.(data);
    });

    // Ping-pong for connection health
    socket.on('pong', () => {
      console.log('🏓 Pong received');
    });

    socketRef.current = socket;
  }, [isAuthenticated, onPriceUpdate, onPortfolioUpdate, onTradeExecuted, onAIAlert, onMarketStatus]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔴 Disconnecting WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Subscribe to stock price updates
  const subscribeToStock = useCallback((symbol: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:stock', symbol);
      console.log(`📈 Subscribed to ${symbol}`);
    }
  }, []);

  // Unsubscribe from stock price updates
  const unsubscribeFromStock = useCallback((symbol: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:stock', symbol);
      console.log(`📉 Unsubscribed from ${symbol}`);
    }
  }, []);

  // Subscribe to multiple stocks at once
  const subscribeToStocks = useCallback((symbols: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:stocks', symbols);
      console.log(`📊 Subscribed to ${symbols.length} stocks`);
    }
  }, []);

  // Subscribe to portfolio updates
  const subscribeToPortfolio = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:portfolio');
      console.log('💼 Subscribed to portfolio updates');
    }
  }, []);

  // Send ping to check connection
  const ping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]); // Don't include connect/disconnect to avoid loops

  return {
    isConnected,
    error,
    connect,
    disconnect,
    subscribeToStock,
    unsubscribeFromStock,
    subscribeToStocks,
    subscribeToPortfolio,
    ping,
  };
};
