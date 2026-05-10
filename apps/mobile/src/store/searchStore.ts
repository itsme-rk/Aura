// ─── Search Store ─────────────────────────────────────────
//
// Universal search state with debounced input and history.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SearchResult,
  SearchDomain,
  SearchHistoryEntry,
  universalSearch,
  UniversalSearchInput,
  getSearchHistory,
  addToHistory,
  clearSearchHistory,
  getRecentSearches,
} from '../features/search/services/search.service';
import { emitEvent } from '../services/events/emitEvent';

interface SearchState {
  query: string;
  results: SearchResult[];
  domain: SearchDomain;
  recentSearches: string[];
  history: SearchHistoryEntry[];
  isSearching: boolean;

  setQuery: (query: string) => void;
  setDomain: (domain: SearchDomain) => void;
  performSearch: (data: UniversalSearchInput) => void;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  clearResults: () => void;
}

export const selectSearchQuery = (s: SearchState) => s.query;
export const selectSearchResults = (s: SearchState) => s.results;
export const selectSearchDomain = (s: SearchState) => s.domain;
export const selectRecentSearches = (s: SearchState) => s.recentSearches;
export const selectIsSearching = (s: SearchState) => s.isSearching;

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: '',
      results: [],
      domain: 'all',
      recentSearches: [],
      history: [],
      isSearching: false,

      setQuery: (query) => set({ query }),

      setDomain: (domain) => {
        set({ domain });
        // Re-search with new domain if query exists
        // (caller must re-call performSearch)
      },

      performSearch: (data) => {
        const { query, domain } = get();
        if (!query.trim()) {
          set({ results: [], isSearching: false });
          return;
        }

        set({ isSearching: true });

        const results = universalSearch(query, data, domain, 30);

        // Save to history (async, non-blocking)
        addToHistory(query, domain, results.length).then(() => {
          getRecentSearches().then((recentSearches) => {
            set({ recentSearches });
          });
        });

        emitEvent('SEARCH_PERFORMED' as any, {
          query,
          domain,
          resultCount: results.length,
        });

        set({ results, isSearching: false });
      },

      loadHistory: async () => {
        const history = await getSearchHistory();
        const recentSearches = await getRecentSearches();
        set({ history, recentSearches });
      },

      clearHistory: async () => {
        await clearSearchHistory();
        set({ history: [], recentSearches: [] });
      },

      clearResults: () => set({ query: '', results: [], isSearching: false }),
    }),
    {
      name: '@aura/search',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recentSearches: state.recentSearches.slice(0, 10),
      }),
    },
  ),
);
