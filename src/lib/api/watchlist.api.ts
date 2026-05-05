import axios from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';

export const watchlistApi = {
    getWatchlist: async () => {
        const { data } = await axios.get(API_ENDPOINTS.WATCHLIST.DEFAULT);
        return data;
    },
    addToWatchlist: async (symbol: string) => {
        const { data } = await axios.post(API_ENDPOINTS.WATCHLIST.DEFAULT, { symbol });
        return data;
    },
    removeFromWatchlist: async (symbol: string) => {
        const { data } = await axios.delete(API_ENDPOINTS.WATCHLIST.REMOVE(symbol));
        return data;
    }
};
