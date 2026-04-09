import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mapCampaignFromDb } from '../lib/dbMappers';
import { useAuth } from './AuthContext';
import { useChangeLog } from './ChangeLogContext';

const CampaignContext = createContext(null);

const initialState = {
  campaigns: [],
  brands: [],
  activeBrandId: null,
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
  dataLoaded: false,
};

function campaignReducer(state, action) {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return { ...state, campaigns: action.payload.campaigns, brands: action.payload.brands, dataLoaded: true };
    case 'SET_CAMPAIGNS':
      return { ...state, campaigns: action.payload };
    case 'SET_BRANDS':
      return { ...state, brands: action.payload };
    case 'UPSERT_CAMPAIGN': {
      const exists = state.campaigns.find((c) => c.id === action.payload.id);
      const campaigns = exists
        ? state.campaigns.map((c) => c.id === action.payload.id ? action.payload : c)
        : [...state.campaigns, action.payload];
      const viewingCampaign = state.viewingCampaign?.id === action.payload.id
        ? action.payload
        : state.viewingCampaign;
      return { ...state, campaigns, viewingCampaign };
    }
    case 'REMOVE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.filter((c) => c.id !== action.payload),
        drawerOpen: state.selectedCampaign?.id === action.payload ? false : state.drawerOpen,
        selectedCampaign: state.selectedCampaign?.id === action.payload ? null : state.selectedCampaign,
        detailOpen: state.viewingCampaign?.id === action.payload ? false : state.detailOpen,
        viewingCampaign: state.viewingCampaign?.id === action.payload ? null : state.viewingCampaign,
      };
    case 'UPSERT_BRAND': {
      const exists = state.brands.find((b) => b.id === action.payload.id);
      const brands = exists
        ? state.brands.map((b) => b.id === action.payload.id ? action.payload : b)
        : [...state.brands, action.payload];
      return { ...state, brands };
    }
    case 'REMOVE_BRAND':
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
    case 'OPEN_DRAWER':
      return {
        ...state,
        drawerOpen: true,
        selectedCampaign: action.payload || null,
        isNewCampaign: !action.payload,
        detailOpen: false,
        viewingCampaign: null,
      };
    case 'CLOSE_DRAWER':
      return { ...state, drawerOpen: false, selectedCampaign: null, isNewCampaign: false };
    case 'VIEW_CAMPAIGN':
      return { ...state, detailOpen: true, viewingCampaign: action.payload, drawerOpen: false, selectedCampaign: null };
    case 'CLOSE_DETAIL':
      return { ...state, detailOpen: false, viewingCampaign: null };
    case 'SET_ACTIVE_BRAND':
      return { ...state, activeBrandId: state.activeBrandId === action.payload ? null : action.payload };
    case 'OPEN_BRAND_DRAWER':
      return { ...state, brandDrawerOpen: true, editingBrand: action.payload || null };
    case 'CLOSE_BRAND_DRAWER':
      return { ...state, brandDrawerOpen: false, editingBrand: null };
    case 'SET_FILTER_CATEGORY': {
      const cats = state.filters.categories.includes(action.payload)
        ? state.filters.categories.filter((c) => c !== action.payload)
        : [...state.filters.categories, action.payload];
      return { ...state, filters: { ...state.filters, categories: cats } };
    }
    case 'SET_FILTER_STATUS':
      return { ...state, filters: { ...state.filters, status: state.filters.status === action.payload ? null : action.payload } };
    case 'SET_FILTER_SEARCH':
      return { ...state, filters: { ...state.filters, search: action.payload } };
    case 'CLEAR_FILTERS':
      return { ...state, filters: { categories: [], status: null, search: '' } };
    default:
      return state;
  }
}

const ACTION_PERMISSION_MAP = {
  ADD_CAMPAIGN:       'canCreate',
  UPDATE_CAMPAIGN:    'canEdit',
  DELETE_CAMPAIGN:    'canDelete',
  DUPLICATE_CAMPAIGN: 'canCreate',
  DRAG_UPDATE:        'canEdit',
  TOGGLE_MILESTONE:   'canEdit',
  ADD_BRAND:          'canManageBrands',
  UPDATE_BRAND:       'canManageBrands',
  DELETE_BRAND:       'canManageBrands',
};

