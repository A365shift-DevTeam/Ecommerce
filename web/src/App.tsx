import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { SiteLayout } from "./components/site/Footer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import { AccountLayout, AddressesTab, OrderDetailTab, OrdersTab, ProfileTab, RecentTab, WishlistTab } from "./pages/account/Account";
import { ButtonLink, Container, EmptyState } from "./components/site/ui";

// The admin app is a separate bundle so shoppers never download it.
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));
const Products = lazy(() => import("./admin/pages/Products"));
const ProductForm = lazy(() => import("./admin/pages/ProductForm"));
const Orders = lazy(() => import("./admin/pages/Orders"));
const OrderDetail = lazy(() => import("./admin/pages/Orders").then((m) => ({ default: m.OrderDetail })));
const Catalog = lazy(() => import("./admin/pages/Catalog"));
const Customers = lazy(() => import("./admin/pages/Customers"));
const Promotions = lazy(() => import("./admin/pages/Promotions"));
const Reports = lazy(() => import("./admin/pages/Reports"));

function NotFound() {
  return (
    <Container className="pt-[calc(var(--nav-height)+2rem)]">
      <EmptyState title="This page doesn't exist" body="The link may be old. The shop has everything currently in the studio." action={<ButtonLink to="/shop">Go to the shop</ButtonLink>} />
    </Container>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-[100dvh]" />}>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="product/:slug" element={<ProductPage />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order/:id" element={<OrderConfirmation />} />
              <Route path="account" element={<AccountLayout />}>
                <Route index element={<ProfileTab />} />
                <Route path="orders" element={<OrdersTab />} />
                <Route path="orders/:id" element={<OrderDetailTab />} />
                <Route path="addresses" element={<AddressesTab />} />
              </Route>
              <Route path="account/wishlist" element={<AccountLayout publicTab />}>
                <Route index element={<WishlistTab />} />
              </Route>
              <Route path="account/recent" element={<AccountLayout publicTab />}>
                <Route index element={<RecentTab />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id" element={<ProductForm />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="customers" element={<Customers />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  );
}
