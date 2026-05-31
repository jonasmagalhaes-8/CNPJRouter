export interface ResponseDTO<T> {
  response: T;
  mensagem: string;
  sucesso: boolean;
}
