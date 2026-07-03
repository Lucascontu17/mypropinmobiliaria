import { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  X,
  Loader2,
  AlertCircle,
  Image,
  FileWarning,
} from 'lucide-react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useEden } from '@/services/eden';
import { useSWRConfig } from 'swr';
import { cn } from '@/lib/utils';

/**
 * LogoUploadModal — Modal obligatorio que fuerza a la inmobiliaria
 * a subir su logo si aún no tiene uno configurado.
 *
 * Se integra en AdminLayout.tsx y se muestra como overlay bloqueante
 * hasta que el usuario suba un logo válido.
 */
export function LogoUploadModal() {
  const { logo_url, nombre, isLoaded, isSignedIn } = useInmobiliaria();
  const { client, isReady } = useEden();
  const { mutate } = useSWRConfig();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Determinar si la inmobiliaria necesita subir logo ──
  const needsLogo = (() => {
    if (!isLoaded || !isSignedIn) return false;
    if (!isReady) return false;
    if (!logo_url) return true;
    if (logo_url === '/logo.png') return true;
    return false;
  })();

  // ── Validar y seleccionar archivo ──
  const handleFileSelect = useCallback((file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setSelectedFile(file);
    // Revocar URL anterior si existía
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
    // Resetear el input para permitir re-seleccionar el mismo archivo
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
  };

  // ── Subir logo al servidor ──
  const handleUpload = async () => {
    if (!selectedFile || !isReady) return;

    setIsUploading(true);
    setError(null);

    try {
      // Paso 1: Subir el archivo al servidor
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', 'logos');

      // @ts-expect-error - Eden Treaty dynamic path
      const { data: uploadRes, error: uploadError } = await client.admin['upload-file'].post(formData);

      if (uploadError) {
        throw new Error(uploadError.value?.error || 'Error al subir el archivo');
      }

      if (!uploadRes?.url) {
        throw new Error('No se recibió la URL del archivo');
      }

      // Paso 2: Actualizar el logo_url de la inmobiliaria
      // @ts-expect-error - Eden Treaty dynamic path
      const { error: updateError } = await client.admin.me.put({
        logo_url: uploadRes.url,
      });

      if (updateError) {
        throw new Error('Error al actualizar el logo');
      }

      // Forzar revalidación del cache SWR para /admin/me
      // Al recibir los datos actualizados, logo_url dejará de ser undefined
      // y needsLogo retornará false, ocultando el modal automáticamente.
      await mutate('/admin/me');
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setIsUploading(false);
    }
  };

  // No renderizar si no es necesario
  if (!needsLogo) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-renta-600 to-renta-800 px-6 py-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Image className="h-5 w-5" />
            Personaliza tu Marca
          </h2>
          <p className="text-sm text-renta-200 mt-1">
            Subí el logo de tu inmobiliaria para que tus clientes te reconozcan
            en Zonatia.
          </p>
        </div>

        {/* ── Body ── */}
        <div className="p-6 space-y-5">
          {/* Alerta de logo faltante */}
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <FileWarning className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              No tenés un logo configurado.{' '}
              {nombre ? (
                <>
                  Completá el perfil de <strong>{nombre}</strong> subiendo tu
                  logo.
                </>
              ) : (
                'Subí tu logo para completar el perfil.'
              )}
            </p>
          </div>

          {/* Área de carga / Preview */}
          {!previewUrl ? (
            <div
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer',
                isDragging
                  ? 'border-renta-500 bg-renta-50'
                  : 'border-admin-border bg-white hover:bg-renta-50/50'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={onFileChange}
              />
              <div className="h-14 w-14 rounded-full bg-renta-100 flex items-center justify-center mb-3">
                <UploadCloud className="h-7 w-7 text-renta-600" />
              </div>
              <p className="text-sm font-semibold text-renta-950">
                Arrastrá tu logo aquí
              </p>
              <p className="text-xs text-renta-500 mt-1">
                o hacé clic para seleccionar (JPG, PNG, WebP. Max 5MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview del logo seleccionado */}
              <div className="flex items-center justify-center p-6 bg-renta-50 rounded-2xl border border-admin-border">
                <div className="relative h-32 w-32 rounded-xl overflow-hidden border border-admin-border bg-white p-2 shadow-sm">
                  <img
                    src={previewUrl}
                    alt="Vista previa del logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-renta-600 bg-renta-50 rounded-xl hover:bg-renta-100 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cambiar archivo
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-renta-600 to-renta-700 rounded-xl hover:from-renta-700 hover:to-renta-800 transition-all disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Subir Logo
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 bg-renta-50 border-t border-admin-border">
          <p className="text-xs text-renta-500 text-center">
            ⚠️ Este paso es obligatorio para completar la configuración de tu
            cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}
