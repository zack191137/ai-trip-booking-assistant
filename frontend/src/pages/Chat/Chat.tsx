import { useState, useCallback } from 'react';
import { Box, Container } from '@mui/material';
import { ChatWindow } from '@/components/chat';
import type { Conversation } from '@/types';

const Chat = () => {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  
  console.log('🏡 Chat page rendered with currentConversation:', currentConversation?.id);

  const handleConversationChange = useCallback((conversation: Conversation) => {
    console.log('🔄 Chat handleConversationChange called with:', conversation.id);
    setCurrentConversation(conversation);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 2, height: '100vh' }}>
      <Box
        sx={{
          height: 'calc(100vh - 100px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ChatWindow
          conversationId={currentConversation?.id}
          onConversationChange={handleConversationChange}
        />
      </Box>
    </Container>
  );
};

export default Chat;