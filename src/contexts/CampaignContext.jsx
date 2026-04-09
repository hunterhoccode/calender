import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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
    // ===== Data Loading =====
    case 'SET_INITIAL_DATA':
      return {
        ...state,
        campaigns: action.payload.campaigns,
        brands: action.payload.brands,
        dataLoaded: true,
      };
    case 'SET_CAMPAIGNS':
      return { ...state, campaigns: action.payload };
    case 'SET_BRANDS':
      return { ...state, brands: action.payload };

    // ===== Realtime upsert/remove =====
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
    case 'REMOVE_CAMPAIGN': {
      return {
        ...state,
        campaigns: state.campaigns.filter((c) => c.id !== action.payload),
        drawerOpen: state.selectedCampaign?.id === action.payload ? false : state.drawerOpen,
        selectedCampaign: state.selectedCampaign?.id === action.payload ? null : state.selectedCampaign,
        detailOpen: state.viewingCampaign?.id === action.payload ? false : state.detailOpen,
        viewingCampaign: state.viewingCampaign?.id === action.payload ? null : state.viewingCampaign,
      };
    }
    case 'UPSERT_BRAND': {
      const exists = state.brands.find((b) => b.id === action.payload.id);
      const brands = exists
        ? state.brands.map((b) => b.id === action.payload.id ? action.payload : b)
        : [...state.brands, action.payload];
      return { ...state, brands };
    }
    case 'REMOVE_BRAND': {
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

    // ===== UI Actions (unchanged) =====
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

    // ===== Filter Actions =====
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

// Permission map
const ACTION_PERMISSION_MAP = {
  ADD_CAMPAIGN: 'canCreate',
  UPDATE_CAMPAIGN: 'canEdit',
  DELETE_CAMPAIGN: 'canDelete',
  DUPLICATE_CAMPAIGN: 'canCreate',
  DRAG_UPDATE: 'canEdit',
  TOGGLE_MILESTONE: 'canEdit',
  ADD_BRAND: 'canManageBrands',
  UPDATE_BRAND: 'canManageBrands',
  DELETE_BRAND: 'canManageBrands',
};

// Fetch a single campaign with milestones
async function fetchCampaignWithMilestones(campaignId) {
  const { data } = await supabase
    .from('campaigns')
    .select('*, milestones(*)')
    .eq('id', campaignId)
    .single();
  return data ? mapCampaignFromDb(data) : null;
}

export function CampaignProvider({ children }) {
  const [state, rawDispatch] = useReducer(campaignReducer, initialState);
  const { currentUser, hasPermission } = useAuth();
  const { addLog } = useChangeLog();

  // ===== Load initial data =====
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      const [campaignsRes, brandsRes] = await Promise.all([
        supabase.from('campaigns').select('*, milestones(*)').order('start_date'),
        supabase.from('brands').select('*').order('created_at'),
      ]);

      rawDispatch({
        type: 'SET_INITIAL_DATA',
        payload: {
          campaigns: (campaignsRes.data || []).map(mapCampaignFromDb),
          brands: (brandsRes.data || []).map((b) => ({
            id: b.id, name: b.name, logo: b.logo, color: b.color,
            description: b.description, createdAt: b.created_at,
          })),
        },
      });
    }
    loadData();
  }, [currentUser]);

  // ===== Real-time subscriptions =====
  useEffect(() => {
    if (!currentUser) return;

    const campaignChannel = supabase
      .channel('campaigns-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, async (payload) => {
        if (payload.eventType === 'DELETE') {
          rawDispatch({ type: 'REMOVE_CAMPAIGN', payload: payload.old.id });
        } else {
          const campaign = await fetchCampaignWithMilestones(payload.new.id);
          if (campaign) rawDispatch({ type: 'UPSERT_CAMPAIGN', payload: campaign });
        }
      })
      .subscribe();

    const brandsChannel = supabase
      .channel('brands-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          rawDispatch({ type: 'REMOVE_BRAND', payload: payload.old.id });
        } else {
          const b = payload.new;
          rawDispatch({
            type: 'UPSERT_BRAND',
            payload: { id: b.id, name: b.name, logo: b.logo, color: b.color, description: b.description, createdAt: b.created_at },
          });
        }
      })
      .subscribe();

    const milestonesChannel = supabase
      .channel('milestones-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, async (payload) => {
        const campaignId = payload.new?.campaign_id || payload.old?.campaign_id;
        if (campaignId) {
          const campaign = await fetchCampaignWithMilestones(campaignId);
          if (campaign) rawDispatch({ type: 'UPSERT_CAMPAIGN', payload: campaign });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(campaignChannel);
      supabase.removeChannel(brandsChannel);
      supabase.removeChannel(milestonesChannel);
    };
  }, [currentUser]);

  // ===== Supabase CRUD operations =====
  const supabaseCrud = useCallback(async (action) => {
    switch (action.type) {
      case 'ADD_CAMPAIGN': {
        const { milestones = [], ...rest } = action.payload;
        const dbCampaign = {
          name: rest.name,
          category: rest.category,
          brand_id: rest.brandId || state.activeBrandId || (state.brands[0]?.id ?? null),
          start_date: rest.startDate,
          end_date: rest.endDate,
          key_message: rest.keyMessage || '',
          budget: rest.budget || '',
          channels: rest.channels || [],
          target_audience: rest.targetAudience || '',
          notes: rest.notes || '',
          details: rest.details || '',
          media: rest.media || [],
        };
        const { data, error } = await supabase.from('campaigns').insert(dbCampaign).select().single();
        if (error) { console.error('Add campaign error:', error); return; }

        // Insert milestones
        if (milestones.length > 0) {
          const dbMilestones = milestones.map((m, idx) => ({
            campaign_id: data.id,
            text: m.text,
            date: m.date,
            completed: m.completed || false,
            sort_order: idx,
          }));
          await supabase.from('milestones').insert(dbMilestones);
        }

        // Optimistic: fetch and add immediately
        const created = await fetchCampaignWithMilestones(data.id);
        if (created) rawDispatch({ type: 'UPSERT_CAMPAIGN', payload: created });
        rawDispatch({ type: 'CLOSE_DRAWER' });
        return;
      }
      case 'UPDATE_CAMPAIGN': {
        const { milestones = [], id, createdAt, updatedAt, ...rest } = action.payload;
        const dbCampaign = {
          name: rest.name,
          category: rest.category,
          brand_id: rest.brandId || null,
          start_date: rest.startDate,
          end_date: rest.endDate,
          key_message: rest.keyMessage || '',
          budget: rest.budget || '',
          channels: rest.channels || [],
          target_audience: rest.targetAudience || '',
          notes: rest.notes || '',
          details: rest.details || '',
          media: rest.media || [],
        };
        await supabase.from('campaigns').update(dbCampaign).eq('id', id);

        // Sync milestones: delete old, insert new
        await supabase.from('milestones').delete().eq('campaign_id', id);
        if (milestones.length > 0) {
          const dbMilestones = milestones.map((m, idx) => ({
            campaign_id: id,
            text: m.text,
            date: m.date,
            completed: m.completed || false,
            sort_order: idx,
          }));
          await supabase.from('milestones').insert(dbMilestones);
        }

        // Fetch updated campaign
        const updated = await fetchCampaignWithMilestones(id);
        if (updated) rawDispatch({ type: 'UPSERT_CAMPAIGN', payload: updated });
        rawDispatch({ type: 'CLOSE_DRAWER' });
        return;
      }
      case 'DELETE_CAMPAIGN': {
        rawDispatch({ type: 'REMOVE_CAMPAIGN', payload: action.payload });
        await supabase.from('campaigns').delete().eq('id', action.payload);
        rawDispatch({ type: 'CLOSE_DRAWER' });
        rawDispatch({ type: 'CLOSE_DETAIL' });
        return;
      }
      case 'DUPLICATE_CAMPAIGN': {
        const src = action.payload;
        const dbCampaign = {
          name: src.name + ' (Copy)',
          category: src.category,
          brand_id: src.brandId || null,
          start_date: src.startDate,
          end_date: src.endDate,
          key_message: src.keyMessage || '',
          budget: src.budget || '',
          channels: src.channels || [],
          target_audience: src.targetAudience || '',
          notes: src.notes || '',
          details: src.details || '',
          media: src.media || [],
        };
        const { data, error } = await supabase.from('campaigns').insert(dbCampaign).select().single();
        if (error) { console.error('Duplicate campaign error:', error); return; }

        // Copy milestones
        const srcMilestones = src.milestones || [];
        if (srcMilestones.length > 0) {
          const dbMilestones = srcMilestones.map((m, idx) => ({
            campaign_id: data.id,
            text: m.text,
            date: m.date,
            completed: false,
            sort_order: idx,
          }));
          await supabase.from('milestones').insert(dbMilestones);
        }

        const created = await fetchCampaignWithMilestones(data.id);
        if (created) rawDispatch({ type: 'UPSERT_CAMPAIGN', payload: created });
        // Open drawer to edit the copy
        rawDispatch({ type: 'CLOSE_DETAIL' });
        rawDispatch({ type: 'OPEN_DRAWER', payload: created });
        return;
      }
      case 'DRAG_UPDATE': {
        const { id, startDate, endDate } = action.payload;
        // Optimistic update
        rawDispatch({
          type: 'UPSERT_CAMPAIGN',
          payload: { ...state.campaigns.find((c) => c.id === id), startDate, endDate },
        });
        await supabase.from('campaigns').update({
          start_date: startDate,
          end_date: endDate,
        }).eq('id', id);
        return;
      }
      case 'TOGGLE_MILESTONE': {
        const { campaignId, milestoneId } = action.payload;
        const campaign = state.campaigns.find((c) => c.id === campaignId);
        const milestone = campaign?.milestones?.find((m) => m.id === milestoneId);
        if (milestone) {
          await supabase.from('milestones').update({ completed: !milestone.completed }).eq('id', milestoneId);
        }
        return;
      }
      case 'ADD_BRAND': {
        const { data, error } = await supabase.from('brands').insert({
          name: action.payload.name,
          logo: action.payload.logo,
          color: action.payload.color,
          description: action.payload.description || '',
        }).select().single();
        if (error) { console.error('Add brand error:', error); return; }
        rawDispatch({ type: 'UPSERT_BRAND', payload: { id: data.id, name: data.name, logo: data.logo, color: data.color, description: data.description, createdAt: data.created_at } });
        rawDispatch({ type: 'CLOSE_BRAND_DRAWER' });
        return;
      }
      case 'UPDATE_BRAND': {
        const { error } = await supabase.from('brands').update({
          name: action.payload.name,
          logo: action.payload.logo,
          color: action.payload.color,
          description: action.payload.description || '',
        }).eq('id', action.payload.id);
        if (error) { console.error('Update brand error:', error); return; }
        rawDispatch({ type: 'UPSERT_BRAND', payload: action.payload });
        rawDispatch({ type: 'CLOSE_BRAND_DRAWER' });
        return;
      }
      case 'DELETE_BRAND': {
        rawDispatch({ type: 'REMOVE_BRAND', payload: action.payload });
        await supabase.from('brands').delete().eq('id', action.payload);
        rawDispatch({ type: 'CLOSE_BRAND_DRAWER' });
        return;
      }
      default:
        return false; // Not a CRUD action
    }
  }, [state.campaigns, state.brands, state.activeBrandId]);

  // Guarded dispatch
  const dispatch = useCallback(async (action) => {
    const permKey = ACTION_PERMISSION_MAP[action.type];

    if (permKey) {
      if (!hasPermission(permKey)) return;

      // Log the action
      let targetName = '';
      if (action.type === 'DELETE_CAMPAIGN') {
        targetName = state.campaigns.find((c) => c.id === action.payload)?.name || '';
      } else if (action.type === 'DELETE_BRAND') {
        targetName = state.brands.find((b) => b.id === action.payload)?.name || '';
      } else if (action.type === 'DRAG_UPDATE') {
        targetName = state.campaigns.find((c) => c.id === action.payload.id)?.name || '';
      } else if (action.type === 'TOGGLE_MILESTONE') {
        targetName = state.campaigns.find((c) => c.id === action.payload.campaignId)?.name || '';
      } else if (action.payload?.name) {
        targetName = action.payload.name;
      }

      addLog(currentUser, action.type, targetName);
      try {
        await supabaseCrud(action);
      } catch (err) {
        console.error('Supabase CRUD error:', err);
      }
      return;
    }

    // UI-only actions go directly to reducer
    rawDispatch(action);
  }, [currentUser, hasPermission, addLog, supabaseCrud, state.campaigns, state.brands]);

  // Get filtered campaigns
  const getFilteredCampaigns = () => {
    let filtered = [...state.campaigns];

    if (state.activeBrandId) {
      filtered = filtered.filter((c) => c.brandId === state.activeBrandId);
    }
    if (state.filters.categories.length > 0) {
      filtered = filtered.filter((c) => state.filters.categories.includes(c.category));
    }
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
