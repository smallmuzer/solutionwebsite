import { LayoutGrid, List } from "lucide-react";

interface ViewToggleProps {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}

const ViewToggle = ({ view, onChange }: ViewToggleProps) => (
  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
    <button
      onClick={() => onChange("grid")}
      className={`p-1.5 rounded transition-all ${
        view === "grid" ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
      aria-label="Grid view"
    >
      <LayoutGrid size={16} />
    </button>
    <button
      onClick={() => onChange("list")}
      className={`p-1.5 rounded transition-all ${
        view === "list" ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
      aria-label="List view"
    >
      <List size={16} />
    </button>
  </div>
);

export default ViewToggle;
