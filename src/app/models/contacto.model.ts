export interface ContactoCreateDto {
  id?: number;
  tipo: 'correo' | 'celular' | 'tel_oficina';
  valor: string;
  extension?: string;
  esPrincipal?: boolean;
}
