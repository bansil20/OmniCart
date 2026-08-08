import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSellerProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService.js';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService.js';
import { downloadOrderInvoicePDF } from '../../utils/pdfInvoiceGenerator.js';
import {
  FaStore,
  FaBoxes,
  FaRupeeSign,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFolder,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaImage,
  FaTag,
  FaLayerGroup,
  FaEllipsisV,
  FaShoppingBag,
  FaFileDownload,
  FaUserCheck,
} from 'react-icons/fa';

const SellerDashboard = () => {
  const { user, token } = useAuth();
  const { state } = useLocation();

  // Active Main Tab: 'products' or 'orders'
  const [activeTab, setActiveTab] = useState(state?.tab || 'products');

  // State definitions
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(state?.searchQuery || '');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  useEffect(() => {
    if (state?.tab) {
      setActiveTab(state.tab);
    }
    if (state?.searchQuery !== undefined) {
      setSearchTerm(state.searchQuery);
    }
  }, [state?.tab, state?.searchQuery]);

  // Product Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  // Category Modal States
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [showCategoryDeleteModal, setShowCategoryDeleteModal] = useState(false);

  // Form Field States
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    discountPrice: '',
    stock: '',
    imageUrl: '',
    description: '',
  });

  const [inlineCategoryName, setInlineCategoryName] = useState('');
  const [isCreatingInlineCategory, setIsCreatingInlineCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Seller Products, Categories & Seller Orders
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, catData] = await Promise.all([
        getSellerProducts(token),
        getCategories(token),
      ]);
      setProducts(prodData || []);

      // Deduplicate categories list by lowercase name
      const uniqueCats = [];
      const seen = new Set();
      (catData || []).forEach((c) => {
        const nameKey = c.name.toLowerCase().trim();
        if (!seen.has(nameKey)) {
          seen.add(nameKey);
          uniqueCats.push(c);
        }
      });
      setCategories(uniqueCats);

      // Fetch Seller Sales Orders
      const orderRes = await fetch('http://localhost:5000/api/orders/seller', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orderData = await orderRes.json();
      if (orderRes.ok && orderData.orders) {
        setSellerOrders(orderData.orders);
      }
    } catch (err) {
      // Seller data fetch error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Handle open modal for creating product
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsCreatingInlineCategory(false);
    setInlineCategoryName('');
    setFormData({
      name: '',
      category: categories[0]?.name || '',
      price: '',
      discountPrice: '',
      stock: '',
      imageUrl: '',
      description: '',
    });
    setErrorMessage('');
    setShowProductModal(true);
  };

  // Handle open modal for editing product
  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setIsCreatingInlineCategory(false);
    setInlineCategoryName('');
    setFormData({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      discountPrice: prod.discountPrice || '',
      stock: prod.stock,
      imageUrl: prod.imageUrl,
      description: prod.description || '',
    });
    setErrorMessage('');
    setShowProductModal(true);
  };

  // Inline Category Creation
  const handleCreateInlineCategory = async () => {
    if (!inlineCategoryName.trim()) return;

    try {
      const created = await createCategory({ name: inlineCategoryName.trim() }, token);
      await loadData();
      setFormData((prev) => ({ ...prev, category: created.category.name }));
      setIsCreatingInlineCategory(false);
      setInlineCategoryName('');
    } catch (err) {
      alert(err.message || 'Failed to create category');
    }
  };

  // Save Product (Create or Update)
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name || !formData.category || formData.price === '' || formData.stock === '') {
      setErrorMessage('Please fill in product name, category, price, and stock quantity.');
      return;
    }

    if (Number(formData.price) <= 0) {
      setErrorMessage('Price must be greater than 0.');
      return;
    }

    if (formData.discountPrice && Number(formData.discountPrice) >= Number(formData.price)) {
      setErrorMessage('Discount price deduction cannot exceed or equal original price.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, formData, token);
        setSuccessMessage(`Product '${formData.name}' updated successfully!`);
      } else {
        await createProduct(formData, token);
        setSuccessMessage(`Product '${formData.name}' published successfully!`);
      }

      await loadData();
      setShowProductModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Product
  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;

    try {
      await deleteProduct(deletingProductId, token);
      await loadData();
      setShowDeleteModal(false);
      setDeletingProductId(null);
      setSuccessMessage('Product deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    }
  };

  // Create Category from standalone modal
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await createCategory({ name: newCategoryName }, token);
      await loadData();
      setNewCategoryName('');
      setShowAddCategoryModal(false);
      setSuccessMessage(`Category '${res.category.name}' created!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to create category');
    }
  };

  // Edit Category Name
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!categoryNameInput.trim() || !editingCategory) return;

    try {
      await updateCategory(editingCategory._id, { name: categoryNameInput.trim() }, token);
      await loadData();
      setShowCategoryEditModal(false);
      setEditingCategory(null);
      setSuccessMessage('Category name updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update category');
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      await deleteCategory(deletingCategory._id, token);
      await loadData();
      setShowCategoryDeleteModal(false);
      setDeletingCategory(null);
      setSuccessMessage('Category deleted!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  // Filter Products by search, category, status
  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
    const matchesStatus = selectedStatusFilter === 'all' || item.status === selectedStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filter Seller Orders by customer name, email, order ID, or product name
  const filteredSellerOrders = sellerOrders.filter((ord) => {
    if (!orderSearchTerm.trim()) return true;
    const q = orderSearchTerm.toLowerCase().trim();
    const customerName = (ord.shippingAddress?.fullName || ord.user?.name || '').toLowerCase();
    const customerEmail = (ord.user?.email || '').toLowerCase();
    const orderId = (ord._id || '').toLowerCase();
    const itemNames = (ord.orderItems || []).map((i) => i.name.toLowerCase()).join(' ');

    return (
      customerName.includes(q) ||
      customerEmail.includes(q) ||
      orderId.includes(q) ||
      itemNames.includes(q)
    );
  });

  // Calculate seller revenue and sales totals
  const totalSalesRevenue = sellerOrders.reduce((sum, ord) => sum + Number(ord.totalPrice || 0), 0);

  // Calculate final selling price for Add/Edit Product Modal
  const origPrice = Number(formData.price || 0);
  const discVal = Number(formData.discountPrice || 0);
  const computedFinalPrice = discVal > 0 && discVal < origPrice ? origPrice - discVal : origPrice;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/30 text-emerald-200 p-2.5 rounded-2xl text-2xl backdrop-blur-md">
              <FaStore />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Seller Management Console</h1>
              <p className="text-xs text-emerald-200 mt-0.5">Store Owner: <span className="font-bold underline text-white">{user?.name}</span> ({user?.email})</p>
            </div>
          </div>
          <p className="mt-3 text-emerald-100 text-sm max-w-xl">
            Manage your store catalog, track customer sales orders, download PDF tax invoices, and control inventory levels.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-800/80 hover:bg-emerald-800 text-white px-4 py-3 rounded-2xl font-semibold text-sm border border-emerald-700/50 shadow-sm transition-all"
          >
            <FaLayerGroup />
            <span>Add Store Category</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-all duration-200"
          >
            <FaPlus className="text-emerald-600" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-emerald-600 text-lg" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800">
            <FaTimes />
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
            <FaBoxes />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Listed Products</p>
            <h3 className="text-2xl font-extrabold text-blue-950 mt-1">{products.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
            <FaShoppingBag />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales Orders Received</p>
            <h3 className="text-2xl font-extrabold text-blue-950 mt-1">{sellerOrders.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl">
            <FaRupeeSign />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales Revenue</p>
            <h3 className="text-2xl font-extrabold text-blue-950 mt-1">₹{totalSalesRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-amber-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
            <FaFolder />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Categories</p>
            <h3 className="text-2xl font-extrabold text-blue-950 mt-1">{categories.length}</h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Products vs Orders Received) */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 font-extrabold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FaBoxes />
          <span>Store Catalog & Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 font-extrabold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FaShoppingBag />
          <span>Customer Orders & Invoices ({sellerOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: Products Management */}
      {activeTab === 'products' && (
        <>
          {/* Seller Store Categories Section */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                  <FaLayerGroup className="text-emerald-600" />
                  <span>Seller Store Categories</span>
                </h2>
                <p className="text-xs text-gray-500">Manage, rename or remove store categories.</p>
              </div>

              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
              >
                + Create New Category
              </button>
            </div>

            {categories.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No categories created yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="p-3 bg-gray-50/80 rounded-2xl border border-gray-200/80 flex items-center justify-between group hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors"
                  >
                    <div>
                      <p className="font-extrabold text-xs text-blue-950 truncate max-w-[100px]">{cat.name}</p>
                      <p className="text-[10px] text-gray-400">{products.filter((p) => p.category === cat.name).length} products</p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryNameInput(cat.name);
                          setShowCategoryEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit Category Name"
                      >
                        <FaEdit className="text-xs" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingCategory(cat);
                          setShowCategoryDeleteModal(true);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete Category"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products Table Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <FaSearch className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search seller products by title or category..."
                  className="w-full pl-10 pr-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="all">All Seller Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Products Data Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading seller inventory...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No products found matching filters.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-50/40 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <th className="py-4 px-6">Product Details</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Original Price</th>
                      <th className="py-4 px-6">Discount Off</th>
                      <th className="py-4 px-6">Final Price</th>
                      <th className="py-4 px-6">Stock</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredProducts.map((p) => {
                      const orig = Number(p.price || 0);
                      const disc = Number(p.discountPrice || 0);
                      const finalP = disc > 0 && disc < orig ? orig - disc : orig;
                      return (
                        <tr key={p._id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-4 px-6 font-semibold text-blue-950 flex items-center gap-3">
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-contain bg-gray-50 border border-gray-100 shrink-0"
                            />
                            <div>
                              <p className="font-extrabold text-blue-950">{p.name}</p>
                              <p className="text-xs text-gray-400 font-normal line-clamp-1">{p.description || 'No description'}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-gray-700">₹{orig.toFixed(2)}</td>
                          <td className="py-4 px-6 font-semibold text-pink-600">
                            {disc > 0 ? `-₹${disc.toFixed(2)}` : 'No Discount'}
                          </td>
                          <td className="py-4 px-6 font-extrabold text-emerald-700 text-base">₹{finalP.toFixed(2)}</td>
                          <td className="py-4 px-6 font-bold text-gray-700">{p.stock} units</td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                p.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'Low Stock'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingProductId(p._id);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB 2: Customer Sales Orders & Invoices */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                <FaShoppingBag className="text-emerald-600" />
                <span>Customer Orders Received</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Search sales orders by customer name, email, product title, or order ID.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Order Search Input */}
              <div className="relative flex-1 sm:w-80">
                <FaSearch className="absolute left-3.5 top-3 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  placeholder="Search customer name, product, or order ID..."
                  className="w-full pl-9 pr-8 py-2 bg-blue-50/60 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
                {orderSearchTerm && (
                  <button
                    onClick={() => setOrderSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3.5 py-2 rounded-xl shrink-0 text-center">
                {filteredSellerOrders.length} {filteredSellerOrders.length === 1 ? 'Order' : 'Orders'} Found
              </span>
            </div>
          </div>

          {filteredSellerOrders.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-2">
              <FaShoppingBag className="text-4xl text-gray-300 mx-auto" />
              <p className="font-bold text-gray-600 text-base">No Matching Sales Orders</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {orderSearchTerm
                  ? `No orders found matching "${orderSearchTerm}". Try searching a different customer name or product.`
                  : 'When customers purchase items from your store catalog, their order details and tax invoice PDF downloads will appear here.'}
              </p>
              {orderSearchTerm && (
                <button
                  onClick={() => setOrderSearchTerm('')}
                  className="text-xs font-bold text-emerald-700 hover:underline pt-2"
                >
                  Clear Search Query
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSellerOrders.map((ord) => (
                <div key={ord._id} className="bg-blue-50/30 rounded-2xl p-5 border border-gray-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-blue-950 text-sm">Order #{ord._id}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                          {ord.status || 'Confirmed'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Purchased on {new Date(ord.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <button
                      onClick={() => downloadOrderInvoicePDF(ord, true)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <FaFileDownload />
                      <span>Download Sales Invoice PDF</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-gray-500 uppercase">Customer Info:</p>
                      <p className="font-semibold text-blue-950 mt-1">{ord.shippingAddress?.fullName}</p>
                      <p className="text-gray-600">Phone: {ord.shippingAddress?.phone}</p>
                      {ord.user && <p className="text-gray-500">Email: {ord.user.email}</p>}
                    </div>

                    <div>
                      <p className="font-bold text-gray-500 uppercase">Shipping Address:</p>
                      <p className="text-gray-700 mt-1">
                        {ord.shippingAddress?.address}, {ord.shippingAddress?.city}, {ord.shippingAddress?.state} - {ord.shippingAddress?.pincode}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-gray-500 uppercase">Order Earnings:</p>
                      <p className="font-black text-emerald-700 text-lg mt-0.5">₹{Number(ord.totalPrice).toFixed(2)}</p>
                      <p className="text-gray-500 font-medium">{ord.paymentMethod}</p>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-[11px] font-bold uppercase text-gray-500 mb-2">Purchased Items List:</p>
                    <div className="divide-y divide-gray-100">
                      {ord.orderItems?.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.imageUrl || item.product?.imageUrl || 'https://via.placeholder.com/30'}
                              alt={item.name}
                              className="w-8 h-8 rounded-lg object-contain bg-gray-50 border border-gray-100"
                            />
                            <span className="font-bold text-blue-950">{item.name}</span>
                          </div>
                          <span className="font-bold text-gray-700">Qty: {item.qty} × ₹{Number(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add/Edit Product */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 animate-fade-in relative border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProductModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-lg"
            >
              <FaTimes />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-blue-950 flex items-center gap-2">
                <FaStore className="text-emerald-600" />
                <span>{editingProduct ? 'Edit Seller Product' : 'Add New Seller Product'}</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Fill in details, category, stock quantity, and discount deduction for store publication.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-xl border border-red-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-gray-600 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold uppercase text-gray-600">Category *</label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingInlineCategory(!isCreatingInlineCategory)}
                    className="text-emerald-700 hover:underline font-bold text-[11px]"
                  >
                    {isCreatingInlineCategory ? 'Select Existing Category' : '+ Create New Category'}
                  </button>
                </div>

                {isCreatingInlineCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inlineCategoryName}
                      onChange={(e) => setInlineCategoryName(e.target.value)}
                      placeholder="e.g. Footwear"
                      className="flex-1 px-3 py-2 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineCategory}
                      className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-gray-600 mb-1">Original Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="1000"
                    className="w-full px-3 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-gray-600 mb-1">Discount Off (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    placeholder="150"
                    className="w-full px-3 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-gray-600 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="25"
                    className="w-full px-3 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex justify-between items-center text-xs">
                <span>Final Selling Price to Customers:</span>
                <span className="font-extrabold text-emerald-800 text-sm">₹{computedFinalPrice > 0 ? computedFinalPrice.toFixed(2) : '0.00'}</span>
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-600 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-600 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide product specifications and details..."
                  className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 font-bold text-gray-600 hover:text-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Standalone Add Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 relative border border-emerald-100">
            <button
              onClick={() => setShowAddCategoryModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
            <h3 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
              <FaLayerGroup className="text-emerald-600" />
              <span>Create Store Category</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Sports & Fitness"
                className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-extrabold rounded-xl shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Category Name */}
      {showCategoryEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 relative border border-blue-100">
            <button
              onClick={() => setShowCategoryEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
            <h3 className="text-lg font-extrabold text-blue-950">Rename Store Category</h3>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <input
                type="text"
                required
                value={categoryNameInput}
                onChange={(e) => setCategoryNameInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-extrabold rounded-xl shadow-sm"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Category Confirmation */}
      {showCategoryDeleteModal && deletingCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 relative border border-red-100 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl">
              <FaExclamationTriangle />
            </div>
            <h3 className="text-lg font-extrabold text-blue-950">Delete Category '{deletingCategory.name}'?</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to delete this category? Products assigned to it will remain in store catalog.
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowCategoryDeleteModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-5 py-2 bg-red-600 text-white text-xs font-extrabold rounded-xl shadow-sm hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Product */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 relative border border-red-100 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl">
              <FaExclamationTriangle />
            </div>
            <h3 className="text-lg font-extrabold text-blue-950">Delete Product?</h3>
            <p className="text-xs text-gray-500">
              This action cannot be undone. This product will be permanently removed from your seller inventory and store catalog.
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-5 py-2 bg-red-600 text-white text-xs font-extrabold rounded-xl shadow-sm hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
