import { XMarkIcon, ArrowTopRightOnSquareIcon, TagIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

export default function PhotoViewModal({ isOpen, onClose, photo }) {
  if (!isOpen || !photo) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-4 pb-2 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 truncate pr-4">
                {photo.name}
              </h3>
              <div className="flex items-center space-x-2">
                <a
                  href={photo.responsiveUrls?.original || photo.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Open full size"
                >
                  <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                </a>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Image */}
              <div className="lg:col-span-2">
                <div className="aspect-w-16 aspect-h-12 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={photo.responsiveUrls?.large || photo.imageUrl}
                    alt={photo.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Photo Details</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Event Name</dt>
                      <dd className="text-sm text-gray-900 mt-1">{photo.eventName}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {photo.eventCategory}
                        </span>
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year</dt>
                      <dd className="text-sm text-gray-900 mt-1 flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {photo.year}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</dt>
                      <dd className="text-sm text-gray-900 mt-1">{photo.description}</dd>
                    </div>
                    
                    {photo.tags && photo.tags.length > 0 && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</dt>
                        <dd className="text-sm text-gray-900 mt-1">
                          <div className="flex flex-wrap gap-1">
                            {photo.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                <TagIcon className="w-3 h-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Status */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active</dt>
                      <dd className="text-sm mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          photo.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {photo.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Featured</dt>
                      <dd className="text-sm mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          photo.isFeatured 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {photo.isFeatured ? 'Featured' : 'Not Featured'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Technical Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Technical Info</h4>
                  <dl className="space-y-3">
                    {photo.width && photo.height && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dimensions</dt>
                        <dd className="text-sm text-gray-900 mt-1">{photo.width} × {photo.height} pixels</dd>
                      </div>
                    )}
                    
                    {photo.format && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Format</dt>
                        <dd className="text-sm text-gray-900 mt-1">{photo.format.toUpperCase()}</dd>
                      </div>
                    )}
                    
                    {photo.bytes && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">File Size</dt>
                        <dd className="text-sm text-gray-900 mt-1">{formatFileSize(photo.bytes)}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Upload Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Upload Info</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Uploaded By</dt>
                      <dd className="text-sm text-gray-900 mt-1 flex items-center">
                        <UserIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {photo.uploadedBy?.name || 'Unknown'}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Upload Date</dt>
                      <dd className="text-sm text-gray-900 mt-1">{formatDate(photo.createdAt)}</dd>
                    </div>
                    
                    {photo.updatedAt !== photo.createdAt && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</dt>
                        <dd className="text-sm text-gray-900 mt-1">{formatDate(photo.updatedAt)}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* URLs */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Available Sizes</h4>
                  <div className="space-y-2">
                    {photo.responsiveUrls && Object.entries(photo.responsiveUrls).map(([size, url]) => (
                      <div key={size} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 capitalize">{size}</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700 underline"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}