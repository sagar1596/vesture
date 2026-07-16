import { Tabs as TabsBase } from "./Tabs";
import { TabsList } from "./TabsList";
import { TabsPanel } from "./TabsPanel";
import { TabsTrigger } from "./TabsTrigger";

export const Tabs = Object.assign(TabsBase, {
  List: TabsList,
  Trigger: TabsTrigger,
  Panel: TabsPanel
});
export type { TabsProps } from "./Tabs";
export { TabsList } from "./TabsList";
export type { TabsListProps } from "./TabsList";
export { TabsTrigger } from "./TabsTrigger";
export type { TabsTriggerProps } from "./TabsTrigger";
export { TabsPanel } from "./TabsPanel";
export type { TabsPanelProps } from "./TabsPanel";
