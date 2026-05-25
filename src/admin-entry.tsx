import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import AdminDashboard from './components/AdminDashboard';
import './index.css';
import { Product, Announcement } from './types';

function AdminApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch products listings', err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch announcements list', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" id="admin-root-view">
      <AdminDashboard
        products={products}
        onRefreshProducts={fetchProducts}
        announcements={announcements}
        onRefreshAnnouncements={fetchAnnouncements}
      />
    </div>
  );
}

createRoot(document.getElementById('admin-root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
