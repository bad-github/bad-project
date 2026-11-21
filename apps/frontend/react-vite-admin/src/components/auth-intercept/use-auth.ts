import {useCallback, useEffect, useState} from 'react';
import {useShallow} from 'zustand/shallow';
import useUserStore from '@/store/user';
import type {Session} from '@workspace/supabase';
import {supabaseApi} from '@/supabase';

export default function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const {setUser} = useUserStore(
    useShallow((state) => ({
      setUser: state.setUser,
    }))
  );
  const [loading, setLoading] = useState(true); // 避免闪烁
  const saveGlobal = useCallback(
    (session: Session | null) => {
      // 也可以通过此方法获取用户信息：await supabaseApi.auth.getUser();
      setSession(session);
      if (session?.user) {
        setUser(session?.user);
      }
    },
    [setUser]
  );

  useEffect(() => {
    supabaseApi.auth.getSession().then(({data: {session}}) => {
      saveGlobal(session);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    });
    const {data: listener} = supabaseApi.auth.onAuthStateChange((_event, session) => {
      console.log('supabase onAuthStateChange', _event);
      saveGlobal(session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [saveGlobal]);

  return {session, loading};
}
