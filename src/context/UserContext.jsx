import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const PLANT_TYPES = {
  'Palm Oil':    { cycleDays: 180, daysToHarvest: 30  },
  'Banana':      { cycleDays: 90,  daysToHarvest: 15  },
  'Dahlia':      { cycleDays: 60,  daysToHarvest: 10  },
  'Succulent':   { cycleDays: 365, daysToHarvest: 60  },
  'Pink Gerbera':{ cycleDays: 75,  daysToHarvest: 12  },
  'Nest Fern':   { cycleDays: 120, daysToHarvest: 20  },
  'Custom':      { cycleDays: 90,  daysToHarvest: 14  },
};

export { PLANT_TYPES };

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // unified state for legacy support (profile + active plant)
  const [loading, setLoading] = useState(true);

  // Initialize Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserData(session.user);
      else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch from explicit tables: profiles and plants
  const fetchUserData = async (authUser) => {
    setLoading(true);
    
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      const { data: plants } = await supabase.from('plants').select('*').eq('user_id', authUser.id).order('created_at', { ascending: true }).limit(1);
      
      let combined = { id: authUser.id, email: authUser.email, onboarded: false };
      
      if (profile) {
        combined = { ...combined, name: profile.full_name, avatarUrl: profile.avatar_url };
      }
      
      if (plants && plants.length > 0) {
        const p = plants[0];
        combined = {
          ...combined,
          plantId: p.id,
          plantName: p.name,
          plantType: p.type,
          customCycleDays: p.cycle_days,
          plantPhotoUrl: p.photo_url,
          plantedAt: p.planted_at,
          onboarded: true
        };
      }
      
      setUser(combined);
    } catch (error) {
      console.error("Error fetching user data from Supabase:", error);
    } finally {
      setLoading(false);
    }
  };

  // Authenticate functions to be used by Onboarding
  const signUp = async (email, password, fullName, avatarUrl) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, avatar_url: avatarUrl }
      }
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // Backward compatible update function (currently mainly used by legacy Onboarding flow to save a plant)
  const updateUser = useCallback(async (partial) => {
    setUser(prev => ({ ...prev, ...partial }));
    
    if (!session?.user?.id) return; // need auth to write DB
    
    const updates = { ...user, ...partial };
    
    // Attempt saving to profiles if there are changes
    if (partial.name || partial.avatarUrl) {
      await supabase.from('profiles').upsert({ 
        id: session.user.id, 
        full_name: updates.name, 
        avatar_url: updates.avatarUrl 
      });
    }

    // Process a newly created plant
    if (partial.plantName && partial.plantType && partial.plantedAt) {
      await supabase.from('plants').insert({
        user_id: session.user.id,
        name: updates.plantName,
        type: updates.plantType,
        cycle_days: updates.plantType === 'Custom' ? (updates.customCycleDays || 90) : (PLANT_TYPES[updates.plantType]?.cycleDays || 90),
        photo_url: updates.plantPhotoUrl,
        planted_at: updates.plantedAt
      });
      // the real-time subscription or a refetch should ideal populate the plantId afterwards, 
      // but we do a quick local refetch
      fetchUserData(session.user);
    }
  }, [user, session]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  /** Computed harvest info derived from plant type & planted date */
  const harvestInfo = (() => {
    if (!user?.plantType || !user?.plantedAt) {
      return { currentDay: 40, totalCycleDays: 50, daysToHarvest: 10 };
    }
    const baseData = PLANT_TYPES[user.plantType] || PLANT_TYPES['Custom'];
    const totalCycleDays = (user.plantType === 'Custom' && user.customCycleDays) 
      ? Number(user.customCycleDays) 
      : baseData.cycleDays;

    const plantedDate = new Date(user.plantedAt);
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const currentDay = Math.max(1, Math.floor((now - plantedDate) / msPerDay));
    const capped = Math.min(currentDay, totalCycleDays);
    const daysLeft = Math.max(0, totalCycleDays - capped);
    return {
      currentDay: capped,
      totalCycleDays: totalCycleDays,
      daysToHarvest: daysLeft,
    };
  })();

  return (
    <UserContext.Provider value={{ user, session, loading, signUp, signIn, updateUser, logout, harvestInfo }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
