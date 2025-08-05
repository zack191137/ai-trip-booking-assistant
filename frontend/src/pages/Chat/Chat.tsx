import { useState } from 'react';
import { Box, Container } from '@mui/material';
import { ChatWindow } from '@/components/chat';
import type { Conversation } from '@/types';

const Chat = () => {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  const handleConversationChange = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

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