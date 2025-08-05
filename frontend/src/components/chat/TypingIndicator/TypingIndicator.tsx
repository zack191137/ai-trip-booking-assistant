import { Box, Avatar, keyframes } from '@mui/material';
import { SmartToy } from '@mui/icons-material';

// Typing animation keyframes
const typingAnimation = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
`;

const TypingDot = ({ delay = 0 }: { delay?: number }) => (
  <Box
    sx={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: 'text.secondary',
      animation: `${typingAnimation} 1.4s infinite ease-in-out`,
      animationDelay: `${delay}s`,
    }}
  />
);

export const TypingIndicator = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        mb: 2,
        maxWidth: '100%',
      }}
    >
      {/* Assistant Avatar */}
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: 'secondary.main',
          flexShrink: 0,
        }}
      >
        <SmartToy fontSize="small" />
      </Avatar>

      {/* Typing Indicator */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          px: 2,
          py: 1.5,
          minHeight: 40,
        }}
      >
        {/* Typing animation dots */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <TypingDot delay={0} />
          <TypingDot delay={0.2} />
          <TypingDot delay={0.4} />
        </Box>
      </Box>
    </Box>
  );
};