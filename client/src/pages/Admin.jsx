import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { imageApi } from '../api/imageApi';
import { 
  Upload, Image as ImageIcon, Trash2, Edit3, Loader, AlertCircle, CheckCircle, 
  Database, Calendar, X, Globe, LogOut
} from 'lucide-react';

const Admin = () => {
  const { isAuthenticated, loading: authLoading, logout, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Edit Modal State
  const [editingImage, setEditingImage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Fetch images list
  const fetchImages = async () => {
    try {
      const response = await imageApi.getImages();
      setImages(response.data);
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Could not load images list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchImages();
    }
  }, [isAuthenticated]);

  const showFeedback = (type, message) => {
    if (type === 'error') {
      setApiError(message);
      setTimeout(() => setApiError(''), 4000);
    } else {
      setApiSuccess(message);
      setTimeout(() => setApiSuccess(''), 4000);
    }
  };

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showFeedback('error', 'Unsupported format. Choose JPEG, PNG, GIF, or WebP.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showFeedback('error', 'File size exceeds 5MB limit.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSelectedFile = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload new image
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!title.trim() || !description.trim() || !imageFile) {
      showFeedback('error', 'Please fill in all fields and select an image file');
      return;
    }

    setActionLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('image', imageFile);

    try {
      const response = await imageApi.createImage(formData);
      showFeedback('success', `Exhibition "${response.data.title}" uploaded successfully.`);
      
      setTitle('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      fetchImages();
    } catch (err) {
      console.error(err);
      showFeedback('error', err.response?.data?.message || 'Error occurred while uploading the file.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id, imageTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${imageTitle}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await imageApi.deleteImage(id);
      showFeedback('success', `Successfully deleted "${imageTitle}".`);
      fetchImages();
    } catch (err) {
      console.error(err);
      showFeedback('error', err.response?.data?.message || 'Failed to delete the image.');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Modal Handlers
  const openEditModal = (image) => {
    setEditingImage(image);
    setEditTitle(image.title);
    setEditDescription(image.description);
  };

  const closeEditModal = () => {
    setEditingImage(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) {
      showFeedback('error', 'Please enter a valid title and description.');
      return;
    }

    setActionLoading(true);
    try {
      await imageApi.updateImage(editingImage._id, {
        title: editTitle,
        description: editDescription
      });
      showFeedback('success', 'Image metadata updated successfully.');
      closeEditModal();
      fetchImages();
    } catch (err) {
      console.error(err);
      showFeedback('error', err.response?.data?.message || 'Failed to update metadata.');
    } finally {
      setActionLoading(false);
    }
  };

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050';

  const totalExhibits = images.length;
  const lastUploadDate = images.length > 0 
    ? new Date(Math.max(...images.map(img => new Date(img.createdAt)))).toLocaleDateString() 
    : 'N/A';

  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '1rem' }}>
        <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Verifying credentials...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Alerts */}
      {apiError && (
        <div className="glass-panel animate-fade-in-up" style={{ 
          position: 'fixed', top: '5.5rem', right: '2rem', zIndex: 1210,
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem',
          backgroundColor: 'rgba(239, 68, 68, 0.95)', borderColor: 'rgba(239, 68, 68, 0.4)',
          color: 'white', fontSize: '0.95rem', boxShadow: 'var(--shadow-lg)'
        }}>
          <AlertCircle size={20} />
          <span>{apiError}</span>
        </div>
      )}

      {apiSuccess && (
        <div className="glass-panel animate-fade-in-up" style={{ 
          position: 'fixed', top: '5.5rem', right: '2rem', zIndex: 1210,
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem',
          backgroundColor: 'rgba(16, 185, 129, 0.95)', borderColor: 'rgba(16, 185, 129, 0.4)',
          color: 'white', fontSize: '0.95rem', boxShadow: 'var(--shadow-lg)'
        }}>
          <CheckCircle size={20} />
          <span>{apiSuccess}</span>
        </div>
      )}

      {/* Admin header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2.5rem',
        flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', fontWeight: '600' }}>Admin Control Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Logged in as <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user?.username}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            <Globe size={18} />
            <span>View Public Gallery</span>
          </button>
          <button className="btn btn-danger" onClick={logout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem', marginBottom: '2.5rem' 
      }}>
        <div className="glass-panel animate-fade-in-up" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)'
          }}>
            <Database size={22} />
          </div>
          <div>
            <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Exhibitions</span>
            <span style={{ fontSize: '1.75rem', fontWeight: '700' }}>{totalExhibits}</span>
          </div>
        </div>
        
        <div className="glass-panel animate-fade-in-up" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', animationDelay: '0.05s' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-secondary)'
          }}>
            <Calendar size={22} />
          </div>
          <div>
            <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Last Collection Update</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>{lastUploadDate}</span>
          </div>
        </div>
      </div>

      {/* Workspace Panel Split */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: '1fr', 
        gap: '2.5rem', alignItems: 'start'
      }} className="responsive-split">
        <style>{`
          @media (min-width: 1024px) {
            .responsive-split {
              grid-template-columns: 380px 1fr;
            }
          }
        `}</style>

        {/* Upload Form Panel */}
        <section className="glass-panel animate-fade-in-up" style={{ padding: '2rem', position: 'sticky', top: '90px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} style={{ color: 'var(--accent-primary)' }} />
            Publish Exhibition
          </h2>
          
          <form onSubmit={handleSubmit}>
            
            {/* Image Upload Zone */}
            <div className="form-group">
              <span className="form-label">Exhibition Image</span>
              <div 
                className={`upload-dropzone ${dragActive ? 'dragover' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Upload preview" className="upload-preview" />
                    <div className="upload-preview-overlay">
                      <Trash2 size={24} style={{ color: '#ef4444', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={handleRemoveSelectedFile} />
                      <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>Change File</span>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon size={32} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>Drag & Drop Image here</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPEG, PNG, WebP, GIF (Max 5MB)</span>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', marginTop: '0.25rem' }}>
                      Browse Files
                    </button>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                placeholder="Exhibition title"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={actionLoading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" htmlFor="desc">Description</label>
              <textarea
                id="desc"
                placeholder="Exhibition context and details..."
                className="form-input"
                rows="4"
                style={{ resize: 'vertical' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={actionLoading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Uploading to server...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Publish Item</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Catalog Grid Panel */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon size={20} style={{ color: 'var(--accent-secondary)' }} />
            Exhibitions Catalog
          </h2>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', gap: '1rem' }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading catalog...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="glass-panel" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
              <ImageIcon size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Empty Exhibition Catalog</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                Use the publish panel on the left to upload pictures and details to your public gallery.
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem' 
            }}>
              {images.map((image) => {
                const imageUrl = image.imagePath.startsWith('http') 
                  ? image.imagePath 
                  : `${backendUrl}${image.imagePath}`;

                return (
                  <div 
                    key={image._id} 
                    className="glass-panel animate-fade-in-up" 
                    style={{ 
                      borderRadius: 'var(--radius-md)', 
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      border: '1px solid var(--border-color)',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ height: '180px', overflow: 'hidden', position: 'relative', background: '#0b0f19' }}>
                      <img 
                        src={imageUrl} 
                        alt={image.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ 
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        backgroundColor: 'rgba(16, 185, 129, 0.95)', color: 'white',
                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        Live
                      </div>
                    </div>
                    
                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{image.title}</h3>
                      <p style={{ 
                        color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4',
                        marginBottom: '1.25rem', flex: 1,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {image.description}
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => openEditModal(image)}>
                          <Edit3 size={16} />
                          <span>Edit</span>
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(image._id, image.title)}>
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Edit Details Overlay Modal */}
      {editingImage && (
        <div className="lightbox-overlay" style={{ zIndex: 1200 }} onClick={closeEditModal}>
          <div 
            className="glass-panel animate-fade-in-up" 
            style={{ 
              width: '100%', maxWidth: '500px', padding: '2rem', 
              backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-hover)' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Edit Exhibition Details</h2>
              <button onClick={closeEditModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="edit-desc">Description</label>
                <textarea
                  id="edit-desc"
                  className="form-input"
                  rows="5"
                  style={{ resize: 'vertical' }}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeEditModal} disabled={actionLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Admin;
