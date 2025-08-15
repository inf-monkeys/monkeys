export const QuickAction: React.FC<{ cardUrl: string; onClick?: () => void }> = ({ cardUrl, onClick }) => {
  return (
    <div
      className="h-[350px] w-[260px] cursor-pointer border-[1.5px] bg-[#ffffffb2] transition-all hover:bg-[#ffffffff]"
      onClick={onClick}
    >
      <img className="size-full" src={cardUrl} alt="" />
    </div>
  );
};
