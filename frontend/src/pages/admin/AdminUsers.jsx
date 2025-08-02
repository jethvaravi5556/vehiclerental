// pages/admin/AdminUsers.jsx
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  UserPlus,
  Shield,
  User,
  Mail,
  Calendar,
  Activity,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Save,
  Users,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import axios from "../../axiosConfig";
import AdminLayout from "../../components/layout/AdminLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import toast from "react-hot-toast";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "user" });
  const [createForm, setCreateForm] = useState({ name: "", email: "", role: "user" });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch users
  const fetchUsers = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const response = await axios.get("/api/admin/users");
      setUsers(response.data);
      if (showRefreshing) {
        toast.success("Users data refreshed successfully!");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Calculate user stats
  const userStats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === "admin").length;
    const regularUsers = users.filter(u => u.role === "user").length;
    const newThisMonth = users.filter(u => {
      const userDate = new Date(u.createdAt);
      const now = new Date();
      return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
    }).length;

    return { total, admins, regularUsers, newThisMonth };
  }, [users]);

  const handleRoleChange = async (userId, newRole) => {
    const user = users.find((u) => u._id === userId);
    const confirmed = window.confirm(
      `Are you sure you want to change ${user?.name}'s role to ${newRole.toUpperCase()}?`
    );
    if (!confirmed) return;

    setUpdating(userId);
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      const updated = users.map((u) =>
        u._id === userId ? { ...u, role: newRole } : u
      );
      setUsers(updated);
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      console.error("Role update failed", err);
      toast.error("Failed to update user role");
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUpdating("create");
    try {
      const response = await axios.post("/api/admin/users", createForm);
      setUsers([...users, response.data.user]);
      toast.success("User created successfully");
      setShowCreateModal(false);
      setCreateForm({ name: "", email: "", role: "user" });
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateUser = async () => {
    if (!editForm.name || !editForm.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUpdating("update");
    try {
      const response = await axios.put(`/api/admin/users/${editForm._id}`, {
        name: editForm.name,
        email: editForm.email
      });
      const updated = users.map((u) =>
        u._id === editForm._id ? { ...u, ...response.data.user } : u
      );
      setUsers(updated);
      toast.success("User updated successfully");
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${userName}?`);
    if (!confirmed) return;

    setUpdating(userId);
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setUpdating(null);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    // Apply search filter
    if (search) {
      filtered = filtered.filter((user) =>
        `${user.name} ${user.email}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";

      if (sortBy === "createdAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [users, search, roleFilter, sortBy, sortOrder]);

  const exportUsers = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Email,Role,Joined Date\n" +
      filteredAndSortedUsers
        .map(
          (user) =>
            `${user.name},${user.email},${user.role},${new Date(
              user.createdAt
            ).toLocaleDateString()}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Users exported successfully!");
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "user":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role) => {
    return role === "admin" ? Shield : User;
  };

  if (loading) {
    return (
      <AdminLayout 
        title="User Management"
        subtitle="Manage users, roles, and permissions"
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <LoadingSpinner size="xl" className="py-20" />
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="User Management"
      subtitle="Manage users, roles, and permissions"
      onRefresh={() => fetchUsers(true)}
      refreshing={refreshing}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Stats Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-xl text-white overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">User Analytics</h2>
                <p className="text-purple-100">
                  Total Users: {userStats.total} | Admins: {userStats.admins} | Regular Users: {userStats.regularUsers}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportUsers}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { 
                  label: "Total Users", 
                  value: userStats.total, 
                  icon: Users,
                  change: "+5%"
                },
                { 
                  label: "Admins", 
                  value: userStats.admins, 
                  icon: Shield,
                  change: "0%"
                },
                { 
                  label: "Regular Users", 
                  value: userStats.regularUsers, 
                  icon: User,
                  change: "+8%"
                },
                { 
                  label: "New This Month", 
                  value: userStats.newThisMonth, 
                  icon: TrendingUp,
                  change: "+12%"
                }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/20 rounded-xl p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 text-green-300 mr-1" />
                        <span className="text-xs text-green-300">{stat.change}</span>
                      </div>
                    </div>
                    <stat.icon className="h-8 w-8 text-purple-200" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* Filters and Search */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-gray-200"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown
                    className={`h-4 w-4 ml-2 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="name">Name</option>
                        <option value="email">Email</option>
                        <option value="role">Role</option>
                        <option value="createdAt">Join Date</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order
                      </label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    User
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Joined
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredAndSortedUsers.map((user, index) => {
                    const RoleIcon = getRoleIcon(user.role);
                    return (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-medium mr-4">
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={user.role}
                            disabled={updating === user._id}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value)
                            }
                            className={`px-3 py-1 text-sm rounded-full border font-medium transition-all ${getRoleColor(
                              user.role
                            )} ${
                              updating === user._id
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:shadow-md cursor-pointer"
                            }`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Activity className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditForm(user);
                                setShowEditModal(true);
                              }}
                              className="hover:bg-green-50 hover:text-green-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              disabled={updating === user._id}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              {updating === user._id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredAndSortedUsers.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No users found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* User Details Modal */}
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title="User Details"
        >
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold mr-4">
                  {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedUser.name}
                  </h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(
                      selectedUser.role
                    )}`}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    {selectedUser.role.charAt(0).toUpperCase() +
                      selectedUser.role.slice(1)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date
                  </label>
                  <p className="text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowUserModal(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setEditForm(selectedUser);
                    setShowUserModal(false);
                    setShowEditModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Create User Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New User"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800">
                  A temporary password (Dummy@123) will be assigned. User should change it on first login.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={updating === "create"}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={updating === "create"}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {updating === "create" ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit User"
        >
          {editForm && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  disabled={updating === "update"}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateUser}
                  disabled={updating === "update"}
                  className="bg-gradient-to-r from-green-600 to-green-700"
                >
                  {updating === "update" ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update User
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminUsers;