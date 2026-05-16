import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Questionnaire from "./pages/Questionnaire.tsx";
import Methodology from "./pages/Methodology.tsx";
import Plasticity from "./pages/Plasticity.tsx";
import Report from "./pages/Report.tsx";
import ReportPending from "./pages/ReportPending.tsx";
import NotFound from "./pages/NotFound.tsx";
import CheckoutReturn from "./pages/CheckoutReturn.tsx";
import MyReports from "./pages/MyReports.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import DeleteConfirm from "./pages/DeleteConfirm.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/plasticity" element={<Plasticity />} />
          <Route path="/report" element={<Report />} />
          <Route path="/report-pending" element={<ReportPending />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/checkout/return" element={<CheckoutReturn />} />
          <Route path="/delete-confirm" element={<DeleteConfirm />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
