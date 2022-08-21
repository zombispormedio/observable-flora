import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PlantListPage } from "./pages/plants";
import { PlantDetailPage } from "./pages/plants/PlantDetailPage";
import { TracedPage } from "./instrumentation/TracedPage";
import { TracedNavigation } from "./instrumentation/TracedNavigation";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />

      <BrowserRouter>
        <TracedNavigation>
          <Routes>
            <Route path="/">
              <Route
                index
                element={
                  <TracedPage page="plant-list">
                    <PlantListPage />
                  </TracedPage>
                }
              />
              <Route path="plants">
                <Route
                  path=":plantId"
                  element={
                    <TracedPage page="plant-detail">
                      <PlantDetailPage />
                    </TracedPage>
                  }
                />
              </Route>
            </Route>
          </Routes>
        </TracedNavigation>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
