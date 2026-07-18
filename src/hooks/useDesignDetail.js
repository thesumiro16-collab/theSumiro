import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { uploadPhotosToCloudinary, deletePhotoFromCloudinary } from '../lib/cloudinary';

export function useDesignDetail(id) {
  const [design, setDesign] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchDesign = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [designRes, photosRes] = await Promise.all([
        supabase.from('designs').select('*').eq('id', id).single(),
        supabase
          .from('design_photos')
          .select('*')
          .eq('design_id', id)
          .order('sort_order', { ascending: true }),
      ]);

      if (designRes.error) throw designRes.error;
      if (photosRes.error) throw photosRes.error;

      setDesign(designRes.data);
      setPhotos(photosRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load design');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDesign();
  }, [fetchDesign]);

  const updateField = useCallback(
    async (field, value) => {
      if (!design) return;

      // Optimistic update
      const previous = design[field];
      setDesign((prev) => ({ ...prev, [field]: value }));

      const { error: updateError } = await supabase
        .from('designs')
        .update({ [field]: value })
        .eq('id', design.id);

      if (updateError) {
        // Revert on failure
        setDesign((prev) => ({ ...prev, [field]: previous }));
        addToast({ type: 'error', message: `Failed to update ${field.replace('_', ' ')}` });
      } else {
        addToast({ type: 'success', message: `${field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} updated` });
      }
    },
    [design, addToast]
  );

  const uploadAndAddPhotos = useCallback(
    async (filesToUpload, onProgress) => {
      if (!id || !design) return;
      try {
        const uploaded = await uploadPhotosToCloudinary(filesToUpload, onProgress);
        
        // Get the next sort_order
        const nextSortOrder = photos.length > 0 ? Math.max(...photos.map(p => p.sort_order)) + 1 : 0;
        
        const { data: { session } } = await supabase.auth.getSession();
        const insertData = uploaded.map((p, i) => ({
          design_id: id,
          secure_url: p.secure_url,
          public_id: p.public_id,
          sort_order: nextSortOrder + i,
          created_by: session?.user?.id
        }));
        
        const { data, error: insertError } = await supabase
          .from('design_photos')
          .insert(insertData)
          .select();
          
        if (insertError) throw insertError;
        
        setPhotos(prev => [...prev, ...data]);
        addToast({ type: 'success', message: 'Photos added successfully!' });
        return data;
      } catch (err) {
        addToast({ type: 'error', message: err.message || 'Failed to upload photos' });
        throw err;
      }
    },
    [id, design, photos, addToast]
  );

  const reorderPhotos = useCallback(
    async (reordered) => {
      // reordered: array of photo objects in the new desired order
      const updated = reordered.map((p, i) => ({ ...p, sort_order: i }));
      setPhotos(updated); // optimistic update

      try {
        // Use UPDATE (not upsert) — all rows already exist, and upsert would
        // trigger the INSERT RLS policy which requires created_by = auth.uid().
        const results = await Promise.all(
          updated.map(p =>
            supabase
              .from('design_photos')
              .update({ sort_order: p.sort_order })
              .eq('id', p.id)
          )
        );
        const firstErr = results.find(r => r.error)?.error;
        if (firstErr) throw firstErr;
      } catch (err) {
        // Revert on failure
        setPhotos(prev => [...prev].sort((a, b) => a.sort_order - b.sort_order));
        addToast({ type: 'error', message: 'Failed to save photo order' });
      }
    },
    [addToast]
  );

  const deletePhoto = useCallback(
    async (photo) => {
      try {
        // Step 1: Delete from Cloudinary storage securely via Edge Function
        if (photo.public_id) {
          try {
            await deletePhotoFromCloudinary(photo.public_id);
          } catch (cloudinaryErr) {
            console.warn('Cloudinary destroy failed, proceeding to remove from database:', cloudinaryErr);
          }
        }

        // Step 2: Delete row from Supabase database via RPC (bypasses RLS)
        const { error: deleteError } = await supabase
          .rpc('admin_delete_photo', { p_photo_id: photo.id });
          
        if (deleteError) throw deleteError;
        
        setPhotos(prev => prev.filter(p => p.id !== photo.id));
        addToast({ type: 'success', message: 'Photo deleted successfully!' });
      } catch (err) {
        addToast({ type: 'error', message: err.message || 'Failed to delete photo' });
        throw err;
      }
    },
    [addToast]
  );

  return {
    design,
    photos,
    loading,
    error,
    refetch: fetchDesign,
    updateField,
    updateFolderCount: updateField,
    uploadAndAddPhotos,
    deletePhoto,
    reorderPhotos,
  };
}
