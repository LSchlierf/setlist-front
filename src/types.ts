export type category = {
  id: string;
  title: string;
  show: boolean;
  type:
    | "booleanCategory"
    | "numberCategory"
    | "stringCategory"
    | "multipleStringCategory";
  valueRange: any[];
};
export type song = {
  id: string;
  title: string;
  artist: string;
  length: number;
  notes: string;
  properties: { [key: string]: any };
};

export type InputProps<T> = {
  editing: boolean;
  value: T;
  onChange: (newVal: T) => void;
};

export const categoryTypeLabels = {
  booleanCategory: "Yes/No",
  numberCategory: "Number",
  stringCategory: "Select",
  multipleStringCategory: "Multiselect",
};
