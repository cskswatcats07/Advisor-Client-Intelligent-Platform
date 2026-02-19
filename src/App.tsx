import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./app/auth";
import { AppRouter } from "./app/AppRouter";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
