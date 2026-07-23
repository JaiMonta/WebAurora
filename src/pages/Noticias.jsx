import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Newspaper, Plus, Trash2, Edit2, Save, X, Calendar, User, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';

export default function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    imagen_url: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    cargarNoticias();
  }, []);

  async function cargarNoticias() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNoticias(data || []);
    } catch (err) {
      console.error('Error al cargar noticias:', err.message);
    } finally {
      setLoading(false);
    }
  }

  // Manejador de selección de archivo local
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Función para subir la imagen física a Supabase Storage
  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `comunicados/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('noticias')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Obtener la URL pública del archivo subido
    const { data } = supabase.storage
      .from('noticias')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.contenido.trim()) {
      alert('Por favor complete el título y el contenido de la noticia.');
      return;
    }

    try {
      setUploading(true);
      let finalImageUrl = formData.imagen_url;

      // Si el usuario seleccionó un archivo local, lo subimos primero
      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile);
      }

      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        titulo: formData.titulo.trim(),
        contenido: formData.contenido.trim(),
        imagen_url: finalImageUrl || null,
        publicado_por: user ? user.id : null
      };

      if (editingId) {
        const { error } = await supabase
          .from('noticias')
          .update({
            titulo: payload.titulo,
            contenido: payload.contenido,
            imagen_url: payload.imagen_url
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('noticias')
          .insert([payload]);

        if (error) throw error;
      }

      resetForm();
      cargarNoticias();
    } catch (err) {
      console.error('Error al guardar noticia:', err);
      alert(`Error guardando la noticia: ${err.message || 'Revisa la consola'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      titulo: item.titulo || '',
      contenido: item.contenido || '',
      imagen_url: item.imagen_url || ''
    });
    setSelectedFile(null);
    setPreviewUrl(item.imagen_url || '');
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta noticia / comunicado?')) return;
    try {
      const { error } = await supabase.from('noticias').delete().eq('id', id);
      if (error) throw error;
      cargarNoticias();
    } catch (err) {
      console.error('Error eliminando noticia:', err.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      titulo: '',
      contenido: '',
      imagen_url: ''
    });
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(prev => ({ ...prev, imagen_url: '' }));
  };

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '';
    const d = new Date(fechaIso);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Newspaper className="text-indigo-600" size={26} />
            Cartelera de Noticias y Comunicados
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Publicaciones, avisos e información importante para los residentes</p>
        </div>

        <button 
          onClick={cargarNoticias} 
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          title="Recargar noticias"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 h-fit">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            {editingId ? <Edit2 size={18} className="text-indigo-600" /> : <Plus size={18} className="text-indigo-600" />}
            {editingId ? 'Editar Comunicado' : 'Publicar Nuevo Comunicado'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Título de la Noticia</label>
              <input
                type="text"
                required
                maxLength={200}
                placeholder="Ej. Mantenimiento del ascensor principal"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Carga de Imagen por Explorador de Archivos */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Imagen adjunta</label>
              
              {!previewUrl ? (
                <label className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 hover:border-indigo-400 transition-all">
                  <Upload size={20} className="text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-600">Seleccionar imagen del equipo</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                  <img 
                    src={previewUrl} 
                    alt="Vista previa" 
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg shadow-md hover:bg-rose-700 transition-all cursor-pointer"
                    title="Quitar imagen"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contenido / Detalle</label>
              <textarea
                required
                rows={5}
                placeholder="Escribe el comunicado completo aquí..."
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Subiendo imagen...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{editingId ? 'Actualizar Noticia' : 'Publicar Noticia'}</span>
                  </>
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Cancelar edición"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Noticias / Muro */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-center gap-2">
              <RefreshCw size={18} className="animate-spin" />
              <span>Cargando noticias...</span>
            </div>
          ) : noticias.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="font-semibold">No hay comunicados publicados aún.</p>
              <p className="text-xs mt-1">Utiliza el formulario para agregar la primera noticia.</p>
            </div>
          ) : (
            noticias.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:border-slate-300 transition-all group"
              >
                {/* Imagen si la tiene */}
                {item.imagen_url && (
                  <div className="w-full h-52 overflow-hidden bg-slate-100 relative">
                    <img 
                      src={item.imagen_url} 
                      alt={item.titulo} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-base font-bold text-slate-800 leading-snug">
                      {item.titulo}
                    </h3>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {item.contenido}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      {formatearFecha(item.created_at)}
                    </span>

                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      <User size={12} className="text-slate-400" />
                      {item.publicado_por ? 'Administración' : 'Sistema'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}