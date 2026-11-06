import { convertDashedToCapitalized } from "@/utils";

const CategoryItem: React.FC<{
  icon: string;
  val: string;
  isSelected: boolean;
  handleType: (val: string) => void;
}> = (props) => {
  return (
    <div className="text-center">
      <button
        type="button"
        className={`text-black p-2 px-3 min-w-12 ${
          props.isSelected ? "bg-primary text-white" : "bg-grey text-grey-dark"
        } rounded-lg`}
        onClick={() => props.handleType(props.val)}
      >
        <i className={`${props.icon} text-xl`}></i>
      </button>
      <span
        className={`text-xs font-medium ${
          props.isSelected ? "text-primary" : "text-grey-dark"
        }`}
      >
        {convertDashedToCapitalized(props.val)}
      </span>
    </div>
  );
};

export default CategoryItem;
