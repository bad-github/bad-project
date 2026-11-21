import {ReactTree} from '@/components/react-tree';
import {getMock} from '@/mock';
import {InputPopover} from '@badnpm/ui';
import {useQuery} from '@tanstack/react-query';

export default function UITreeSelect() {
  const {data} = useQuery({queryKey: ['address'], retry: 0, queryFn: async () => (await getMock()).address.getTree()});

  return (
    <div>
      <InputPopover className='w-120' renderContent={() => <ReactTree data={data ?? []} height={300} />} />
    </div>
  );
}
