import { DocumentoDto } from "./solicitudes-step-form.models";

/** Convierte un arreglo de claves de perfil (ej. ['A1','B2',...])
 *  a los diccionarios Text8..Text35 y Text36..Text63. */
export function mapPerfilesToTexts(perfiles: string[] = []): {
  ConsultaTextos: Record<string, string | null>,
  ModulosOperacion: Record<string, string | null>
} {
  const consulta: Record<string, string | null> = {};
  const modulos:  Record<string, string | null> = {};

  // Primeros 28 perfiles -> Text8..Text35
  for (let i = 0; i < 28; i++) {
    const key = `Text${8 + i}`;
    consulta[key] = perfiles[i] ?? null;
  }
  // Siguientes 28 -> Text36..Text63
  for (let i = 28; i < 56; i++) {
    const key = `Text${8 + i}`;
    modulos[key] = perfiles[i] ?? null;
  }

  return { ConsultaTextos: consulta, ModulosOperacion: modulos };
}

export function getExtension(fileName: string): string {
  const i = fileName.lastIndexOf('.');
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : '';
}

/** Calcula SHA-256 (hex) de un File usando WebCrypto. */
export async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Convierte tus archivos del paso 3 a DocumentoDto[] que requiere el SP. */
export async function buildDocsMetadata(files: Array<{ file: File, tipoDocumentoId: number, storageRuta?: string, storageProveedor?: string }>): Promise<DocumentoDto[]> {
  const docs = await Promise.all(files.map(async f => {
    const file = f.file;
    return {
      tipoDocumentoId: f.tipoDocumentoId,
      nombreOriginal: file.name,
      extension: getExtension(file.name),
      mimeType: file.type || 'application/octet-stream',
      tamanoBytes: file.size,
      storageProveedor: f.storageProveedor ?? 'LOCAL',
      storageRuta: f.storageRuta ?? `/uploads/${file.name}`,  // ajusta si usas otra convención
      checksumSha256: await sha256Hex(file),
    } as DocumentoDto;
  }));
  return docs;
}
