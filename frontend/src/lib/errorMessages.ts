/**
 * Transform backend errors into user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    // Handle specific error patterns
    if (message.includes('403')) {
      if (message.includes('quest') || message.includes('random')) {
        return 'You need 20 coins to generate quests. Complete some quests first!';
      }
      if (message.includes('coin') || message.includes('unlock')) {
        return 'You need coins to unlock this feature. Complete quests to earn coins!';
      }
      if (message.includes('friend')) {
        return 'You need 10 coins to send friend quests.';
      }
      return 'You don\'t have permission to do this.';
    }

    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Please log in to continue.';
    }

    if (message.includes('RLS') || message.includes('row level security')) {
      return 'There was an issue uploading your attachment. Please try again.';
    }

    if (message.includes('Profile photo')) {
      if (message.includes('unlock')) {
        return 'You need 5 coins to unlock profile photos.';
      }
      if (message.includes('image')) {
        return 'Please select a valid image file.';
      }
      if (message.includes('MB')) {
        return 'Image must be smaller than 10 MB.';
      }
    }

    if (message.includes('room') || message.includes('20 coins')) {
      return 'Creating a room costs 20 coins. You don\'t have enough.';
    }

    // Return the original message if it's already user-friendly
    if (
      message.length < 100 &&
      !message.includes('JSON') &&
      !message.includes('Object') &&
      !message.includes('Error:') &&
      message.match(/^[a-zA-Z]/)
    ) {
      return message;
    }

    // For any other error, return a generic message
    return 'Something went wrong. Please try again.';
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred.';
}
