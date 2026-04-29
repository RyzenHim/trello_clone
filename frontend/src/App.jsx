import { Suspense, lazy } from "react";
import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import LoadingScreen from "./components/ui/LoadingScreen";

const RootLayout = lazy(() => import("./layout/RootLayout"));
const AuthLayout = lazy(() => import("./layout/AuthLayout"));
const Home = lazy(() => import("./components/Home"));
const AuthHomePage = lazy(() => import("./components/signUpLogin/AuthHomePage"));
const Login = lazy(() => import("./components/signUpLogin/Login"));
const SignUp = lazy(() => import("./components/signUpLogin/SignUp"));
const Profile = lazy(() => import("./components/Profile"));
const ProtectedRoute = lazy(() => import("./components/protectedRoute/ProtectedRoute"));
const Boards = lazy(() => import("./components/dnd/Boards"));
const Stats = lazy(() => import("./components/stats/Stats"));
const AdminUsers = lazy(() => import("./components/admin/AdminUsers"));

function RouteFallback() {
  return <LoadingScreen label="Loading page" />;
}

function withSuspense(node) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={withSuspense(<ProtectedRoute />)}>
        <Route path="/" element={withSuspense(<RootLayout />)}>
          <Route index element={withSuspense(<Home />)} />
          <Route path="profile" element={withSuspense(<Profile />)} />
          <Route path="mytasks" element={<Navigate to="/boards" replace />} />
          <Route path="boards" element={withSuspense(<Boards />)} />
          <Route path="stats" element={withSuspense(<Stats />)} />
          <Route path="admin/users" element={withSuspense(<AdminUsers />)} />
        </Route>
      </Route>

      <Route element={withSuspense(<AuthLayout />)}>
        <Route path="/user" element={withSuspense(<AuthHomePage />)}>
          <Route index element={<Navigate to="login" replace />} />
          <Route path="login" element={withSuspense(<Login />)} />
          <Route path="signup" element={withSuspense(<SignUp />)} />
        </Route>
      </Route>
    </>,
  ),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
