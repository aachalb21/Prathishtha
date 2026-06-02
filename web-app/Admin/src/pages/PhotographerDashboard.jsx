import { useState, useEffect } from 'react';
import MobileRestriction from '../components/MobileRestriction';
import logger from '../utils/logger';
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { photographerAPI } from '../services/api';
import PhotoUploadModal from '../components/PhotoUploadModal';
import PhotoViewModal from '../components/PhotoViewModal';
import PhotoEditModal from '../components/PhotoEditModal';
import useAuthStore from '../store/authStore';

const categories = ['All', 'Aurum', 'Yuva', 'Olympus', 'Verve', 'Others'];
const sortOptions = [
  { value: 'createdAt', label: 'Latest First' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'year', label: 'Year' },
  { value: 'eventName', label: 'Event Name' }
];

export default function PhotographerDashboard() {
  const { admin } = useAuthStore();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  
  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Filter and pagination states
  const [filters, setFilters] = useState({
    eventCategory: 'All',
    year: '',
    search: '',
    isActive: true
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch photos
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        sortBy,
        sortOrder,
        ...filters
      };
      
      // Clean up filters
      if (params.eventCategory === 'All') delete params.eventCategory;
      if (!params.year) delete params.year;
      if (!params.search) delete params.search;
      
      const response = await photographerAPI.getPhotos(params);
      setPhotos(response.photos || []);
      setPagination(response.pagination || {});
    } catch (err) {
      logger.error('Failed to fetch photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await photographerAPI.getPhotoStats();
      setStats(response.stats || {});
    } catch (err) {
      logger.error('Failed to fetch stats:', err);
    }
  };

  // Effects
  useEffect(() => {
    fetchPhotos();
  }, [currentPage, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleUploadSuccess = () => {
    fetchPhotos();
    fetchStats();
    setUploadModalOpen(false);
  };

  const handleViewPhoto = (photo) => {
    setSelectedPhoto(photo);
    setViewModalOpen(true);
  };

  const handleEditPhoto = (photo) => {
    setSelectedPhoto(photo);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchPhotos();
    fetchStats();
    setEditModalOpen(false);
  };

  const handleDeletePhoto = async (photoId, soft = false) => {
    const confirmMessage = soft 
      ? 'Deactivate this photo? (Can be reactivated later)' 
      : 'Permanently delete this photo from both database and cloud storage? This cannot be undone.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await photographerAPI.deletePhoto(photoId, soft);
      logger.log('Delete result:', result);
      
      // Show detailed success message
      if (result.warning) {
        alert(`Photo deleted with warning: ${result.warning}`);
      } else {
        alert(result.message || 'Photo deleted successfully');
      }
      
      fetchPhotos();
      fetchStats();
    } catch (err) {
      logger.error('Failed to delete photo:', err);
      alert(`Failed to delete photo: ${err.response?.data?.message || err.message}`);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Photos',
      value: stats.overview?.totalPhotos || 0,
      icon: PhotoIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Photos',
      value: stats.overview?.activePhotos || 0,
      icon: EyeIcon,
      color: 'bg-green-500'
    }
  ];

  return (
    <MobileRestriction>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Photographer Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and organize event photos
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Upload Photo
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Photo Gallery</h3>
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">Filters</span>
          </div>
        </div>
        
        <div className="grid text-black grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative ">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search photos..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.eventCategory}
            onChange={(e) => handleFilterChange('eventCategory', e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Year Filter */}
          <input
            type="number"
            placeholder="Year"
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            min="2020"
            max={new Date().getFullYear() + 1}
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            {sortOptions.map(option => (
              <option key={`${option.value}-desc`} value={`${option.value}-desc`}>
                {option.label} (Desc)
              </option>
            ))}
            {sortOptions.map(option => (
              <option key={`${option.value}-asc`} value={`${option.value}-asc`}>
                {option.label} (Asc)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="bg-white shadow rounded-lg p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">{error}</div>
            <button
              onClick={fetchPhotos}
              className="text-primary-600 hover:text-primary-700"
            >
              Try again
            </button>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No photos found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading your first photo.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Upload Photo
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Photo Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo._id}
                  className="group relative bg-gray-100 rounded-lg overflow-hidden aspect-square"
                >
                  {/* Photo */}
                  <img
                    src={photo.responsiveUrls?.medium || photo.imageUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                      <button
                        onClick={() => handleViewPhoto(photo)}
                        className="p-2 bg-white rounded-full text-gray-700 hover:text-primary-600"
                        title="View Photo"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditPhoto(photo)}
                        className="p-2 bg-white rounded-full text-gray-700 hover:text-yellow-600"
                        title="Edit Photo"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePhoto(photo._id)}
                        className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600"
                        title="Delete Photo"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Photo Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <h4 className="text-white font-medium text-sm truncate">{photo.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-300 text-xs">{photo.eventName}</span>
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded">
                        {photo.eventCategory}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.currentPage - 1) * 12) + 1} to {Math.min(pagination.currentPage * 12, pagination.totalPhotos)} of {pagination.totalPhotos} photos
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.currentPage - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 border rounded-md text-sm font-medium ${
                          pageNum === pagination.currentPage
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {uploadModalOpen && (
        <PhotoUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {viewModalOpen && selectedPhoto && (
        <PhotoViewModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          photo={selectedPhoto}
        />
      )}

      {editModalOpen && selectedPhoto && (
        <PhotoEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          photo={selectedPhoto}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
    </MobileRestriction>
  );
}