interface Props {
  tag: string;
  active?: boolean;
  onClick?: () => void;
}

export function Tag({ tag, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-mono transition-colors ${
        active
          ? 'bg-violet-600 text-white'
          : 'bg-[#1e1e32] text-[#6666a0] hover:bg-[#2a2a45] hover:text-[#a0a0d0]'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      #{tag}
    </button>
  );
}
