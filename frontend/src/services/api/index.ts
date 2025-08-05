// API service exports
export { default as authService } from '../auth.service';
export { default as conversationsService } from './conversations';
export { default as tripsService } from './trips';

// Re-export types for convenience
export type {
  CreateConversationResponse,
  GetConversationsResponse,
  GetConversationResponse,
  SendMessageRequest,
  SendMessageResponse,
} from './conversations';

export type {
  GetTripsResponse,
  GetTripResponse,
  GenerateTripRequest,
  GenerateTripResponse,
  UpdateTripRequest,
  UpdateTripResponse,
  ConfirmTripResponse,
} from './trips';