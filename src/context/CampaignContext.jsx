import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import sampleCampaigns, { sampleBrands } from '../data/sampleData';
import { useAuth } from './AuthContext';
import { useChangeLog } from './ChangeLogContext';

const CampaignContext = createContext(null);

const STORAGE_KEY = 'marketing-calendar-campaigns';
const BRANDS_STORAGE_KEY = 'marketing-calendar-brands';

const loadFromStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
  return null;
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

const initialState = {
  campaigns: loadFromStorage(STORAGE_KEY) || sampleCampaigns,
  brands: loadFromStorage(BRANDS_STORAGE_KEY) || sampleBrands,
  activeBrandId: null, // null = show all brands
  filters: {
    categories: [],
    status: null,
    search: '',
  },
  selectedCampaign: null,
  drawerOpen: false,
  isNewCampaign: false,
  detailOpen: false,
  viewingCampaign: null,
  brandDrawerOpen: false,
  editingBrand: null,
};

function campaignReducer(state, action) {
  switch (action.type) {
    // ===== Campaign Actions =====
    case 'ADD_CAMPAIGN': {
      const newCampaign = {
        ...action.payload,
        id: Date.now().toString(),
        brandId: action.payload.brandId || state.activeBrandId || (state.brands[0]?.id ?? null),
      };
      return {
        ...state,
        campaigns: [...state.campaigns, newCampaign],
        drawerOpen: false,
        selectedCampaign: null,
        isNewCampaign: false,
      };
    }
    case 'UPDATE_CAMPAIGN': {
      return {
        ...state,
        campaigns: state.campaigns.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
        drawerOpen: false,
        selectedCampaign: null,
      };
    }
    case 'DELETE_CAMPAIGN': {
      return {
        ...state,
        campaigns: state.campaigns.filter((c) => c.id !== action.payload),
        drawerOpen: false,
        selectedCampaign: null,
      };
    }
    case 'DRAG_UPDATE': {
      const { id, startDate, endDate } = action.payload;
      return {
        ...state,
        campaigns: state.campaigns.map((c) =>
          c.id === id ? { ...c, startDate, endDate } : c
        ),
      };
    }
    case 'OPEN_DRAWER': {
      return {
        ...state,
        drawerOpen: true,
        selectedCampaign: action.payload || null,
        isNewCampaign: !action.payload,
        detailOpen: false,
        viewingCampaign: null,
      };
    }
    case 'CLOSE_DRAWER': {
      return {
        ...state,
        drawerOpen: false,
        selectedCampaign: null,
        isNewCampaign: false,
      };
    }
    case 'VIEW_CAMPAIGN': {
      return {
        ...state,
        detailOpen: true,
        viewingCampaign: action.payload,
        drawerOpen: false,
        selectedCampaign: null,
      };
    }
    case 'CLOSE_DETAIL': {
      return {
        ...state,
        detailOpen: false,
        viewingCampaign: null,
      };
    }
    case 'TOGGLE_MILESTONE': {
      const { campaignId, milestoneId } = action.payload;
      const updatedCampaigns = state.campaigns.map((c) => {
        if (c.id !== campaignId) return c;
        return {
          ...c,
          milestones: (c.milestones || []).map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          ),
        };
      });
      const updatedViewing = state.viewingCampaign?.id === campaignId
        ? updatedCampaigns.find((c) => c.id === campaignId)
        : state.viewingCampaign;
      return {
        ...state,
        campaigns: updatedCampaigns,
        viewingCampaign: updatedViewing,
      };
    }

    // ===== Brand Actions =====
    case 'ADD_BRAND': {
      const newBrand = {
        ...action.payload,
        id: 'brand-' + Date.now(),
      };
      return {
        ...state,
        brands: [...state.brands, newBrand],
        brandDrawerOpen: false,
        editingBrand: null,
      };
    }
    case 'UPDATE_BRAND': {
      return {
        ...state,
        brands: state.brands.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
        brandDrawerOpen: false,
        editingBrand: null,
      };
    }
    case 'DELETE_BRAND': {
      return {
        ...state,
        brands: state.brands.filter((b) => b.id !== action.payload),
        campaigns: state.campaigns.map((c) =>
          c.brandId === action.payload ? { ...c, brandId: null } : c
        ),
        activeBrandId: state.activeBrandId === action.payload ? null : state.activeBrandId,
        brandDrawerOpen: false,
        editingBrand: null,
      };
    }
    case 'SET_ACTIVE_BRAND': {
      return {
        ...state,
        activeBrandId: state.activeBrandId === action.payload ? null : action.payload,
      };
    }
    case 'OPEN_BRAND_DRAWER': {
      return {
        ...state,
        brandDrawerOpen: true,
        editingBrand: action.payload || null,
      };
    }
    case 'CLOSE_BRAND_DRAWER': {
      return {
        ...state,
        brandDrawerOpen: false,
        editingBrand: null,
      };
    }

    // ===== Filter Actions =====
    case 'SET_FILTER_CATEGORY': {
      const cats = state.filters.categories.includes(action.payload)
        ? state.filters.categories.filter((c) => c !== action.payload)
        : [...state.filters.categories, action.payload];
      return {
        ...state,
        filters: { ...state.filters, categories: cats },
      };
    }
    case 'SET_FILTER_STATUS': {
      return {
        ...state,
        filters: {
          ...state.filters,
          status: state.filters.status === action.payload ? null : action.payload,
        },
      };
    }
    case 'SET_FILTER_SEARCH': {
      return {
        ...state,
        filters: { ...state.filters, search: action.payload },
      };
    }
    case 'CLEAR_FILTERS': {
      return {
        ...state,
        filters: { categories: [], status: null, search: '' },
      };
    }
    default:
      return state;
  }
}

