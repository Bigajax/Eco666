import axios from 'axios';

interface Message {
  role: string;
  content: string;
}

const API_BASE_URL = '/api'; 

export const enviarMensagemParaEco = async (
  userMessages: Message[],
  userName?: string,
  userId?: string
): Promise<string | undefined> => {
  try {
    // Limita o histórico enviado para as últimas 3 mensagens
    const mensagensParaEnviar = userMessages.slice(-3);

    console.log('Enviando para backend (últimas 3 mensagens):', mensagensParaEnviar);

    const response = await axios.post(`${API_BASE_URL}/ask-eco`, { 
      messages: mensagensParaEnviar,
      userName: userName,
      userId: userId,
    });

    if (response.status >= 200 && response.status < 300) {
      if (response.data && typeof response.data.message === 'string') {
        return response.data.message; 
      } else {
        console.error('Resposta da API da Eco mal formatada:', response.data);
        throw new Error('Resposta inesperada do servidor: Mensagem não encontrada.');
      }
    } else {
      const errorMessage = response.data?.error || 'Erro desconhecido ao comunicar com o back-end.';
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('Erro ao comunicar com o back-end para a ECO (via OpenRouter):', error);
    let errorMessage = 'Ocorreu um erro ao obter a resposta da ECO.';
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) {
        errorMessage = `Erro do servidor: ${error.response.data.error}`;
      } else if (error.response?.status) {
        errorMessage = `Erro do servidor (status ${error.response.status}): ${error.response.statusText || 'Resposta inesperada'}`;
      } else if (error.request) {
        errorMessage = `Erro de rede: Nenhuma resposta recebida do servidor. Verifique se o backend está rodando em http://localhost:3001. Detalhes: ${error.message}`;
      } else {
        errorMessage = `Erro na requisição: ${error.message}`;
      }
    } else {
      errorMessage = `Erro inesperado: ${error.message || error.toString()}`;
    }
    throw new Error(errorMessage);
  }
};
