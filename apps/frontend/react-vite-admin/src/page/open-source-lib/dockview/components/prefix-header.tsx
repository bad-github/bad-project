import {AlignJustify} from 'lucide-react';
import {iconClass} from '../tool';

export default function PrefixHeader() {
  return (
    <div className="h-full flex items-center px-1">
      <span className={iconClass}>
        <AlignJustify className="size-4" />
      </span>
    </div>
  );
}
