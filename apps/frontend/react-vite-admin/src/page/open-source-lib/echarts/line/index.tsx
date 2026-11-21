import BasicLineCpn from './basic-line-cpn';
import BasicLineHook from './basic-line-hook';
import DynamicLine from './dynamic-line';
import GridLine from './grid-line';
import StackedLine from './stacked-line';

export default function LineChart() {
  return (
    <div className="grid auto-rows-[minmax(300px,auto)] grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-2 overflow-auto">
      <BasicLineCpn />
      <BasicLineHook />
      <StackedLine />
      <DynamicLine />
      <GridLine />
    </div>
  );
}