// Map action types to permission keys
const ACTION_PERMISSION_MAP = {
  ADD_CAMPAIGN: 'canCreate',
  UPDATE_CAMPAIGN: 'canEdit',
  DELETE_CAMPAIGN: 'canDelete',
  DRAG_UPDATE: 'canEdit',
  TOGGLE_MILESTONE: 'canEdit',
  ADD_BRAND: 'canManageBrands',
  UPDATE_BRAND: 'canManageBrands',
  DELETE_BRAND: 'canManageBrands',
};

export function CampaignProvider({ children }) {
  const [state, rawDispatch] = useReducer(campaignReducer, initialState);
  const { currentUser, hasPermission } = useAuth();
  const { addLog } = useChangeLog();

  // Guarded dispatch with permission checks and change logging
  const dispatch = useCallback((action) => {
    const permKey = ACTION_PERMISSION_MAP[action.type];

    // If this action requires a permission, check it
    if (permKey) {
      if (!hasPermission(permKey)) {
        return; // Silently block - UI should already hide these actions
      }

      // Extract target name for logging
      let targetName = '';
      if (action.type === 'DELETE_CAMPAIGN') {
        const campaign = state.campaigns.find((c) => c.id === action.payload);
        targetName = campaign?.name || action.payload;
      } else if (action.type === 'DELETE_BRAND') {
        const brand = state.brands.find((b) => b.id === action.payload);
        targetName = brand?.name || action.payload;
      } else if (action.type === 'DRAG_UPDATE') {
        const campaign = state.campaigns.find((c) => c.id === action.payload.id);
        targetName = campaign?.name || action.payload.id;
      } else if (action.type === 'TOGGLE_MILESTONE') {
        const campaign = state.campaigns.find((c) => c.id === action.payload.campaignId);
        targetName = campaign?.name || '';
      } else if (action.payload?.name) {
        targetName = action.payload.name;
      }

      addLog(currentUser, action.type, targetName);
    }

    rawDispatch(action);
  }, [currentUser, hasPermission, addLog, state.campaigns, state.brands]);

  // Persist to localStorage on every change
  useEffect(() => {
    saveToStorage(STORAGE_KEY, state.campaigns);
  }, [state.campaigns]);

  useEffect(() => {
    saveToStorage(BRANDS_STORAGE_KEY, state.brands);
  }, [state.brands]);

  // Get filtered campaigns
  const getFilteredCampaigns = () => {
    let filtered = [...state.campaigns];

    // Filter by active brand
    if (state.activeBrandId) {
      filtered = filtered.filter((c) => c.brandId === state.activeBrandId);
    }

    // Filter by category
    if (state.filters.categories.length > 0) {
      filtered = filtered.filter((c) =>
        state.filters.categories.includes(c.category)
      );
    }

    // Filter by status
    if (state.filters.status) {
      const now = new Date();
      filtered = filtered.filter((c) => {
        const start = new Date(c.startDate);
        const end = new Date(c.endDate);
        if (state.filters.status === 'active') return now >= start && now <= end;
        if (state.filters.status === 'upcoming') return now < start;
        if (state.filters.status === 'completed') return now > end;
        return true;
      });
    }

    // Filter by search
    if (state.filters.search) {
      const q = state.filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.keyMessage && c.keyMessage.toLowerCase().includes(q))
      );
    }

    // Sort by start date (chronological)
    filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    return filtered;
  };

  // Get brand by id
  const getBrandById = (id) => state.brands.find((b) => b.id === id);

  return (
    <CampaignContext.Provider value={{ state, dispatch, getFilteredCampaigns, getBrandById }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaigns() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaigns must be used within CampaignProvider');
  return ctx;
}