export function CampaignProvider({ children }) {
  const [state, rawDispatch] = useReducer(campaignReducer, initialState);
  const { currentUser, hasPermission } = useAuth();
  const { addLog } = useChangeLog();

  // Subscribe realtime to campaigns + brands
  useEffect(() => {
    if (!currentUser) return;

    const unsubCampaigns = onSnapshot(
      query(collection(db, 'campaigns'), orderBy('startDate')),
      (snap) => {
        const campaigns = snap.docs.map((d) => mapCampaignFromDb(d.data(), d.id));
        rawDispatch({ type: 'SET_CAMPAIGNS', payload: campaigns });
        rawDispatch({ type: 'SET_INITIAL_DATA', payload: { campaigns, brands: [] } });
      }
    );

    const unsubBrands = onSnapshot(
      query(collection(db, 'brands'), orderBy('createdAt')),
      (snap) => {
        const brands = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        rawDispatch({ type: 'SET_BRANDS', payload: brands });
      }
    );

    return () => {
      unsubCampaigns();
      unsubBrands();
    };
  }, [currentUser]);

  const firestoreCrud = useCallback(async (action) => {
    switch (action.type) {
      case 'ADD_CAMPAIGN': {
        const { milestones = [], ...rest } = action.payload;
        await addDoc(collection(db, 'campaigns'), {
          name:           rest.name,
          category:       rest.category,
          brandId:        rest.brandId || state.activeBrandId || (state.brands[0]?.id ?? null),
          startDate:      rest.startDate,
          endDate:        rest.endDate,
          keyMessage:     rest.keyMessage     || '',
          budget:         rest.budget         || '',
          channels:       rest.channels       || [],
          targetAudience: rest.targetAudience || '',
          notes:          rest.notes          || '',
          details:        rest.details        || '',
          media:          rest.media          || [],
          milestones:     milestones.map(({ id: _id, ...m }) => m),
          createdAt:      serverTimestamp(),
          updatedAt:      serverTimestamp(),
        });
        rawDispatch({ type: 'CLOSE_DRAWER' });
        return;
      }

      case 'UPDATE_CAMPAIGN': {
        const { id, createdAt, ...rest } = action.payload;
        const { milestones = [] } = rest;
        await updateDoc(doc(db, 'campaigns', id), {
          name:           rest.name,
          category:       rest.category,
          brandId:        rest.brandId || null,
          startDate:      rest.startDate,
          endDate:        rest.endDate,
          keyMessage:     rest.keyMessage     || '',
          budget:         rest.budget         || '',
          channels:       rest.channels       || [],
          targetAudience: rest.targetAudience || '',
          notes:          rest.notes          || '',
          details:        rest.details        || '',
          media:          rest.media          || [],
          milestones:     milestones.map(({ id: _id, ...m }) => m),
          updatedAt:      serverTimestamp(),
        });
        rawDispatch({ type: 'CLOSE_DRAWER' });
        return;
      }

      case 'DELETE_CAMPAIGN': {
        rawDispatch({ type: 'REMOVE_CAMPAIGN', payload: action.payload });
        await deleteDoc(doc(db, 'campaigns', action.payload));
        rawDispatch({ type: 'CLOSE_DRAWER' });
        rawDispatch({ type: 'CLOSE_DETAIL' });
        return;
      }

      case 'DUPLICATE_CAMPAIGN': {
        const src = action.payload;
        const ref = await addDoc(collection(db, 'campaigns'), {
          name:           src.name + ' (Copy)',
          category:       src.category,
          brandId:        src.brandId || null,
          startDate:      src.startDate,
          endDate:        src.endDate,
          keyMessage:     src.keyMessage     || '',
          budget:         src.budget         || '',
          channels:       src.channels       || [],
          targetAudience: src.targetAudience || '',
          notes:          src.notes          || '',
          details:        src.details        || '',
          media:          src.media          || [],
          milestones:     (src.milestones || []).map(({ id: _id, ...m }) => ({ ...m, completed: false })),
          createdAt:      serverTimestamp(),
          updatedAt:      serverTimestamp(),
        });
        const snap = await getDoc(ref);
        const created = mapCampaignFromDb(snap.data(), snap.id);
        rawDispatch({ type: 'CLOSE_DETAIL' });
        rawDispatch({ type: 'OPEN_DRAWER', payload: created });
        return;
      }

      case 'DRAG_UPDATE': {
        const { id, startDate, endDate } = action.payload;
        rawDispatch({
          type: 'UPSERT_CAMPAIGN',
          payload: { ...state.campaigns.find((c) => c.id === id), startDate, endDate },
        });
        await updateDoc(doc(db, 'campaigns', id), { startDate, endDate, updatedAt: serverTimestamp() });
        return;
      }

      case 'TOGGLE_MILESTONE': {
        const { campaignId, milestoneId } = action.payload;
        const campaign = state.campaigns.find((c) => c.id === campaignId);
        if (!campaign) return;
        const milestones = (campaign.milestones || []).map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        await updateDoc(doc(db, 'campaigns', campaignId), { milestones, updatedAt: serverTimestamp() });
        return;
      }

      case 'ADD_BRAND': {
        await addDoc(collection(db, 'brands'), {
          name:        action.payload.name,
          logo:        action.payload.logo,
          color:       action.payload.color,
          description: action.payload.description || '',
          createdAt:   serverTimestamp(),
        });
        rawDispatch({ type: 'CLOSE_BRAND_DRAWER' });
        return;
      }

      case 'UPDATE_BRAND': {
        await updateDoc(doc(db, 'brands', action.payload.id), {
          name:        action.payload.name,
          logo:        action.payload.logo,
          color:       action.payload.color,
          description: action.payload.description || '',
        });
        rawDispatch({ type: 'CLOSE_BRAND_DRAWER' });
        return;
      }

      case 'DELETE_BRAND': {
        rawDispatch({ type: 'REMOVE_BRAND', payload: action.payload });
        await deleteDoc(doc(db, 'brands', action.payload));
        rawDispatch({ type: 'CLOSE_BRAND_DRAWER' });
        return;
      }

      default:
        return false;
    }
  }, [state.campaigns, state.brands, state.activeBrandId]);

  const dispatch = useCallback(async (action) => {
    const permKey = ACTION_PERMISSION_MAP[action.type];
    if (permKey) {
      if (!hasPermission(permKey)) return;

      let targetName = '';
      if (action.type === 'DELETE_CAMPAIGN')
        targetName = state.campaigns.find((c) => c.id === action.payload)?.name || '';
      else if (action.type === 'DELETE_BRAND')
        targetName = state.brands.find((b) => b.id === action.payload)?.name || '';
      else if (action.type === 'DRAG_UPDATE')
        targetName = state.campaigns.find((c) => c.id === action.payload.id)?.name || '';
      else if (action.type === 'TOGGLE_MILESTONE')
        targetName = state.campaigns.find((c) => c.id === action.payload.campaignId)?.name || '';
      else if (action.payload?.name)
        targetName = action.payload.name;

      addLog(currentUser, action.type, targetName);
      try {
        await firestoreCrud(action);
      } catch (err) {
        console.error('Firestore CRUD error:', err);
      }
      return;
    }
    rawDispatch(action);
  }, [currentUser, hasPermission, addLog, firestoreCrud, state.campaigns, state.brands]);

  const getFilteredCampaigns = () => {
    let filtered = [...state.campaigns];
    if (state.activeBrandId)
      filtered = filtered.filter((c) => c.brandId === state.activeBrandId);
    if (state.filters.categories.length > 0)
      filtered = filtered.filter((c) => state.filters.categories.includes(c.category));
    if (state.filters.status) {
      const now = new Date();
      filtered = filtered.filter((c) => {
        const start = new Date(c.startDate);
        const end   = new Date(c.endDate);
        if (state.filters.status === 'active')    return now >= start && now <= end;
        if (state.filters.status === 'upcoming')  return now < start;
        if (state.filters.status === 'completed') return now > end;
        return true;
      });
    }
    if (state.filters.search) {
      const q = state.filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(q) || (c.keyMessage && c.keyMessage.toLowerCase().includes(q))
      );
    }
    filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    return filtered;
  };

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
