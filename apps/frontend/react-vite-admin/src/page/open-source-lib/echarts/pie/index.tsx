import BasicPie from './basic-pie';
import PieLine from './pie-line';

export default function PieChart() {
  return (
    <div className="grid auto-rows-[300px] grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-2 overflow-auto">
      <BasicPie />
      <PieLine />
    </div>
  );
}
