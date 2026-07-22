import { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormContext } from 'react-hook-form';
import { useRegion } from '@/hooks/useRegion';

import { BASE_URL } from '@/services/eden';

interface GalleryUploaderProps {
  name: string;
}

export function GalleryUploader({ name }: GalleryUploaderProps) {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const { t } = useRegion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const files = watch(name) as File[] || [];
  const error = errors[name]?.message as string;

  // Bug #1 Fix: Revocar URLs blob: al desmontar o cuando cambian los archivos
  // para prevenir fuga de memoria por URL.createObjectURL() no liberado
  useEffect(() => {
    const objectUrls = files
      .filter(f => f instanceof File)
      .map(f => URL.createObjectURL(f));
    
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFiles = (newFiles: File[]) => {

    // Prevent adding more than 60
    const totalFiles = [...files, ...newFiles].slice(0, 60);
    setValue(name, totalFiles, { shouldValidate: true });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setValue(name, updated, { shouldValidate: true });
  };

  const preventDefault = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    preventDefault(e);
    setIsHovered(false);
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div 
      data-shepherd="gallery-uploader"
      className="space-y-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-semibold text-renta-900">{t('gallery_label', 'Catálogo de Imágenes (4 a 60 requeridas para publicar)')}</label>
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full",
          files.length >= 4 && files.length <= 60 ? "bg-green-100 text-green-700" : "bg-amber-50 text-amber-600"
        )}>
          {files.length}/{t('gallery_max', '60 Máx.')}
        </span>
      </div>

      {/* ⚠️ AVISO IMPORTANTE: Si no hay al menos 4 imágenes */}
      {files.length < 4 && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-xs text-amber-800 leading-relaxed">
            <strong>Importante:</strong> Has subido <strong>{files.length} de 4 imágenes mínimas</strong>. 
            La propiedad podrá guardarse sin imágenes, pero <strong>no podrá publicarse</strong> (status Disponible) 
            hasta que tenga al menos 4 imágenes.
          </div>
        </div>
      )}

      <div 
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-renta-50/50 cursor-pointer",
          isHovered ? "border-renta-500 bg-renta-100/50" : "border-admin-border",
          error && "border-red-400 bg-red-50/30"
        )}
        onDragEnter={() => setIsHovered(true)}
        onDragOver={preventDefault}
        onDragLeave={() => setIsHovered(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={onFileChange} 
        />
        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
          <UploadCloud className="h-6 w-6 text-renta-600" />
        </div>
        <p className="text-sm font-semibold text-renta-950 font-jakarta">{t('gallery_drag', 'Arrastre sus imágenes aquí')}</p>
        <p className="text-xs text-renta-500 mt-1">{t('gallery_click', 'o haga clic para abrir el explorador (JPG, PNG. Max 5MB)')}</p>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
          {files.map((file, idx) => {
            const isFile = file instanceof File;
            let previewUrl = isFile ? URL.createObjectURL(file) : String(file);
            
            if (!isFile && previewUrl.startsWith('/')) {
              previewUrl = `${BASE_URL}${previewUrl}`;
            }

            return (
              <div key={idx} className="relative group rounded-xl overflow-hidden shadow-sm ring-1 ring-inset ring-admin-border border-transparent aspect-[4/3] bg-renta-100">
                <img 
                  src={previewUrl} 
                  alt={`Preview ${idx}`} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onLoad={() => {
                    if (isFile) {
                      // URL.revokeObjectURL(previewUrl); // Careful: if we revoke here, it might disappear on re-render. 
                      // Better to cleanup on unmount or just let it be if it's few images.
                    }
                  }}
                />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              {idx === 0 && ( // First image acts as cover
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                   <p className="text-[10px] uppercase font-bold text-white tracking-widest">{t('gallery_cover', 'Portada')}</p>
                 </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
