export type ComponentCategory = "passive" | "semiconductor" | "source" | "other";

export interface IElectroComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  symbolSvg?: string;
  description: string;
  properties: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
}
