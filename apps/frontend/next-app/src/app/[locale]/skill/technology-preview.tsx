import type {Technology} from './data';

type Props = {
  name: string;
  icon: Technology['icon'];
  iconClassName: string;
  items: readonly string[];
};

export default function TechnologyPreview({name, icon: Icon, iconClassName, items}: Props) {
  if (items.length === 0) {
    return <p className="font-medium">{name}</p>;
  }

  return (
    <article className="flex w-full flex-col gap-2 px-1.5">
      <header className="flex items-center gap-2">
        <Icon aria-hidden="true" focusable="false" className={`size-5 shrink-0 ${iconClassName}`} />
        <h3 className="text-sm font-semibold">{name}</h3>
      </header>
      <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-5 text-muted-foreground">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </article>
  );
}
