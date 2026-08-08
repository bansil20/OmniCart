import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  FaUsers,
  FaStore,
  FaUserPlus,
  FaShieldAlt,
  FaUserCheck,
  FaLock,
  FaEnvelope,
  FaUser,
  FaSearch,
  FaTimes
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { token, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Seller Modal State
  const [showAddSellerModal, setShowAddSellerModal] = useState(false);
  const [sellerName, setSellerName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [isSubmittingSeller, setIsSubmittingSeller] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('http://localhost:5000/api/auth/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (err) {
      // User list fetch error handling
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        alert(data.message || 'Failed to update role');
      }
    } catch (err) {
      alert('Network error updating role');
    }
  };

  // Add Seller / User Handler
  const handleAddSeller = async (e) => {
    e.preventDefault();
    setModalMessage({ type: '', text: '' });

    if (!sellerName || !sellerEmail || !sellerPassword) {
      setModalMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    if (sellerPassword.length < 6) {
      setModalMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsSubmittingSeller(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: sellerName,
          email: sellerEmail,
          password: sellerPassword,
          role: 'seller',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setModalMessage({ type: 'success', text: 'Seller account created successfully!' });
        setSellerName('');
        setSellerEmail('');
        setSellerPassword('');
        fetchUsers();
        setTimeout(() => {
          setShowAddSellerModal(false);
          setModalMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setModalMessage({ type: 'error', text: data.message || 'Failed to create seller.' });
      }
    } catch (err) {
      setModalMessage({ type: 'error', text: 'Server error while creating seller account.' });
    } finally {
      setIsSubmittingSeller(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const sellerCount = users.filter((u) => u.role === 'seller').length;
  const customerCount = users.filter((u) => u.role === 'customer' || u.role === 'user').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-blue-500/30 text-blue-200 p-2 rounded-xl text-xl backdrop-blur-md">
              <FaShieldAlt />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="mt-2 text-blue-100 text-sm max-w-xl">
            Platform control center for managing seller accounts, user permissions, and monitoring marketplace activity.
          </p>
        </div>
        <button
          onClick={() => setShowAddSellerModal(true)}
          className="flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-all duration-200"
        >
          <FaUserPlus className="text-blue-600" />
          <span>Add Seller Account</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
            <FaUsers />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-extrabold text-blue-950 mt-1">{users.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
            <FaStore />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Sellers</p>
            <h3 className="text-2xl font-extrabold text-blue-950 mt-1">{sellerCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl">
            <FaUserCheck />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customers</p>
            <h3 className="text-2xl font-extrabold text-blue-950 mt-1">{customerCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-amber-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
            <FaShieldAlt />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admins</p>
            <h3 className="text-2xl font-extrabold text-blue-950 mt-1">{adminCount}</h3>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-blue-950">User & Role Management</h2>
            <p className="text-xs text-gray-500 mt-1">
              View registered users and manage their permission roles.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Account Search Input */}
            <div className="relative min-w-[240px]">
              <FaSearch className="absolute left-3.5 top-3 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email, or role..."
                className="w-full pl-9 pr-8 py-2 bg-blue-50/60 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div className="flex bg-blue-50 p-1 rounded-xl border border-blue-100 text-xs font-semibold shrink-0">
              {['all', 'customer', 'seller', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    filterRole === role
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-gray-500 hover:text-blue-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          {loadingUsers ? (
            <div className="p-8 text-center text-gray-500">Loading user records...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 space-y-2">
              <p className="font-semibold">No user accounts found matching query</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Current Role</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = u._id === currentUser?._id;
                  return (
                    <tr key={u._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-blue-950 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{u.email}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'seller'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        {isCurrentAdmin ? (
                          <span className="text-xs text-gray-400 font-medium">You (Logged in)</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Seller Modal */}
      {showAddSellerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-fade-in relative border border-blue-100">
            <button
              onClick={() => setShowAddSellerModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-lg"
            >
              <FaTimes />
            </button>

            <div>
              <h3 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                <FaStore className="text-emerald-600" />
                <span>Create Seller Account</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Admins can directly register and provision new Seller accounts for the platform.
              </p>
            </div>

            {modalMessage.text && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold ${
                  modalMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {modalMessage.text}
              </div>
            )}

            <form onSubmit={handleAddSeller} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Store / Seller Name
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="TechGadgets Store"
                    className="w-full pl-10 pr-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Seller Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    placeholder="seller@omnicart.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Initial Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={sellerPassword}
                    onChange={(e) => setSellerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSellerModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSeller}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingSeller ? 'Creating...' : 'Register Seller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
