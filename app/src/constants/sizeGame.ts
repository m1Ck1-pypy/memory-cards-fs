export enum SIZE {
  SMALL = "4x4",
  MEDIUM = "6x6",
  LARGE = "8x8",
}

export const VALUE_SIZE: { [key in SIZE]: number } = {
  "4x4": 8,
  "6x6": 12,
  "8x8": 16,
};
