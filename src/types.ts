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
  colors?: { [key: string]: string } | undefined;
};
export type song = {
  id: string;
  title: string;
  artist: string;
  length: number;
  notes: string;
  properties: { [key: string]: any };
};

export type setlist = {
  name: string;
  id: string;
  breakLen: number;
  breakBuffer: number;
  fixedTime: "START" | "END";
  time: string;
  setSpots: setSpot[];
  categoryVisibilities: { categoryId: string; visible: boolean }[];
};

export type setSpot = {
  set: number;
  spotPrio: number;
  songId: string;
  dummy: true | undefined;
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

export type setlistTimeDTO = Omit<
  setlist,
  "name" | "id" | "setSpots" | "categoryVisibilities"
>;
