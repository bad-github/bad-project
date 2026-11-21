import {mockData} from './tool';
import Highlighter from './high-lighter';

export default function ReactSyntaxHighlighterPage() {
  return (
    <div>
      <Highlighter isVirtual language="bash" autoScrollBottom data={mockData.join('')} />
    </div>
  );
}
