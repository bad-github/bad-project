import {supabaseApi} from '@/supabase';
import {useEffect, useState} from 'react';

export default function User() {
  const [profiles, setProfiles] = useState<Record<string, any>[]>([]);
  const [page, _setPage] = useState({pageNum: 1, pageSize: 10, total: 0});

  useEffect(() => {
    const fetchProfiles = async () => {
      const {data, error} = await supabaseApi.profiles.getPage({page: page.pageNum, pageSize: page.pageSize});
      if (error) {
        console.error('查询失败:', error.message);
        return;
      }
      setProfiles(data || []);
    };
    fetchProfiles();
  }, [page.pageNum, page.pageSize]);

  console.log(profiles, 'profiles');

  return <div>User[{profiles.length}]</div>;
}
