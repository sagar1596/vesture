import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spreadsheet } from "./Spreadsheet";

const budget = [
  ["Item", "Q1", "Q2", "Q3", "Total"],
  ["Hosting", "1200", "1350", "1500", "=SUM(B2:D2)"],
  ["Salaries", "42000", "42000", "45000", "=SUM(B3:D3)"],
  ["Marketing", "5000", "7500", "6000", "=SUM(B4:D4)"],
  ["Total", "=SUM(B2:B4)", "=SUM(C2:C4)", "=SUM(D2:D4)", "=SUM(E2:E4)"],
  ["Average", "=AVERAGE(B2:B4)", "=AVERAGE(C2:C4)", "=AVERAGE(D2:D4)", "=E5/3"]
];

const meta: Meta<typeof Spreadsheet> = {
  title: "Components/Spreadsheet",
  component: Spreadsheet
};

export default meta;
type Story = StoryObj<typeof Spreadsheet>;

export const Budget: Story = { args: { defaultValue: budget } };
export const Empty: Story = { args: { rows: 12, columns: 8 } };
export const Errors: Story = { args: { defaultValue: [["=1/0", "=B1", "=A1+1"], ["=SUM(", "=NOPE(1)", "text"]] } };

export const CustomFunctionsAndFormatting: Story = {
  args: {
    defaultValue: [
      ["Price", "Qty", "Subtotal", "Tax"],
      ["19.99", "3", "=A2*B2", "=TAX(C2)"],
      ["5.5", "10", "=A3*B3", "=TAX(C3)"],
      ["Total", "", "=SUM(C2:C3)", "=SUM(D2:D3)"]
    ],
    functions: { TAX: ([n]) => (n ?? 0) * 0.2 },
    columnWidths: [90, 70, 110, 110],
    formatCell: (v, { row, col }) => (typeof v === "number" && col !== 1 && row > 0 ? `$${v.toFixed(2)}` : String(v)),
    isCellEditable: ({ row, col }) => row > 0 && col < 2,
    getCellStyle: (_, { row }) => (row === 3 ? { fontWeight: 700 } : undefined)
  }
};

export const ReadOnlyCompact: Story = {
  args: { defaultValue: budget, readOnly: true, showFormulaBar: false, rowHeight: 24, maxHeight: 180 }
};
