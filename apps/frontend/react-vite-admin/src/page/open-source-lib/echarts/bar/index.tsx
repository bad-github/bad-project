import BasicBar from './basic-bar';
import DynamicLabel from './dynamic-label';
import MultipleBar from './multiple-bar';

export default function BarChart() {
  return (
    <div className="grid auto-rows-[300px] grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-2 overflow-auto">
      <BasicBar />
      <DynamicLabel />
      <MultipleBar />
    </div>
  );
}
