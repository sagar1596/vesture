import { vars } from "@vesture/tokens";

export interface ColorSwatch {
  label: string;
  value: string;
}

// A curated set, not a full picker: the library's existing categorical
// palette (series1-8, already tuned to be mutually distinguishable) plus a
// few semantic colors, with vars.color.text standing in as "reset to
// default" — matches the rest of the library's chart/badge color story
// rather than inventing a new one.
export const COLOR_SWATCHES: ColorSwatch[] = [
  { label: "Series 1", value: vars.chart.series1 },
  { label: "Series 2", value: vars.chart.series2 },
  { label: "Series 3", value: vars.chart.series3 },
  { label: "Series 4", value: vars.chart.series4 },
  { label: "Series 5", value: vars.chart.series5 },
  { label: "Series 6", value: vars.chart.series6 },
  { label: "Series 7", value: vars.chart.series7 },
  { label: "Series 8", value: vars.chart.series8 },
  { label: "Default text", value: vars.color.text },
  { label: "Danger", value: vars.color.danger },
  { label: "Success", value: vars.color.success },
  { label: "Warning", value: vars.color.warning }
];
