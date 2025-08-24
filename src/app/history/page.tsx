import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History } from "lucide-react";

// Mock data for demonstration purposes
const MOCK_ANALYSES = [
  {
    id: "1",
    date: new Date("2023-10-27T10:00:00Z"),
    cryptoPair: "BTCUSDT",
    analysisMode: "Pro",
    entryPriceRange: "29800 - 30200",
    takeProfit: "31000, 31500, 32000",
    stopLoss: "29500",
  },
  {
    id: "2",
    date: new Date("2023-10-27T09:00:00Z"),
    cryptoPair: "ETHUSDT",
    analysisMode: "Flash",
    entryPriceRange: "1780 - 1800",
    takeProfit: "1850",
    stopLoss: "1750",
  },
  {
    id: "3",
    date: new Date("2023-10-26T15:30:00Z"),
    cryptoPair: "SOLUSDT",
    analysisMode: "Flash",
    entryPriceRange: "30.5 - 31.0",
    takeProfit: "33.0",
    stopLoss: "29.8",
  },
  {
    id: "4",
    date: new Date("2023-10-25T11:00:00Z"),
    cryptoPair: "BTCUSDT",
    analysisMode: "Pro",
    entryPriceRange: "28000 - 28300",
    takeProfit: "29000, 29500",
    stopLoss: "27800",
  },
];

export default function AnalysisHistoryPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">
       <div className="flex items-center gap-4">
        <History className="w-8 h-8 text-primary"/>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground">
            Review your past AI-powered trade analyses.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Past Analyses</CardTitle>
            <CardDescription>
                A log of all analyses performed by the AI. 
                {/* Add filters here in a future iteration */}
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Entry Range</TableHead>
                <TableHead>Take Profit(s)</TableHead>
                <TableHead>Stop Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ANALYSES.map((analysis) => (
                <TableRow key={analysis.id}>
                  <TableCell>
                    {analysis.date.toLocaleString()}
                  </TableCell>
                  <TableCell>{analysis.cryptoPair}</TableCell>
                  <TableCell>
                    <Badge variant={analysis.analysisMode === "Pro" ? "default" : "secondary"}>
                      {analysis.analysisMode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-green-400">{analysis.entryPriceRange}</TableCell>
                  <TableCell className="text-blue-400">{analysis.takeProfit}</TableCell>
                  <TableCell className="text-red-400">{analysis.stopLoss}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
