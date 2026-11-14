import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';
import Home from './pages/Home';
import Breeds from './pages/Breeds';
import BreedDetail from './pages/BreedDetail';
import Compare from './pages/Compare';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBreeds from './pages/admin/AdminBreeds';
import AdminBreedForm from './pages/admin/AdminBreedForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminMembers from './pages/admin/AdminMembers';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Guest */}
          <Route path="/" element={<Home />} />
          <Route path="/breeds" element={<Breeds />} />
          <Route path="/breeds/:id" element={<BreedDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Member */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

          {/* Admin — Frontend กันไว้ชั้นหนึ่ง แต่ Backend ตรวจสิทธิ์ซ้ำทุก request */}
          <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
            <Route index element={<AdminDashboard />} />
            <Route path="breeds" element={<AdminBreeds />} />
            <Route path="breeds/new" element={<AdminBreedForm />} />
            <Route path="breeds/:id/edit" element={<AdminBreedForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="members" element={<AdminMembers />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
